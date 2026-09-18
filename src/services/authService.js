// src/services/authService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const AUTH_STORAGE_KEY = "@reporta_ya:perfil_sesion";

export const authService = {
  // Obtener la sesión guardada localmente
  async obtenerSesionLocal() {
    try {
      const json = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      return json ? JSON.parse(json) : null;
    } catch (err) {
      console.error("Error al leer sesión local:", err.message);
      return null;
    }
  },

  // Guardar la sesión localmente
  async guardarSesionLocal(perfil) {
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(perfil));
    } catch (err) {
      console.error("Error al guardar sesión local:", err.message);
    }
  },

  // Eliminar la sesión local (Logout)
  async eliminarSesionLocal() {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (err) {
      console.error("Error al eliminar sesión local:", err.message);
    }
  },

  // Validar credenciales contra la tabla perfiles
  async login(ci, password) {
    const { data, error } = await supabase
      .from("perfiles")
      .select("*, roles(id, nombre, codigo)")
      .eq("ci", ci.trim())
      .eq("password", password.trim())
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Cédula de identidad o contraseña incorrecta.");
    if (!data.activo) throw new Error("Esta cuenta se encuentra inhabilitada.");

    await this.guardarSesionLocal(data);
    return data;
  },

  // Registrar un nuevo vecino
  async registrar({ ci, nombreCompleto, telefono, password }) {
    const { data: existente } = await supabase
      .from("perfiles")
      .select("id")
      .eq("ci", ci.trim())
      .maybeSingle();

    if (existente) {
      throw new Error("Ya existe una cuenta con este número de CI.");
    }

    const { data, error } = await supabase
      .from("perfiles")
      .insert([
        {
          ci: ci.trim(),
          nombre_completo: nombreCompleto.trim(),
          telefono: telefono.trim(),
          password: password.trim(),
          rol_id: 1, // Rol vecino por defecto
          activo: true,
        },
      ])
      .select("*, roles(id, nombre, codigo)")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("Ya existe una cuenta con este número de CI.");
      }
      throw error;
    }

    await this.guardarSesionLocal(data);
    return data;
  },

  // Recargar datos actualizados del perfil desde la BD
  async recargarPerfil(usuarioId) {
    const { data, error } = await supabase
      .from("perfiles")
      .select("*, roles(id, nombre, codigo)")
      .eq("id", usuarioId)
      .single();

    if (error) throw error;
    await this.guardarSesionLocal(data);
    return data;
  },
};
