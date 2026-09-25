-- ----------------------------------------------------------------------------
-- 0002_auth_seguro.sql
-- Mueve la verificación de contraseña al servidor (pgcrypto + RPC) y cierra
-- el acceso directo de lectura/escritura a `perfiles`.
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Si la columna todavía se llama distinto o guarda texto plano, corrígela primero.
-- (Si ya tienes filas con contraseñas en texto plano en password_hash, hay que
--  re-hashearlas antes de aplicar esto; con datos de prueba, mejor truncar la tabla.)

CREATE OR REPLACE FUNCTION public.registrar_usuario(
  p_ci TEXT,
  p_nombre_completo TEXT,
  p_telefono TEXT,
  p_password TEXT
)
RETURNS TABLE (
  id UUID, ci TEXT, nombre_completo TEXT, telefono TEXT,
  rol_id INT, rol_nombre TEXT, activo BOOLEAN
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
    RAISE EXCEPTION 'Ya existe una cuenta con este número de CI.';
  END IF;

  SELECT roles.id INTO v_rol_ciudadano FROM public.roles WHERE roles.nombre = 'ciudadano';

  INSERT INTO public.perfiles (ci, nombre_completo, telefono, password_hash, rol_id, activo)
  VALUES (p_ci, p_nombre_completo, p_telefono, crypt(p_password, gen_salt('bf')), v_rol_ciudadano, TRUE)
  RETURNING perfiles.id INTO v_id;

  RETURN QUERY
  SELECT p.id, p.ci, p.nombre_completo, p.telefono, p.rol_id, r.nombre, p.activo
  FROM public.perfiles p JOIN public.roles r ON r.id = p.rol_id
  WHERE p.id = v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.login_usuario(p_ci TEXT, p_password TEXT)
RETURNS TABLE (
  id UUID, ci TEXT, nombre_completo TEXT, telefono TEXT,
  rol_id INT, rol_nombre TEXT, activo BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.perfiles%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.perfiles WHERE perfiles.ci = p_ci;

  IF v_row.id IS NULL
     OR v_row.password_hash IS NULL
     OR v_row.password_hash <> crypt(p_password, v_row.password_hash) THEN
    RAISE EXCEPTION 'Cédula de identidad o contraseña incorrecta.';
  END IF;

  IF NOT v_row.activo THEN
    RAISE EXCEPTION 'Esta cuenta se encuentra inhabilitada.';
  END IF;

  RETURN QUERY
  SELECT p.id, p.ci, p.nombre_completo, p.telefono, p.rol_id, r.nombre, p.activo
  FROM public.perfiles p JOIN public.roles r ON r.id = p.rol_id
  WHERE p.id = v_row.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_usuario TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.login_usuario TO anon, authenticated;

-- Cierra el acceso directo a `perfiles`: ya no se puede leer/escribir la tabla
-- entera (ni el password_hash) desde el cliente; todo pasa por las RPC de arriba.
DROP POLICY IF EXISTS "Lectura y registro de perfiles" ON public.perfiles;