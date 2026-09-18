// src/services/incidentesService.js
import { supabase } from "./supabase";

export const incidentesService = {
  // Listar incidentes activos con sus relaciones
  async obtenerIncidentes() {
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
        created_at,
        calles ( id, nombre, latitud, longitud ),
        categorias_incidente ( id, nombre ),
        departamentos!departamento_id ( id, nombre ),
        apoyos_incidente ( usuario_id )
      `,
      )
      .eq("activo", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Respaldar incidente (+1)
  async apoyarIncidente(incidenteId, usuarioId) {
    const { data, error } = await supabase
      .from("apoyos_incidente")
      .insert([{ incidente_id: incidenteId, usuario_id: usuarioId }])
      .select();

    if (error) throw error;
    return data;
  },

  // Crear reporte ciudadano
  async crearIncidente({
    usuarioId,
    calleId,
    categoriaId,
    titulo,
    descripcion,
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
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Actualización administrativa
  async dictaminarIncidente(
    incidenteId,
    { estado, departamentoId, notaAlcaldia },
  ) {
    const { data, error } = await supabase
      .from("incidentes")
      .update({
        estado,
        departamento_id: departamentoId,
        nota_alcaldia: (notaAlcaldia || "").trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", incidenteId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
