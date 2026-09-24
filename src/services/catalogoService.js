// src/services/catalogoService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const STORAGE_ZONAS = "@reporta_ya:cache_zonas";
const STORAGE_CALLES = "@reporta_ya:cache_calles";
const STORAGE_CATEGORIAS = "@reporta_ya:cache_categorias";
const STORAGE_DEPARTAMENTOS = "@reporta_ya:cache_departamentos";

export const catalogoService = {
  async obtenerZonas() {
    try {
      const { data, error } = await supabase
        .from("zonas")
        .select("id, nombre, distrito")
        .order("nombre");
      if (error) throw error;
      if (data && data.length > 0) {
        await AsyncStorage.setItem(STORAGE_ZONAS, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn("Sin red para zonas, usando caché local:", err.message);
    }
    const local = await AsyncStorage.getItem(STORAGE_ZONAS);
    return local ? JSON.parse(local) : [];
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
      if (data) {
        const local = await AsyncStorage.getItem(STORAGE_CALLES);
        const todas = local ? JSON.parse(local) : [];
        const filtradas = todas.filter((c) => c.zona_id !== zonaId);
        await AsyncStorage.setItem(
          STORAGE_CALLES,
          JSON.stringify([...filtradas, ...data]),
        );
        return data;
      }
    } catch (err) {
      console.warn("Sin red para calles, usando caché local:", err.message);
    }
    const local = await AsyncStorage.getItem(STORAGE_CALLES);
    if (!local) return [];
    return JSON.parse(local).filter((c) => c.zona_id === zonaId);
  },

  async obtenerCategorias() {
    try {
      const { data, error } = await supabase
        .from("categorias_incidente")
        .select("id, nombre")
        .order("nombre");
      if (error) throw error;
      if (data && data.length > 0) {
        await AsyncStorage.setItem(STORAGE_CATEGORIAS, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn("Sin red para categorías, usando caché local:", err.message);
    }
    const local = await AsyncStorage.getItem(STORAGE_CATEGORIAS);
    return local ? JSON.parse(local) : [];
  },

  async obtenerDepartamentos() {
    try {
      const { data, error } = await supabase
        .from("departamentos")
        .select("id, nombre")
        .eq("activo", true)
        .order("id", { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        await AsyncStorage.setItem(STORAGE_DEPARTAMENTOS, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn(
        "Sin red para departamentos, usando caché local:",
        err.message,
      );
    }
    const local = await AsyncStorage.getItem(STORAGE_DEPARTAMENTOS);
    return local ? JSON.parse(local) : [];
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

      if (resZonas.data)
        await AsyncStorage.setItem(
          STORAGE_ZONAS,
          JSON.stringify(resZonas.data),
        );
      if (resCalles.data)
        await AsyncStorage.setItem(
          STORAGE_CALLES,
          JSON.stringify(resCalles.data),
        );
      if (resCats.data)
        await AsyncStorage.setItem(
          STORAGE_CATEGORIAS,
          JSON.stringify(resCats.data),
        );
      if (resDeptos.data)
        await AsyncStorage.setItem(
          STORAGE_DEPARTAMENTOS,
          JSON.stringify(resDeptos.data),
        );
    } catch (e) {}
  },
};
