// src/components/FiltrosAcordeon.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import {
  MapPin,
  Navigation,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react-native";
import { supabase } from "../../services/supabase";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";

export default function FiltrosAcordeon({
  zonaSeleccionada = "Todas",
  calleSeleccionada = "Todas",
  categoriaSeleccionada = "Todas",
  onPressZona,
  onPressCalle,
  onPressCategoria,
}) {
  const [desplegado, setDesplegado] = useState(null);
  const [zonas, setZonas] = useState([]);
  const [calles, setCalles] = useState([]);
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    cargarOpciones();
  }, []);

  async function cargarOpciones() {
    try {
      const [resZonas, resCalles, resCats] = await Promise.all([
        supabase.from("zonas").select("id, nombre").order("nombre"),
        supabase.from("calles").select("id, nombre").order("nombre"),
        supabase
          .from("categorias_incidente")
          .select("id, nombre")
          .order("nombre"),
      ]);

      if (resZonas.data) setZonas(resZonas.data);
      if (resCalles.data) setCalles(resCalles.data);
      if (resCats.data) setCategorias(resCats.data);
    } catch (err) {
      console.error("Error al cargar filtros:", err.message);
    }
  }

  const toggle = (tipo) => {
    setDesplegado((prev) => (prev === tipo ? null : tipo));
  };

  const getListaActual = () => {
    if (desplegado === "zona") return zonas;
    if (desplegado === "calle") return calles;
    if (desplegado === "categoria") return categorias;
    return [];
  };

  const getValorSeleccionado = () => {
    if (desplegado === "zona") return zonaSeleccionada;
    if (desplegado === "calle") return calleSeleccionada;
    if (desplegado === "categoria") return categoriaSeleccionada;
    return "Todas";
  };

  const handleSeleccionar = (nombre) => {
    if (desplegado === "zona" && onPressZona) onPressZona(nombre);
    if (desplegado === "calle" && onPressCalle) onPressCalle(nombre);
    if (desplegado === "categoria" && onPressCategoria)
      onPressCategoria(nombre);
    setDesplegado(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {/* Filtro Zona Activo */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.filterBox,
            desplegado === "zona" && styles.filterBoxActive,
          ]}
          onPress={() => toggle("zona")}
        >
          <View style={styles.content}>
            <View style={styles.labelRow}>
              <MapPin
                size={10}
                color={
                  desplegado === "zona" ? COLORS.primary : COLORS.textMuted
                }
                strokeWidth={2.4}
              />
              <Text style={styles.label}>Zona</Text>
            </View>
            <Text style={styles.value} numberOfLines={1}>
              {zonaSeleccionada}
            </Text>
          </View>
          {desplegado === "zona" ? (
            <ChevronUp size={12} color={COLORS.primary} strokeWidth={2.4} />
          ) : (
            <ChevronDown size={12} color={COLORS.textDark} strokeWidth={2.4} />
          )}
        </TouchableOpacity>

        {/* Filtro Calle */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.filterBox,
            desplegado === "calle" && styles.filterBoxActive,
          ]}
          onPress={() => toggle("calle")}
        >
          <View style={styles.content}>
            <View style={styles.labelRow}>
              <Navigation
                size={10}
                color={
                  desplegado === "calle" ? COLORS.primary : COLORS.textMuted
                }
                strokeWidth={2.4}
              />
              <Text style={styles.label}>Calle</Text>
            </View>
            <Text style={styles.value} numberOfLines={1}>
              {calleSeleccionada}
            </Text>
          </View>
          {desplegado === "calle" ? (
            <ChevronUp size={12} color={COLORS.primary} strokeWidth={2.4} />
          ) : (
            <ChevronDown size={12} color={COLORS.textDark} strokeWidth={2.4} />
          )}
        </TouchableOpacity>

        {/* Filtro Categoría */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.filterBox,
            desplegado === "categoria" && styles.filterBoxActive,
          ]}
          onPress={() => toggle("categoria")}
        >
          <View style={styles.content}>
            <View style={styles.labelRow}>
              <AlertTriangle
                size={10}
                color={
                  desplegado === "categoria" ? COLORS.primary : COLORS.textMuted
                }
                strokeWidth={2.4}
              />
              <Text style={styles.label}>Categ.</Text>
            </View>
            <Text style={styles.value} numberOfLines={1}>
              {categoriaSeleccionada}
            </Text>
          </View>
          {desplegado === "categoria" ? (
            <ChevronUp size={12} color={COLORS.primary} strokeWidth={2.4} />
          ) : (
            <ChevronDown size={12} color={COLORS.textDark} strokeWidth={2.4} />
          )}
        </TouchableOpacity>
      </View>

      {/* Desplegable Horizontal de Chips */}
      {desplegado && (
        <View style={styles.dropdown}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dropdownScroll}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.chip,
                getValorSeleccionado() === "Todas" && styles.chipActive,
              ]}
              onPress={() => handleSeleccionar("Todas")}
            >
              <Text
                style={[
                  styles.chipText,
                  getValorSeleccionado() === "Todas" && styles.chipTextActive,
                ]}
              >
                Todas
              </Text>
            </TouchableOpacity>

            {getListaActual().map((item) => {
              const seleccionado = getValorSeleccionado() === item.nombre;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  style={[styles.chip, seleccionado && styles.chipActive]}
                  onPress={() => handleSeleccionar(item.nombre)}
                >
                  {seleccionado && (
                    <Check size={11} color="#FFFFFF" strokeWidth={3} />
                  )}
                  <Text
                    style={[
                      styles.chipText,
                      seleccionado && styles.chipTextActive,
                    ]}
                  >
                    {item.nombre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  bar: {
    flexDirection: "row",
    gap: 6,
  },
  filterBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 9,
    paddingVertical: 7,
    backgroundColor: COLORS.surface,
    elevation: 1,
  },
  filterBoxActive: {
    borderColor: COLORS.primary,
    backgroundColor: "#F0F9FF",
  },
  content: {
    flex: 1,
    marginRight: 4,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 1,
  },
  label: {
    fontSize: 8.5,
    fontWeight: "800",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 10.5,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  dropdown: {
    marginTop: 6,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingVertical: 8,
    elevation: 3,
  },
  dropdownScroll: {
    paddingHorizontal: 8,
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  chipActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  chipText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
});
