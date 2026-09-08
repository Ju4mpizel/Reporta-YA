
import { supabase } from "./supabase";

const BUCKET = "fotos-reportes";

// `uri` viene de expo-image-picker (FileSystem / asset media library)
export async function subirFoto(uri, reporteId) {
  const respuesta = await fetch(uri);
  const blob = await respuesta.blob();

  const nombreArchivo = `foto-${Date.now()}.jpg`;
  const ruta = `${reporteId}/${nombreArchivo}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(ruta, blob, { contentType: "image/jpeg", upsert: false });

  if (error) throw error;
  return obtenerUrlPublica(ruta);
}

export const uploadImage = subirFoto;

export function obtenerUrlPublica(ruta) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(ruta);
  return data.publicUrl;
}

// Para reemplazar la foto de un reporte ya creado
export async function reemplazarFoto(uri, reporteId, rutaVieja = null) {
  if (rutaVieja) await eliminarFoto(rutaVieja);
  return subirFoto(uri, reporteId);
}

export async function eliminarFoto(ruta) {
  const { data, error } = await supabase.storage.from(BUCKET).remove([ruta]);
  if (error) throw error;
  return data;
}

export async function listarFotos(reporteId) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(reporteId, { sortBy: { column: "created_at", order: "desc" } });
  if (error) throw error;
  return data.map((archivo) => obtenerUrlPublica(`${reporteId}/${archivo.name}`));
}