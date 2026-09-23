// src/services/callesService.js
import { supabase } from "./supabase";

export const callesService = {
  // Crear una vía validada con coordenadas exactas capturadas en el mapa
  async crearCalle({ nombre, tipo = "avenida", latitud, longitud }) {
    if (!nombre || !nombre.trim()) {
      throw new Error("El nombre de la calle es obligatorio.");
    }
    if (latitud == null || longitud == null) {
      throw new Error("Coordenadas no válidas seleccionadas en el mapa.");
    }

    // Obtener la zona de Cala Cala por defecto
    const { data: zonaData } = await supabase
      .from("zonas")
      .select("id")
      .limit(1)
      .single();

    const zonaId = zonaData?.id || 1;
    const urlGoogle = `https://www.google.com/maps/place/${encodeURIComponent(nombre.trim())}/@${latitud},${longitud},17z`;

    const { data, error } = await supabase
      .from("calles")
      .insert([
        {
          zona_id: zonaId,
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
      .select("id, nombre, tipo, latitud, longitud, google_maps_url")
      .order("nombre", { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
