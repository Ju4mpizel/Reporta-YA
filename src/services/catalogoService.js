// src/services/catalogoService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const STORAGE_ZONAS = "@reporta_ya:cache_zonas";
const STORAGE_CALLES = "@reporta_ya:cache_calles";
const STORAGE_CATEGORIAS = "@reporta_ya:cache_categorias";
const STORAGE_DEPARTAMENTOS = "@reporta_ya:cache_departamentos";

const leerCacheSegura = async (key) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const catalogoService = {
  async obtenerZonas() {
    try {
      const { data, error } = await supabase
        .from("zonas")
        .select("id, nombre, distrito")
        .order("nombre");

      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        await AsyncStorage.setItem(STORAGE_ZONAS, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn(
        "[catalogoService] Usando caché local de zonas:",
        err.message,
      );
    }
    return await leerCacheSegura(STORAGE_ZONAS);
  },

  async obtenerCallesPorZona(zonaId) {
    if (!zonaId) return [];
    try {
      const { data, error } = await supabase
        .from("calles")
        .select("id, nombre, tipo, google_maps_url, zona_id")
        .eq("zona_id", zonaId)
        .order("nombre");

      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        const todas = await leerCacheSegura(STORAGE_CALLES);
        const filtradas = todas.filter((c) => c.zona_id !== zonaId);
        await AsyncStorage.setItem(
          STORAGE_CALLES,
          JSON.stringify([...filtradas, ...data]),
        );
        return data;
      }
    } catch (err) {
      console.warn(
        "[catalogoService] Usando caché local de calles:",
        err.message,
      );
    }

    const todas = await leerCacheSegura(STORAGE_CALLES);
    return todas.filter((c) => c.zona_id === zonaId);
  },

  async obtenerCategorias() {
    try {
      const { data, error } = await supabase
        .from("categorias_incidente")
        .select("id, nombre")
        .order("nombre");

      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        await AsyncStorage.setItem(STORAGE_CATEGORIAS, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn(
        "[catalogoService] Usando caché local de categorías:",
        err.message,
      );
    }
    return await leerCacheSegura(STORAGE_CATEGORIAS);
  },

  async obtenerDepartamentos() {
    try {
      const { data, error } = await supabase
        .from("departamentos")
        .select("id, nombre")
        .eq("activo", true)
        .order("id", { ascending: true });

      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        await AsyncStorage.setItem(STORAGE_DEPARTAMENTOS, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn(
        "[catalogoService] Usando caché local de departamentos:",
        err.message,
      );
    }
    return await leerCacheSegura(STORAGE_DEPARTAMENTOS);
  },

  async precargarCatalogoCompleto() {
    try {
      const [resZonas, resCalles, resCats, resDeptos] = await Promise.all([
        supabase.from("zonas").select("id, nombre, distrito").order("nombre"),
        supabase
          .from("calles")
          .select("id, nombre, tipo, google_maps_url, zona_id")
          .order("nombre"),
        supabase
          .from("categorias_incidente")
          .select("id, nombre")
          .order("nombre"),
        supabase
          .from("departamentos")
          .select("id, nombre")
          .eq("activo", true)
          .order("id", { ascending: true }),
      ]);

      // Solo sobreescribir si la petición no trajo error y tiene datos válidos
      if (
        !resZonas.error &&
        Array.isArray(resZonas.data) &&
        resZonas.data.length > 0
      ) {
        await AsyncStorage.setItem(
          STORAGE_ZONAS,
          JSON.stringify(resZonas.data),
        );
      }
      if (
        !resCalles.error &&
        Array.isArray(resCalles.data) &&
        resCalles.data.length > 0
      ) {
        await AsyncStorage.setItem(
          STORAGE_CALLES,
          JSON.stringify(resCalles.data),
        );
      }
      if (
        !resCats.error &&
        Array.isArray(resCats.data) &&
        resCats.data.length > 0
      ) {
        await AsyncStorage.setItem(
          STORAGE_CATEGORIAS,
          JSON.stringify(resCats.data),
        );
      }
      if (
        !resDeptos.error &&
        Array.isArray(resDeptos.data) &&
        resDeptos.data.length > 0
      ) {
        await AsyncStorage.setItem(
          STORAGE_DEPARTAMENTOS,
          JSON.stringify(resDeptos.data),
        );
      }
    } catch (e) {
      // Si está offline o falla la red, las cachés existentes quedan intactas
    }
  },
};
