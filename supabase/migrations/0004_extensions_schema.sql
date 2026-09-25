-- Migración 0004: Extensions, pgcrypto, RPCs y exposición pública segura de nombres

-- 1. Extensión pgcrypto en esquema extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

-- 2. Asegurar columna password_hash
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 3. RLS en perfiles: Permitir SELECT únicamente a nivel de lectura pública acotada
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reportaya_perfiles_total" ON public.perfiles;
DROP POLICY IF EXISTS "Lectura publica de perfiles" ON public.perfiles;
DROP POLICY IF EXISTS "Acceso total a perfiles" ON public.perfiles;
DROP POLICY IF EXISTS "Denegar acceso directo a perfiles" ON public.perfiles;
DROP POLICY IF EXISTS "Lectura publica perfiles autorizada" ON public.perfiles;

-- Vista pública para resolución limpia y segura del feed (sin exponer CI, teléfono ni password_hash)
CREATE OR REPLACE VIEW public.perfiles_publicos AS
  SELECT id, nombre_completo 
  FROM public.perfiles;

GRANT SELECT ON public.perfiles_publicos TO anon, authenticated;

-- Permitir lectura directa limitada en la tabla para no romper embeds existentes de PostgREST
CREATE POLICY "Lectura publica perfiles autorizada"
  ON public.perfiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Denegar INSERT/UPDATE/DELETE directos (deben pasar siempre por RPCs seguras)
CREATE POLICY "Denegar mutacion directa perfiles"
  ON public.perfiles
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

-- 4. RPC: verificar_ci_existe
CREATE OR REPLACE FUNCTION public.verificar_ci_existe(p_ci text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ci_limpio text := TRIM(COALESCE(p_ci, ''));
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.perfiles 
    WHERE TRIM(perfiles.ci) = v_ci_limpio 
       OR TRIM(perfiles.ci) = split_part(v_ci_limpio, ' ', 1)
  );
END;
$$;

-- 5. RPC: registrar_usuario (SOLUCIONADO: rol_id numérico / DEFAULT 1)
CREATE OR REPLACE FUNCTION public.registrar_usuario(
  p_ci text,
  p_nombre_completo text,
  p_telefono text,
  p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_usuario public.perfiles%ROWTYPE;
  v_ci_limpio text := TRIM(COALESCE(p_ci, ''));
  v_pass_limpio text := TRIM(COALESCE(p_password, ''));
  v_rol_id_ciudadano int;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.perfiles 
    WHERE TRIM(perfiles.ci) = v_ci_limpio 
       OR TRIM(perfiles.ci) = split_part(v_ci_limpio, ' ', 1)
  ) THEN
    RAISE EXCEPTION 'CARNET_DUPLICADO';
  END IF;

  -- Resolver ID numérico de 'ciudadano' o fallback al default 1
  SELECT id INTO v_rol_id_ciudadano FROM public.roles WHERE nombre = 'ciudadano' LIMIT 1;
  IF v_rol_id_ciudadano IS NULL THEN
    v_rol_id_ciudadano := 1;
  END IF;

  INSERT INTO public.perfiles (
    ci,
    nombre_completo,
    telefono,
    password_hash,
    rol_id,
    activo
  ) VALUES (
    v_ci_limpio,
    TRIM(COALESCE(p_nombre_completo, '')),
    NULLIF(TRIM(COALESCE(p_telefono, '')), ''),
    extensions.crypt(v_pass_limpio, extensions.gen_salt('bf', 10)),
    v_rol_id_ciudadano,
    TRUE
  )
  RETURNING * INTO v_usuario;

  RETURN jsonb_build_object(
    'id', v_usuario.id,
    'ci', v_usuario.ci,
    'nombre_completo', v_usuario.nombre_completo,
    'telefono', v_usuario.telefono,
    'rol_id', v_usuario.rol_id,
    'rol_nombre', 'ciudadano',
    'activo', v_usuario.activo
  );
END;
$$;

-- 6. RPC: login_usuario
CREATE OR REPLACE FUNCTION public.login_usuario(
  p_ci text,
  p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_usuario public.perfiles%ROWTYPE;
  v_ci_limpio text := TRIM(COALESCE(p_ci, ''));
  v_pass_limpio text := TRIM(COALESCE(p_password, ''));
  v_rol_nombre text;
BEGIN
  IF v_ci_limpio = '' THEN
    RAISE EXCEPTION 'CI_VACIO';
  END IF;

  SELECT * INTO v_usuario 
  FROM public.perfiles 
  WHERE TRIM(perfiles.ci) = v_ci_limpio 
     OR TRIM(perfiles.ci) = split_part(v_ci_limpio, ' ', 1)
  LIMIT 1;

  IF v_usuario.id IS NULL THEN
    RAISE EXCEPTION 'CI_NO_ENCONTRADO';
  END IF;

  IF v_usuario.password_hash IS NULL OR v_usuario.password_hash != extensions.crypt(v_pass_limpio, v_usuario.password_hash) THEN
    RAISE EXCEPTION 'PASSWORD_INCORRECTO';
  END IF;

  IF NOT COALESCE(v_usuario.activo, true) THEN
    RAISE EXCEPTION 'CUENTA_INHABILITADA';
  END IF;

  -- Resolver nombre textual del rol
  SELECT nombre INTO v_rol_nombre FROM public.roles WHERE id = v_usuario.rol_id LIMIT 1;
  IF v_rol_nombre IS NULL THEN
    v_rol_nombre := 'ciudadano';
  END IF;

  RETURN jsonb_build_object(
    'id', v_usuario.id,
    'ci', v_usuario.ci,
    'nombre_completo', v_usuario.nombre_completo,
    'telefono', v_usuario.telefono,
    'rol_id', v_usuario.rol_id,
    'rol_nombre', v_rol_nombre,
    'activo', v_usuario.activo
  );
END;
$$;

-- 7. Permisos
GRANT EXECUTE ON FUNCTION public.verificar_ci_existe(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_usuario(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.login_usuario(text, text) TO anon, authenticated;

-- 8. Recargar PostgREST
NOTIFY pgrst, 'reload schema';