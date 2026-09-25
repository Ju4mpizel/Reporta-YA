-- Migración 0004: Configuración formal de pgcrypto en esquema extensions y RLS estricto

-- 1. Asegurar extensión pgcrypto en esquema extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

-- 2. Asegurar columna password_hash
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 3. Blindaje estricto de la tabla perfiles vía RLS (Cero acceso directo público)
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reportaya_perfiles_total" ON public.perfiles;
DROP POLICY IF EXISTS "Lectura publica de perfiles" ON public.perfiles;
DROP POLICY IF EXISTS "Acceso total a perfiles" ON public.perfiles;
DROP POLICY IF EXISTS "Denegar acceso directo a perfiles" ON public.perfiles;

-- Denegar SELECT directo a anon y authenticated (la lectura y login se hacen solo vía RPC SECURITY DEFINER)
CREATE POLICY "Denegar acceso directo a perfiles"
  ON public.perfiles
  FOR ALL
  TO anon, authenticated
  USING (false);

-- 4. Funciones canónicas con search_path a extensions
CREATE OR REPLACE FUNCTION public.verificar_ci_existe(p_ci text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.perfiles 
    WHERE TRIM(perfiles.ci) = v_ci_limpio 
       OR TRIM(perfiles.ci) = split_part(v_ci_limpio, ' ', 1)
  ) THEN
    RAISE EXCEPTION 'CARNET_DUPLICADO';
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
    'ciudadano',
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

  -- Resolver nombre de rol si rol_id es texto o si proviene de tabla roles
  v_rol_nombre := COALESCE(
    (SELECT nombre FROM public.roles WHERE id::text = v_usuario.rol_id::text LIMIT 1),
    v_usuario.rol_id::text,
    'ciudadano'
  );

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

GRANT EXECUTE ON FUNCTION public.verificar_ci_existe(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_usuario(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.login_usuario(text, text) TO anon, authenticated;