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

  // Validar credenciales contra la RPC segura en el servidor
  async login(ci, password) {
    const { data, error } = await supabase.rpc("login_usuario", {
      p_ci: ci.trim(),
      p_password: password.trim(),
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

    // Normalizar objeto de roles para la navegación y contexto
    const perfilFormateado = {
      ...perfil,
      roles: {
        id: perfil.rol_id,
        nombre: perfil.rol_nombre,
      },
    };

    await this.guardarSesionLocal(perfilFormateado);
    return perfilFormateado;
  },

  // Registrar un nuevo vecino mediante la RPC segura
  async registrar({ ci, nombreCompleto, telefono, password }) {
    const { data, error } = await supabase.rpc("registrar_usuario", {
      p_ci: ci.trim(),
      p_nombre_completo: nombreCompleto.trim(),
      p_telefono: telefono ? telefono.trim() : null,
      p_password: password.trim(),
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
    const perfilFormateado = {
      ...perfil,
      roles: {
        id: perfil.rol_id,
        nombre: perfil.rol_nombre,
      },
    };

    await this.guardarSesionLocal(perfilFormateado);
    return perfilFormateado;
  },

  // Recargar datos actualizados del perfil desde la BD
  async recargarPerfil(usuarioId) {
    const { data, error } = await supabase
      .from("perfiles")
      .select(
        "id, ci, nombre_completo, telefono, rol_id, activo, roles(id, nombre, descripcion)",
      )
      .eq("id", usuarioId)
      .single();

    if (error) throw error;
    await this.guardarSesionLocal(data);
    return data;
  },
};
