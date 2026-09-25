// src/services/authService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const AUTH_STORAGE_KEY = "@reporta_ya:perfil_sesion";

export const authService = {
  async obtenerSesionLocal() {
    try {
      const json = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  },

  async guardarSesionLocal(perfil) {
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(perfil));
    } catch (err) {
      console.error(
        "[authService] Error al guardar sesión local:",
        err.message,
      );
    }
  },

  async eliminarSesionLocal() {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (err) {
      console.error(
        "[authService] Error al eliminar sesión local:",
        err.message,
      );
    }
  },

  async login(ci, password) {
    const { data, error } = await supabase.rpc("login_usuario", {
      p_ci: String(ci || "").trim(),
      p_password: String(password || "").trim(),
    });

    if (error) {
      throw new Error(
        error.message || "Credenciales incorrectas o cuenta inhabilitada.",
      );
    }

    const perfil = Array.isArray(data) ? data[0] : data;
    if (!perfil) {
      throw new Error("CI_NO_ENCONTRADO");
    }

    // Preservar rol_nombre devuelto por la BD
    const nombreRol =
      perfil.rol_nombre ||
      (typeof perfil.rol_id === "string" ? perfil.rol_id : "ciudadano");

    const perfilFormateado = {
      ...perfil,
      rol_nombre: nombreRol,
      roles: {
        id: perfil.rol_id,
        nombre: nombreRol,
      },
    };

    await this.guardarSesionLocal(perfilFormateado);
    return perfilFormateado;
  },

  async registrar({ ci, nombreCompleto, telefono, password }) {
    const { data, error } = await supabase.rpc("registrar_usuario", {
      p_ci: String(ci || "").trim(),
      p_nombre_completo: String(nombreCompleto || "").trim(),
      p_telefono: telefono ? String(telefono).trim() : null,
      p_password: String(password || "").trim(),
    });

    if (error) {
      if (
        error.code === "23505" ||
        /CARNET_DUPLICADO|ya existe/i.test(error.message)
      ) {
        throw new Error("CARNET_DUPLICADO");
      }
      throw new Error(error.message || "Error al procesar el empadronamiento.");
    }

    const perfil = Array.isArray(data) ? data[0] : data;
    const nombreRol =
      perfil.rol_nombre ||
      (typeof perfil.rol_id === "string" ? perfil.rol_id : "ciudadano");

    const perfilFormateado = {
      ...perfil,
      rol_nombre: nombreRol,
      roles: {
        id: perfil.rol_id,
        nombre: nombreRol,
      },
    };

    await this.guardarSesionLocal(perfilFormateado);
    return perfilFormateado;
  },
};
