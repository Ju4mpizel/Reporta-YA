-- ==========================================================
-- Cocha Reporta · Migración 0001 · Base de datos inicial
-- TD02 (Base de datos y servicios) · TD03 (Storage)
-- Zona piloto: Cala Cala, Distrito 12
--
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- Nota: esquema definitivo del grupo (fusiona las propuestas).
-- ==========================================================

-- ==========================================================
-- 1. TIPOS ENUMERADOS
-- ==========================================================
CREATE TYPE public.rol_usuario AS ENUM ('ciudadano', 'admin');
CREATE TYPE public.estado_usuario AS ENUM ('activo', 'suspendido', 'pendiente');

CREATE TYPE public.categoria_reporte AS ENUM (
  'bache_asfalto',
  'alumbrado_publico',
  'arbol_caido_poda',
  'basura_acumulada',
  'alcantarilla_desague',
  'fuga_agua',
  'otro'
);

CREATE TYPE public.estado_reporte AS ENUM (
  'en_revision',         -- Recién enviado por el ciudadano
  'realizando_trabajos', -- Cuadrilla asignada / en camino
  'hecho',               -- Solucionado y verificado
  'rechazado'            -- Reporte falso, duplicado o fuera de jurisdicción
);

-- ==========================================================
-- 2. TABLAS GEOGRÁFICAS (ZONA Y CALLES DE CALA CALA)
-- ==========================================================
CREATE TABLE public.zonas (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  distrito INTEGER NOT NULL,
  lat_centro DOUBLE PRECISION NOT NULL,
  lng_centro DOUBLE PRECISION NOT NULL
);

CREATE TABLE public.calles (
  id SERIAL PRIMARY KEY,
  zona_id INTEGER REFERENCES public.zonas(id) ON DELETE RESTRICT,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Calle', -- 'Avenida', 'Calle', 'Pasaje', 'Plazuela'
  CONSTRAINT uq_calle_zona UNIQUE (nombre, zona_id)
);

-- ==========================================================
-- 3. PERFILES DE USUARIO (CON ESTADOS Y CI)
-- ==========================================================
CREATE TABLE public.perfiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  ci TEXT NOT NULL UNIQUE,
  nombre_completo TEXT NOT NULL,
  telefono TEXT,
  rol public.rol_usuario NOT NULL DEFAULT 'ciudadano',
  estado public.estado_usuario NOT NULL DEFAULT 'activo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 4. TABLA DE REPORTES CIUDADANOS
-- ==========================================================
CREATE TABLE public.reportes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES public.perfiles(id) ON DELETE RESTRICT NOT NULL,
  calle_id INTEGER REFERENCES public.calles(id) ON DELETE RESTRICT NOT NULL,
  categoria public.categoria_reporte NOT NULL,
  titulo VARCHAR(120) NOT NULL,
  descripcion TEXT NOT NULL,
  referencia_adicional TEXT,              -- Ej: "Frente a la farmacia, puerta roja"
  latitud DOUBLE PRECISION NOT NULL,      -- Marcador GPS preciso
  longitud DOUBLE PRECISION NOT NULL,
  foto_url TEXT,                          -- URL del bucket en Supabase Storage
  estado public.estado_reporte NOT NULL DEFAULT 'en_revision',
  nota_alcaldia TEXT,                     -- Respuesta o justificación del técnico
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 4b. TABLA DE APOYOS VECINALES (+1)  ·  HU05
-- ==========================================================
CREATE TABLE public.apoyos (
  usuario_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
  reporte_id UUID REFERENCES public.reportes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (usuario_id, reporte_id) -- Un ciudadano apoya una sola vez
);

-- Índices para optimizar filtros rápidos en mapas y listados
CREATE INDEX idx_reportes_calle ON public.reportes(calle_id);
CREATE INDEX idx_reportes_estado ON public.reportes(estado);
CREATE INDEX idx_reportes_usuario ON public.reportes(usuario_id);
CREATE INDEX idx_reportes_categoria ON public.reportes(categoria);
CREATE INDEX idx_apoyos_reporte ON public.apoyos(reporte_id);

-- ==========================================================
-- 5. TRIGGER: CREAR PERFIL AUTOMÁTICAMENTE AL REGISTRARSE
-- Los datos llegan en raw_user_meta_data desde `authService.registrarse`
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_nuevo_usuario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfiles (id, ci, nombre_completo, telefono, rol)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'ci',
    NEW.raw_user_meta_data ->> 'nombre_completo',
    NEW.raw_user_meta_data ->> 'telefono',
    COALESCE((NEW.raw_user_meta_data ->> 'rol')::public.rol_usuario, 'ciudadano')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_nuevo_usuario();

-- ==========================================================
-- 6. RPC: APOYO VECINAL (+1)
-- Inserta el apoyo (sin duplicados) y devuelve el total calculado
-- ==========================================================
CREATE OR REPLACE FUNCTION public.apoyar_reporte(p_reporte_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  INSERT INTO public.apoyos (usuario_id, reporte_id)
  VALUES (auth.uid(), p_reporte_id)
  ON CONFLICT (usuario_id, reporte_id) DO NOTHING;
  SELECT COUNT(*) FROM public.apoyos WHERE reporte_id = p_reporte_id;
$$;

-- ==========================================================
-- 7. POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY)
-- ==========================================================
ALTER TABLE public.zonas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apoyos ENABLE ROW LEVEL SECURITY;

-- Catálogos: lectura pública para cualquier usuario autenticado
CREATE POLICY "Lectura libre de zonas" ON public.zonas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lectura libre de calles" ON public.calles FOR SELECT TO authenticated USING (true);

-- Perfiles: el usuario ve su perfil; los administradores ven y modifican todos (ej. suspender)
CREATE POLICY "Lectura de perfiles" ON public.perfiles FOR SELECT TO authenticated USING (
  auth.uid() = id OR EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin')
);

CREATE POLICY "Modificacion de perfiles propio o admin" ON public.perfiles FOR UPDATE TO authenticated USING (
  auth.uid() = id OR EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin')
);

-- Perfiles: inserción propia (respaldo, aunque el trigger ya la crea al registrarse)
CREATE POLICY "Insercion de perfil propia" ON public.perfiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Reportes:
-- 1. Cualquiera autenticado puede ver reportes
CREATE POLICY "Lectura de reportes" ON public.reportes FOR SELECT TO authenticated USING (true);

-- 2. Solo usuarios 'activos' pueden crear reportes
CREATE POLICY "Insertar reportes usuarios activos" ON public.reportes FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = usuario_id
  AND EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND estado = 'activo')
);

-- 3. Solo admins actualizan estado o notas del reporte
CREATE POLICY "Admins actualizan reportes" ON public.reportes FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin')
);

-- 4. Solo admins eliminan reportes
CREATE POLICY "Admins borran reportes" ON public.reportes FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin')
);

-- Apoyos (+1): todos los autenticados pueden leerlos; cada uno solo inserta los suyos
CREATE POLICY "Lectura de apoyos" ON public.apoyos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Insercion de apoyos propios" ON public.apoyos FOR INSERT TO authenticated
WITH CHECK (auth.uid() = usuario_id);

-- ==========================================================
-- 8. DATOS INICIALES (SEED)
-- ==========================================================
-- Zona piloto: Cala Cala (coordenadas de la Plaza de Cala Cala)
INSERT INTO public.zonas (id, nombre, distrito, lat_centro, lng_centro)
VALUES (1, 'Cala Cala', 12, -17.373412, -66.162534)
ON CONFLICT (id) DO NOTHING;

-- Calles y avenidas de Cala Cala
INSERT INTO public.calles (zona_id, tipo, nombre) VALUES
(1, 'Avenida', 'Libertador Bolívar'),
(1, 'Avenida', 'América'),
(1, 'Avenida', 'Gualberto Villarroel'),
(1, 'Avenida', 'Melchor Pérez de Holguín'),
(1, 'Avenida', 'Atahuallpa'),
(1, 'Avenida', 'Juan de la Rosa'),
(1, 'Calle',   'Man Césped'),
(1, 'Calle',   'Huallparrimachi'),
(1, 'Calle',   'Teniente Arévalo'),
(1, 'Calle',   'Teudocio Carvallo'),
(1, 'Calle',   'Nataniel Aguirre'),
(1, 'Calle',   'Calama (Norte)'),
(1, 'Calle',   'Goytia'),
(1, 'Calle',   'Adela Zamudio'),
(1, 'Calle',   'José Ballivián'),
(1, 'Calle',   'Ramiro Condarco'),
(1, 'Calle',   'Pantaleón Dalence'),
(1, 'Calle',   'Isaac Tamayo'),
(1, 'Calle',   'Gral. Inofuentes'),
(1, 'Calle',   'Guzmán Quinteros'),
(1, 'Calle',   'Cnl. Cornejo'),
(1, 'Calle',   'Cnl. López'),
(1, 'Pasaje',  'Gutiérrez'),
(1, 'Pasaje',  'Los Álamos'),
(1, 'Pasaje',  'Santa Ana'),
(1, 'Plazuela', 'Plaza de Cala Cala')
ON CONFLICT (id) DO NOTHING;

-- ==========================================================
-- 9. STORAGE (TD03): bucket público para fotos de reportes
-- ==========================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('fotos-reportes', 'fotos-reportes', TRUE, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública de las fotos (para verlas sin login)
CREATE POLICY "fotos lectura publica" ON storage.objects
  FOR SELECT USING (bucket_id = 'fotos-reportes');

-- Subida de fotos solo para usuarios autenticados
CREATE POLICY "fotos subida autenticados" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'fotos-reportes'
    AND auth.uid() IS NOT NULL
  );