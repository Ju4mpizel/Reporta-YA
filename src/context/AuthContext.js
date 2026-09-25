// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    restaurarSesion();
  }, []);

  const restaurarSesion = async () => {
    try {
      setCargando(true);
      const sesionGuardada = await authService.obtenerSesionLocal();
      if (sesionGuardada) {
        setPerfil(sesionGuardada);
      }
    } catch (err) {
      console.warn("[AuthContext] Error al restaurar sesión:", err.message);
    } finally {
      setCargando(false);
    }
  };

  const login = async (ci, password) => {
    try {
      setCargando(true);
      const usuarioAutenticado = await authService.login(ci, password);
      setPerfil(usuarioAutenticado);
      return usuarioAutenticado;
    } finally {
      setCargando(false);
    }
  };

  const registrar = async (datos) => {
    try {
      setCargando(true);
      const nuevoUsuario = await authService.registrar(datos);
      setPerfil(nuevoUsuario);
      return nuevoUsuario;
    } finally {
      setCargando(false);
    }
  };

  const logout = async () => {
    try {
      await authService.eliminarSesionLocal();
      setPerfil(null);
    } catch (err) {
      console.error("[AuthContext] Error al cerrar sesión:", err.message);
    }
  };

  const esAdmin =
    perfil?.roles?.nombre === "admin" ||
    perfil?.rol_nombre === "admin" ||
    perfil?.rol_id === "admin" ||
    perfil?.rol_id === 3;

  return (
    <AuthContext.Provider
      value={{
        perfil,
        estaAutenticado: Boolean(perfil), // 👈 ¡AQUÍ ESTÁ LA MAGIA!
        cargando,
        login,
        registrar,
        logout,
        esAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
