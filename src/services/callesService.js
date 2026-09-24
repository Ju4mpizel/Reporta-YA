// src/services/callesService.js
import { supabase } from "./supabase";

export const callesService = {
  // Obtener todas las zonas de la base de datos
  async obtenerZonas() {
    const { data, error } = await supabase
      .from("zonas")
      .select("id, nombre, distrito")
      .order("nombre", { ascending: true });

    if (error) {
      console.error("[callesService.obtenerZonas] Error:", error.message);
      return [];
    }
    return data || [];
  },

  // Crear una vía validada con su zona y coordenadas
  async crearCalle({ nombre, tipo = "avenida", zonaId, latitud, longitud }) {
    if (!nombre || !nombre.trim()) {
      throw new Error("El nombre de la calle es obligatorio.");
    }
    if (latitud == null || longitud == null) {
      throw new Error("Coordenadas no válidas seleccionadas en el mapa.");
    }

    // Si no especificaron zona, buscar la primera disponible como respaldo
    let zonaFinal = zonaId;
    if (!zonaFinal) {
      const { data: zonaData } = await supabase
        .from("zonas")
        .select("id")
        .limit(1)
        .single();
      zonaFinal = zonaData?.id || 1;
    }

    const urlGoogle = `https://www.google.com/maps/place/${encodeURIComponent(
      nombre.trim(),
    )}/@${latitud},${longitud},17z`;

    const { data, error } = await supabase
      .from("calles")
      .insert([
        {
          zona_id: zonaFinal,
          tipo: tipo,
          nombre: nombre.trim(),
          latitud: parseFloat(latitud),
          longitud: parseFloat(longitud),
          google_maps_url: urlGoogle,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("[callesService.crearCalle] Error:", error.message);
      throw error;
    }

    return data;
  },

  async obtenerTodas() {
    const { data, error } = await supabase
      .from("calles")
      .select(
        "id, nombre, tipo, latitud, longitud, google_maps_url, zona_id, zonas(nombre)",
      )
      .order("nombre", { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
