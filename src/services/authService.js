// src/services/authService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const AUTH_STORAGE_KEY = "@reporta_ya:perfil_sesion";

export const authService = {
  async obtenerSesionLocal() {
    try {
      const json = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      return json ? JSON.parse(json) : null;
    } catch (err) {
      console.error("[authService] Error al leer sesión local:", err.message);
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
    const ciBuscado = ci.trim();
    console.log("[authService] Iniciando login para CI:", ciBuscado);

    let { data: usuario, error: errConsulta } = await supabase
      .from("perfiles")
      .select("*")
      .eq("ci", ciBuscado)
      .maybeSingle();

    if (!usuario && ciBuscado.includes(" ")) {
      const soloNumero = ciBuscado.split(" ")[0].trim();
      console.log(
        "[authService] Coincidencia exacta no hallada. Probando número base:",
        soloNumero,
      );
      const res = await supabase
        .from("perfiles")
        .select("*")
        .eq("ci", soloNumero)
        .maybeSingle();

      usuario = res.data;
      errConsulta = res.error;
    }

    if (errConsulta) {
      console.error(
        "[authService] Error de consulta en BD:",
        errConsulta.message,
      );
      throw new Error(
        errConsulta.message || "Error al conectar con el servidor.",
      );
    }

    if (!usuario) {
      console.warn("[authService] CI no registrado en la base de datos.");
      throw new Error("CI_NO_ENCONTRADO");
    }

    if (String(usuario.password).trim() !== String(password).trim()) {
      console.warn(
        "[authService] Contraseña incorrecta para el usuario:",
        usuario.ci,
      );
      throw new Error("PASSWORD_INCORRECTO");
    }

    if (!usuario.activo) {
      console.warn("[authService] Cuenta inhabilitada:", usuario.ci);
      throw new Error("CUENTA_INHABILITADA");
    }

    const perfilFormateado = {
      ...usuario,
      rol_nombre: usuario.rol_id,
      roles: {
        id: usuario.rol_id,
        nombre: usuario.rol_id,
      },
    };

    await this.guardarSesionLocal(perfilFormateado);
    console.log(
      "[authService] Sesión guardada con éxito para:",
      perfilFormateado.nombre_completo,
    );
    return perfilFormateado;
  },

  async registrar({ ci, nombreCompleto, telefono, password }) {
    const ciLimpio = ci.trim();

    const { data: existente } = await supabase
      .from("perfiles")
      .select("id")
      .eq("ci", ciLimpio)
      .maybeSingle();

    if (existente) {
      throw new Error("CARNET_DUPLICADO");
    }

    const { data, error } = await supabase
      .from("perfiles")
      .insert([
        {
          ci: ciLimpio,
          nombre_completo: nombreCompleto.trim(),
          telefono: telefono ? telefono.trim() : null,
          password: String(password).trim(),
          rol_id: "ciudadano",
          activo: true,
        },
      ])
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("CARNET_DUPLICADO");
      }
      throw error;
    }

    const perfilFormateado = {
      ...data,
      rol_nombre: data.rol_id,
      roles: {
        id: data.rol_id,
        nombre: data.rol_id,
      },
    };

    await this.guardarSesionLocal(perfilFormateado);
    return perfilFormateado;
  },

  async recargarPerfil(usuarioId) {
    const { data, error } = await supabase
      .from("perfiles")
      .select("*")
      .eq("id", usuarioId)
      .single();

    if (error) throw error;
    if (!data) return null;

    const perfilFormateado = {
      ...data,
      rol_nombre: data.rol_id,
      roles: {
        id: data.rol_id,
        nombre: data.rol_id,
      },
    };

    await this.guardarSesionLocal(perfilFormateado);
    return perfilFormateado;
  },
};
