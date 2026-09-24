// src/services/incidentesService.js
import { supabase } from "./supabase";

const CLOUDINARY_CLOUD_NAME = "ajhdqneu";
const CLOUDINARY_UPLOAD_PRESET = "reporta_ya";

export const incidentesService = {
  async subirACloudinary(localUri) {
    if (!localUri) return null;

    try {
      const formData = new FormData();

      if (typeof window !== "undefined" && localUri.startsWith("blob:")) {
        const respuesta = await fetch(localUri);
        const blob = await respuesta.blob();
        formData.append("file", blob);
      } else {
        const extension = localUri.split(".").pop() || "jpg";
        formData.append("file", {
          uri: localUri,
          type: `image/${extension === "png" ? "png" : "jpeg"}`,
          name: `evidencia_${Date.now()}.${extension}`,
        });
      }

      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await res.json();
      return data.secure_url || null;
    } catch (err) {
      console.error("Error al subir a Cloudinary:", err.message);
      return null;
    }
  },
  async obtenerParaFeed(usuarioIdActual = null) {
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
        foto_url,
        created_at,
        calles!calle_id ( id, nombre, latitud, longitud, google_maps_url, zonas ( id, nombre ) ),
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

    return (data || []).map((item) => {
      const apoyosLista = item.apoyos_incidente || [];
      const yaApoyado = usuarioIdActual
        ? apoyosLista.some(
            (a) => String(a.usuario_id) === String(usuarioIdActual),
          )
        : false;

      return {
        id: item.id,
        titulo: item.titulo,
        descripcion: item.descripcion,
        estado: item.estado,
        nota_alcaldia: item.nota_alcaldia,
        departamento_id: item.departamento_id,
        departamento_nombre: item.departamentos?.nombre || null,
        zona_nombre: item.calles?.zonas?.nombre || "Cala Cala",
        calle_id: item.calles?.id,
        calle_nombre: item.calles?.nombre || "Vía no especificada",
        lat: item.calles?.latitud != null ? Number(item.calles.latitud) : null,
        lng:
          item.calles?.longitud != null ? Number(item.calles.longitud) : null,
        maps_url: item.calles?.google_maps_url || null,
        foto_url: item.foto_url || null,
        categoria_nombre: item.categorias_incidente?.nombre || "General",
        usuario_nombre: item.perfiles?.nombre_completo || "Vecino Registrado",
        total_apoyos: apoyosLista.length,
        apoyado_por_mi: yaApoyado,
        created_at: item.created_at,
      };
    });
  },

  async toggleApoyo(incidenteId, usuarioId) {
    if (!usuarioId || !incidenteId) {
      throw new Error("Parámetros requeridos no encontrados.");
    }

    const incId = Number(incidenteId);

    // Consulta adaptada a la clave compuesta real (usuario_id)
    const { data: existentes, error: consultaErr } = await supabase
      .from("apoyos_incidente")
      .select("usuario_id")
      .eq("incidente_id", incId)
      .eq("usuario_id", usuarioId);

    if (consultaErr) throw consultaErr;

    if (existentes && existentes.length > 0) {
      const { error: deleteErr } = await supabase
        .from("apoyos_incidente")
        .delete()
        .eq("incidente_id", incId)
        .eq("usuario_id", usuarioId);

      if (deleteErr) throw deleteErr;
      return { apoyado: false };
    } else {
      const { error: insertErr } = await supabase
        .from("apoyos_incidente")
        .insert([{ incidente_id: incId, usuario_id: usuarioId }]);

      if (insertErr) throw insertErr;
      return { apoyado: true };
    }
  },

  async crear({
    usuarioId,
    calleId,
    categoriaId,
    titulo,
    descripcion,
    fotoLocalUri,
  }) {
    let urlPublicaFoto = null;
    if (fotoLocalUri) {
      urlPublicaFoto = await this.subirACloudinary(fotoLocalUri);
    }

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
          foto_url: urlPublicaFoto || null,
          activo: true,
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
      .eq("id", Number(incidenteId))
      .select()
      .single();

    if (error) {
      console.error("[incidentesService.dictaminar] Error:", error.message);
      throw error;
    }

    return data;
  },

  async eliminar(incidenteId) {
    const { error } = await supabase
      .from("incidentes")
      .update({
        activo: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", Number(incidenteId));

    if (error) {
      console.error("[incidentesService.eliminar] Error:", error.message);
      throw error;
    }

    return true;
  },

  suscribirACambios(callback) {
    const channelId = `realtime-incidentes-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    const canal = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "incidentes",
        },
        () => {
          callback();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  },
};
