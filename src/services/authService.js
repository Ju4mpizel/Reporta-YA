import { supabase } from "./supabase";

export async function registrarse({
  email,
  password,
  ci,
  nombreCompleto,
  telefono = "",
  rol = "ciudadano",
}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { ci, nombre_completo: nombreCompleto, telefono, rol },
    },
  });
  if (error) throw error;
  return data;
}

export async function iniciarSesion(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function obtenerSesion() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function escucharSesion(manejador) {
  const { data, error } = supabase.auth.onAuthStateChange(manejador);
  if (error) throw error;
  return data.subscription;
}

export async function obtenerPerfil() {
  const session = await obtenerSesion();
  if (!session) return null;
  const { data, error } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", session.user.id)
    .single();
  if (error) throw error;
  return data;
}

export async function editarPerfil({ nombreCompleto, telefono }) {
  const session = await obtenerSesion();
  if (!session) throw new Error("No hay sesión iniciada");

  const { data, error } = await supabase
    .from("perfiles")
    .update({
      nombre_completo: nombreCompleto,
      telefono,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}