
import { supabase } from "./supabase";

// Categorías = enum `categoria_reporte` de la base de datos (HU02)
export const CATEGORIAS_REPORTE = [
  { valor: "bache_asfalto", etiqueta: "Bache o Asfalto Deteriorado" },
  { valor: "alumbrado_publico", etiqueta: "Falla de Alumbrado Público" },
  { valor: "arbol_caido_poda", etiqueta: "Árbol Caído / Poda" },
  { valor: "basura_acumulada", etiqueta: "Acumulación de Basura" },
  { valor: "alcantarilla_desague", etiqueta: "Alcantarilla / Desagüe Obstruido" },
  { valor: "fuga_agua", etiqueta: "Fuga de Agua" },
  { valor: "otro", etiqueta: "Otro" },
];

// Devuelve la lista de categorías para lugares que esperan una promesa
export async function listarCategorias() {
  return CATEGORIAS_REPORTE.map((c) => c.valor);
}

export function etiquetaCategoria(valor) {
  return CATEGORIAS_REPORTE.find((c) => c.valor === valor)?.etiqueta ?? valor;
}

export async function listarZonas() {
  const { data, error } = await supabase.from("zonas").select("*");
  if (error) throw error;
  return data;
}

export async function listarCalles(zonaId = null) {
  let query = supabase
    .from("calles")
    .select("id, nombre, tipo")
    .order("nombre", { ascending: true });
  if (zonaId) query = query.eq("zona_id", zonaId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Filtros opcionales: calleId, categoria, estado
export async function listarReportes({
  calleId = null,
  categoria = null,
  estado = null,
} = {}) {
  let query = supabase
    .from("reportes")
    .select("*, calle:calles(id, nombre, tipo), apoyos(count)")
    .order("created_at", { ascending: false });

  if (calleId) query = query.eq("calle_id", calleId);
  if (categoria) query = query.eq("categoria", categoria);
  if (estado) query = query.eq("estado", estado);

  const { data, error } = await query;
  if (error) throw error;
  return data.map((reporte) => normalizarReporte(reporte));
}

export async function obtenerReporte(id) {
  const { data, error } = await supabase
    .from("reportes")
    .select("*, calle:calles(id, nombre, tipo), apoyos(count)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return normalizarReporte(data);
}

// Convierte el agregado de PostgREST a un contador simple
function normalizarReporte(reporte) {
  return {
    ...reporte,
    apoyos_count: reporte.apoyos?.[0]?.count ?? 0,
  };
}

export async function crearReporte({
  calleId,
  categoria,
  titulo,
  descripcion,
  referenciaAdicional = "",
  latitud,
  longitud,
  fotoUrl = null,
}) {
  const { data: sesion } = await supabase.auth.getSession();
  if (!sesion?.session) throw new Error("Debes iniciar sesión para reportar");

  const { data, error } = await supabase
    .from("reportes")
    .insert({
      calle_id: calleId,
      categoria,
      titulo,
      descripcion,
      referencia_adicional: referenciaAdicional || null,
      latitud,
      longitud,
      foto_url: fotoUrl,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// HU06 · Solo rol admin (los policies de RLS lo garantizan en el servidor)
export async function actualizarEstadoReporte(
  id,
  estado,
  notaAlcaldia = "",
) {
  const { data, error } = await supabase
    .from("reportes")
    .update({
      estado,
      nota_alcaldia: notaAlcaldia || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// HU05 · Apoyo vecinal (+1) mediante RPC (sin duplicados, devuelve el total)
export async function apoyarReporte(reporteId) {
  const { data, error } = await supabase.rpc("apoyar_reporte", {
    p_reporte_id: reporteId,
  });
  if (error) throw error;
  return data;
}

// HU03 · Conteo de reportes agrupado por calle (para el mapa)
export async function contarReportesPorCalle() {
  const { data, error } = await supabase
    .from("reportes")
    .select("calle_id, calle:calles(nombre)");
  if (error) throw error;

  const agrupado = {};
  for (const reporte of data) {
    const nombre = reporte.calle?.nombre;
    if (!agrupado[nombre]) agrupado[nombre] = 0;
    agrupado[nombre] += 1;
  }
  return agrupado;
}