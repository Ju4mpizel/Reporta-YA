-- ============================================================================
-- BASE DE DATOS CANÓNICA - REPORTA YA! (DISTRITO 12 CALA CALA)
-- ============================================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. TABLA: roles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

INSERT INTO public.roles (nombre, descripcion) VALUES
    ('ciudadano', 'Vecino registrado del distrito'),
    ('funcionario', 'Técnico de la subalcaldía asignado a cuadrillas'),
    ('admin', 'Administrador de la subalcaldía municipal')
ON CONFLICT (nombre) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. TABLA: perfiles (Usuarios del sistema)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ci VARCHAR(20) NOT NULL UNIQUE,
    nombre_completo VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    password_hash TEXT,
    rol_id INT REFERENCES public.roles(id) DEFAULT 1,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. TABLAS DE CATASTRO: zonas y calles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.zonas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    distrito INT NOT NULL DEFAULT 12,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.calles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'calle', -- 'calle', 'avenida', 'pasaje', 'plaza'
    zona_id INT REFERENCES public.zonas(id) ON DELETE CASCADE,
    latitud NUMERIC(10, 7),
    longitud NUMERIC(10, 7),
    google_maps_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. TABLAS DE GESTIÓN: categorias_incidente y departamentos
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categorias_incidente (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.departamentos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.categorias_incidente (nombre, descripcion) VALUES
    ('Bache o asfalto deteriorado', 'Daño en calzada vehicular'),
    ('Luminaria pública apagada', 'Postes sin iluminación nocturna'),
    ('Alcantarilla o sumidero tapado', 'Obstrucción pluvial o drenaje'),
    ('Acumulación de basura', 'Microbasurales no autorizados'),
    ('Árbol o rama en riesgo', 'Peligro de caída sobre vía o tendido'),
    ('Fuga de agua potable o alcantarillado', 'Fugas de SEMAPA o similar')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO public.departamentos (nombre, activo) VALUES
    ('Obras Públicas y Mantenimiento Vial', true),
    ('Alumbrado Público', true),
    ('Medio Ambiente y Áreas Verdes', true),
    ('Drenaje y Saneamiento Básico', true),
    ('Defensoría y Seguridad Ciudadana', true)
ON CONFLICT (nombre) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. TABLA: incidentes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.incidentes (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    foto_url TEXT,
    estado VARCHAR(50) DEFAULT 'en_revision', -- 'en_revision', 'realizando_trabajos', 'hecho', 'rechazado'
    activo BOOLEAN DEFAULT TRUE,
    usuario_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    calle_id INT REFERENCES public.calles(id) ON DELETE RESTRICT,
    categoria_id INT REFERENCES public.categorias_incidente(id) ON DELETE RESTRICT,
    departamento_id INT REFERENCES public.departamentos(id) ON DELETE SET NULL,
    nota_alcaldia TEXT,
    maps_url TEXT,
    total_apoyos INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. TABLA: apoyos_incidente
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.apoyos_incidente (
    id BIGSERIAL PRIMARY KEY,
    incidente_id BIGINT REFERENCES public.incidentes(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_incidente_usuario UNIQUE (incidente_id, usuario_id)
);

-- ----------------------------------------------------------------------------
-- 7. FUNCIÓN RPC: toggle_apoyo (Atómico con conteo)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.toggle_apoyo(p_incidente_id BIGINT, p_usuario_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existe BOOLEAN;
    v_nuevo_total INT;
    v_apoyado BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.apoyos_incidente 
        WHERE incidente_id = p_incidente_id AND usuario_id = p_usuario_id
    ) INTO v_existe;

    IF v_existe THEN
        DELETE FROM public.apoyos_incidente 
        WHERE incidente_id = p_incidente_id AND usuario_id = p_usuario_id;
        
        UPDATE public.incidentes 
        SET total_apoyos = GREATEST(0, total_apoyos - 1),
            updated_at = NOW()
        WHERE id = p_incidente_id
        RETURNING total_apoyos INTO v_nuevo_total;
        
        v_apoyado := false;
    ELSE
        INSERT INTO public.apoyos_incidente (incidente_id, usuario_id)
        VALUES (p_incidente_id, p_usuario_id);
        
        UPDATE public.incidentes 
        SET total_apoyos = total_apoyos + 1,
            updated_at = NOW()
        WHERE id = p_incidente_id
        RETURNING total_apoyos INTO v_nuevo_total;
        
        v_apoyado := true;
    END IF;

    RETURN jsonb_build_object(
        'apoyado', v_apoyado,
        'total_apoyos', v_nuevo_total
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 8. POLÍTICAS RLS (Seguridad a Nivel de Fila)
-- ----------------------------------------------------------------------------
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zonas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_incidente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apoyos_incidente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de catálogos y roles" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Lectura pública de zonas" ON public.zonas FOR SELECT USING (true);
CREATE POLICY "Lectura pública de calles" ON public.calles FOR SELECT USING (true);
CREATE POLICY "Admin inserta calles" ON public.calles FOR ALL USING (true);
CREATE POLICY "Lectura pública de categorías" ON public.categorias_incidente FOR SELECT USING (true);
CREATE POLICY "Lectura pública de departamentos" ON public.departamentos FOR SELECT USING (true);
CREATE POLICY "Lectura y registro de perfiles" ON public.perfiles FOR ALL USING (true);
CREATE POLICY "Acceso a incidentes" ON public.incidentes FOR ALL USING (true);
CREATE POLICY "Acceso a apoyos" ON public.apoyos_incidente FOR ALL USING (true);

-- ----------------------------------------------------------------------------
-- 9. HABILITAR REALTIME
-- ----------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidentes;