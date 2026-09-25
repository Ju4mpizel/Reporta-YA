-- ============================================================================
-- REPORTA YA! - PERMISOS Y POLÍTICAS RLS INTEGRALES
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Habilitar RLS en todas las tablas
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zonas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_incidente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apoyos_incidente ENABLE ROW LEVEL SECURITY;

-- 2. Limpieza de políticas previas para evitar colisiones
DROP POLICY IF EXISTS "Lectura publica de roles" ON public.roles;
DROP POLICY IF EXISTS "Lectura publica de zonas" ON public.zonas;
DROP POLICY IF EXISTS "Lectura publica de calles" ON public.calles;
DROP POLICY IF EXISTS "Gestion total de calles" ON public.calles;
DROP POLICY IF EXISTS "Lectura publica de categorias" ON public.categorias_incidente;
DROP POLICY IF EXISTS "Lectura publica de departamentos" ON public.departamentos;
DROP POLICY IF EXISTS "Lectura publica de perfiles" ON public.perfiles;
DROP POLICY IF EXISTS "Gestion total de incidentes" ON public.incidentes;
DROP POLICY IF EXISTS "Gestion total de apoyos" ON public.apoyos_incidente;
DROP POLICY IF EXISTS "Acceso a perfiles" ON public.perfiles;
DROP POLICY IF EXISTS "Acceso total a incidentes" ON public.incidentes;
DROP POLICY IF EXISTS "Acceso total a apoyos" ON public.apoyos_incidente;

-- 3. Catálogos y Roles (Lectura libre y gestión de calles)
CREATE POLICY "Lectura publica de roles" 
    ON public.roles FOR SELECT USING (true);

CREATE POLICY "Lectura publica de zonas" 
    ON public.zonas FOR SELECT USING (true);

CREATE POLICY "Lectura publica de calles" 
    ON public.calles FOR SELECT USING (true);

CREATE POLICY "Gestion total de calles" 
    ON public.calles FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Lectura publica de categorias" 
    ON public.categorias_incidente FOR SELECT USING (true);

CREATE POLICY "Lectura publica de departamentos" 
    ON public.departamentos FOR SELECT USING (true);

-- 4. Incidentes y Apoyos (Feed, Nuevo Reporte, Dictámenes Admin y Votos)
CREATE POLICY "Gestion total de incidentes" 
    ON public.incidentes FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Gestion total de apoyos" 
    ON public.apoyos_incidente FOR ALL USING (true) WITH CHECK (true);

-- 5. Perfiles: Permitir SELECT público (necesario para ver nombres en el feed y perfil)
-- Las contraseñas NUNCA se leen en texto plano porque se guardan hasheadas con pgcrypto.
CREATE POLICY "Lectura publica de perfiles" 
    ON public.perfiles FOR SELECT USING (true);

-- 6. RPC: Verificación de CI (para el registro)
CREATE OR REPLACE FUNCTION public.verificar_ci_existe(p_ci TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.perfiles WHERE perfiles.ci = p_ci);
END;
$$;

-- 7. RPC: Registro Seguro
CREATE OR REPLACE FUNCTION public.registrar_usuario(
  p_ci TEXT,
  p_nombre_completo TEXT,
  p_telefono TEXT,
  p_password TEXT
)
RETURNS TABLE (
  id UUID, 
  ci VARCHAR(20), 
  nombre_completo VARCHAR(150), 
  telefono VARCHAR(20),
  rol_id INT, 
  rol_nombre VARCHAR(50), 
  activo BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_rol_ciudadano INT;
BEGIN
  IF EXISTS (SELECT 1 FROM public.perfiles WHERE perfiles.ci = p_ci) THEN
    RAISE EXCEPTION 'CARNET_DUPLICADO';
  END IF;

  SELECT roles.id INTO v_rol_ciudadano FROM public.roles WHERE roles.nombre = 'ciudadano';

  INSERT INTO public.perfiles (ci, nombre_completo, telefono, password_hash, rol_id, activo)
  VALUES (
    p_ci, 
    p_nombre_completo, 
    p_telefono, 
    crypt(p_password, gen_salt('bf')), 
    COALESCE(v_rol_ciudadano, 1), 
    TRUE
  )
  RETURNING perfiles.id INTO v_id;

  RETURN QUERY
  SELECT p.id, p.ci, p.nombre_completo, p.telefono, p.rol_id, r.nombre, p.activo
  FROM public.perfiles p 
  JOIN public.roles r ON r.id = p.rol_id
  WHERE p.id = v_id;
END;
$$;

-- 8. RPC: Login Seguro con Códigos de Error Específicos
CREATE OR REPLACE FUNCTION public.login_usuario(p_ci TEXT, p_password TEXT)
RETURNS TABLE (
  id UUID, 
  ci VARCHAR(20), 
  nombre_completo VARCHAR(150), 
  telefono VARCHAR(20),
  rol_id INT, 
  rol_nombre VARCHAR(50), 
  activo BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.perfiles%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.perfiles WHERE perfiles.ci = p_ci;

  -- 1. Validar si el carnet está empadronado
  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'CI_NO_ENCONTRADO';
  END IF;

  -- 2. Validar contraseña contra el hash de blowfish
  IF v_row.password_hash IS NULL OR v_row.password_hash <> crypt(p_password, v_row.password_hash) THEN
    RAISE EXCEPTION 'PASSWORD_INCORRECTO';
  END IF;

  -- 3. Validar si la cuenta está habilitada
  IF NOT v_row.activo THEN
    RAISE EXCEPTION 'CUENTA_INHABILITADA';
  END IF;

  RETURN QUERY
  SELECT p.id, p.ci, p.nombre_completo, p.telefono, p.rol_id, r.nombre, p.activo
  FROM public.perfiles p 
  JOIN public.roles r ON r.id = p.rol_id
  WHERE p.id = v_row.id;
END;
$$;

-- 9. Conceder permisos de ejecución
GRANT EXECUTE ON FUNCTION public.verificar_ci_existe TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_usuario TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.login_usuario TO anon, authenticated;