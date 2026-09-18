// src/context/AuthContext.js
import React, { createContext, useContext, useState } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(false);

  // Iniciar sesión validando CI y Password en la tabla perfiles
  const login = async (ci, password) => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from("perfiles")
        .select("*, roles(nombre)")
        .eq("ci", ci.trim())
        .eq("password", password.trim())
        .maybeSingle();

      if (error) throw error;
      if (!data)
        throw new Error("Cédula de identidad o contraseña incorrecta.");
      if (!data.activo)
        throw new Error("Esta cuenta se encuentra inhabilitada.");

      setPerfil(data);
      return data;
    } finally {
      setCargando(false);
    }
  };

  // Registro para nuevos vecinos
  const registrar = async ({ ci, nombreCompleto, telefono, password }) => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from("perfiles")
        .insert([
          {
            ci: ci.trim(),
            nombre_completo: nombreCompleto.trim(),
            telefono: telefono.trim(),
            password: password.trim(),
            rol_id: "ciudadano",
            activo: true,
          },
        ])
        .select("*, roles(nombre)")
        .single();

      if (error) {
        if (error.code === "23505")
          throw new Error("Ya existe una cuenta con este número de CI.");
        throw error;
      }

      setPerfil(data);
      return data;
    } finally {
      setCargando(false);
    }
  };

  const logout = () => {
    setPerfil(null);
  };

  return (
    <AuthContext.Provider
      value={{
        perfil,
        cargando,
        login,
        registrar,
        logout,
        estaAutenticado: !!perfil,
        esAdmin: perfil?.rol_id === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
