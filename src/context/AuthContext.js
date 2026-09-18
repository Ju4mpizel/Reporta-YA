// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../services/supabase";

const AuthContext = createContext({});
const AUTH_STORAGE_KEY = "@reporta_ya:perfil_sesion";

export const AuthProvider = ({ children }) => {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Restaurar sesión guardada al abrir la aplicación
  useEffect(() => {
    restaurarSesion();
  }, []);

  async function restaurarSesion() {
    try {
      const sesionGuardada = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (sesionGuardada) {
        setPerfil(JSON.parse(sesionGuardada));
      }
    } catch (err) {
      console.error("Error al restaurar sesión:", err.message);
    } finally {
      setCargando(false);
    }
  }

  // Iniciar sesión validando CI y Password en la tabla perfiles
  const login = async (ci, password) => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from("perfiles")
        .select("*, roles(id, nombre, codigo)")
        .eq("ci", ci.trim())
        .eq("password", password.trim())
        .maybeSingle();

      if (error) throw error;
      if (!data)
        throw new Error("Cédula de identidad o contraseña incorrecta.");
      if (!data.activo)
        throw new Error("Esta cuenta se encuentra inhabilitada.");

      setPerfil(data);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
      return data;
    } finally {
      setCargando(false);
    }
  };

  // Registro para nuevos vecinos
  const registrar = async ({ ci, nombreCompleto, telefono, password }) => {
    setCargando(true);
    try {
      // 1 representa el rol ciudadano por defecto
      const { data, error } = await supabase
        .from("perfiles")
        .insert([
          {
            ci: ci.trim(),
            nombre_completo: nombreCompleto.trim(),
            telefono: telefono.trim(),
            password: password.trim(),
            rol_id: 1,
            activo: true,
          },
        ])
        .select("*, roles(id, nombre, codigo)")
        .single();

      if (error) {
        if (error.code === "23505")
          throw new Error("Ya existe una cuenta con este número de CI.");
        throw error;
      }

      setPerfil(data);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
      return data;
    } finally {
      setCargando(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setPerfil(null);
    } catch (err) {
      console.error("Error al cerrar sesión:", err.message);
    }
  };

  // Evaluación flexible de admin (por código 'admin', nombre o rol_id 2)
  const esAdmin =
    perfil?.roles?.codigo === "admin" ||
    perfil?.roles?.nombre?.toLowerCase() === "administrador" ||
    perfil?.rol_id === 2 ||
    perfil?.rol_id === "admin";

  return (
    <AuthContext.Provider
      value={{
        perfil,
        cargando,
        login,
        registrar,
        logout,
        estaAutenticado: !!perfil,
        esAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
