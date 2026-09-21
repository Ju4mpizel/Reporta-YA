// src/services/incidentesService.js
import { supabase } from "./supabase";

export const incidentesService = {
  async obtenerParaFeed() {
    const { data, error } = await supabase
      .from("incidentes")
      .select(
        `
        id,
        titulo,
        descripcion,
        estado,
        nota_alcaldia,
        departamento_id,
        google_maps_url,
        created_at,
        calles ( id, nombre, latitud, longitud, google_maps_url ),
        categorias_incidente ( id, nombre ),
        departamentos!departamento_id ( id, nombre ),
        perfiles!usuario_id ( nombre_completo ),
        apoyos_incidente ( usuario_id )
      `,
      )
      .eq("activo", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "[incidentesService.obtenerParaFeed] Error:",
        error.message,
      );
      throw error;
    }

    return (data || []).map((item) => ({
      id: item.id,
      titulo: item.titulo,
      descripcion: item.descripcion,
      estado: item.estado,
      nota_alcaldia: item.nota_alcaldia,
      departamento_id: item.departamento_id,
      departamento_nombre: item.departamentos?.nombre || null,
      calle_id: item.calles?.id,
      calle_nombre: item.calles?.nombre || "Vía no especificada",
      lat: Number(item.calles?.latitud) || -17.3705,
      lng: Number(item.calles?.longitud) || -66.162,
      maps_url: item.google_maps_url || item.calles?.google_maps_url,
      categoria_nombre: item.categorias_incidente?.nombre || "General",
      usuario_nombre: item.perfiles?.nombre_completo || "Vecino Registrado",
      total_apoyos: item.apoyos_incidente ? item.apoyos_incidente.length : 0,
      created_at: item.created_at,
    }));
  },

  async apoyar(incidenteId, usuarioId) {
    const { error } = await supabase
      .from("apoyos_incidente")
      .insert([{ incidente_id: incidenteId, usuario_id: usuarioId }]);

    if (error) {
      if (error.code === "23505") {
        throw new Error("Ya apoyaste este incidente anteriormente.");
      }
      throw new Error("No se pudo registrar tu apoyo. Intenta nuevamente.");
    }

    return true;
  },

  async crear({
    usuarioId,
    calleId,
    categoriaId,
    titulo,
    descripcion,
    mapsUrl,
  }) {
    const { data, error } = await supabase
      .from("incidentes")
      .insert([
        {
          usuario_id: usuarioId,
          calle_id: calleId,
          categoria_id: categoriaId,
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          estado: "en_revision",
          google_maps_url: mapsUrl || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("[incidentesService.crear] Error:", error.message);
      throw error;
    }

    return data;
  },

  async dictaminar(incidenteId, { departamentoId, estado, notaAlcaldia }) {
    const { data, error } = await supabase
      .from("incidentes")
      .update({
        departamento_id: departamentoId,
        estado: estado,
        nota_alcaldia: (notaAlcaldia || "").trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", incidenteId)
      .select()
      .single();

    if (error) {
      console.error("[incidentesService.dictaminar] Error:", error.message);
      throw error;
    }

    return data;
  },

  suscribirACambios(callback) {
    const channelId = `realtime-incidentes-${Math.random().toString(36).substring(2, 9)}`;
    const canal = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "incidentes",
        },
        (payload) => {
          callback(payload);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  },
};
