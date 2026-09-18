// src/screens/IncidenteScreen.js
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import {
  Clock,
  Wrench,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  Calendar,
  MapPin,
  Building2,
  ShieldCheck,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import { COLORS, RADIUS, SPACING } from "../constants/theme";
import FiltrosAcordeon from "../components/FiltrosAcordeon";

export default function IncidenteScreen({ route }) {
  const { perfil } = useAuth();
  const flatListRef = useRef(null);
  const incidenteIdSeleccionado = route?.params?.incidenteIdSeleccionado;

  const [incidentes, setIncidentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const [zonaActiva] = useState("Cala Cala");
  const [calleFiltro] = useState("Todas");
  const [categoriaFiltro] = useState("Todas");

  // Recarga automática al enfocar la pantalla o regresar desde otra vista
  useFocusEffect(
    useCallback(() => {
      cargarIncidentes();
    }, []),
  );

  // Autoscroll hacia el incidente seleccionado desde el mapa
  useEffect(() => {
    if (incidenteIdSeleccionado && incidentes.length > 0) {
      const index = incidentes.findIndex(
        (i) => i.id === incidenteIdSeleccionado,
      );
      if (index !== -1 && flatListRef.current) {
        setTimeout(() => {
          try {
            flatListRef.current.scrollToIndex({
              index,
              animated: true,
              viewPosition: 0.2,
            });
          } catch (err) {
            console.warn("Aviso scroll:", err.message);
          }
        }, 200);
      }
    }
  }, [incidenteIdSeleccionado, incidentes]);

  async function cargarIncidentes() {
    try {
      setCargando(true);
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
          calles ( nombre ),
          categorias_incidente ( nombre ),
          departamentos!departamento_id ( nombre ),
          apoyos_incidente ( usuario_id )
        `,
        )
        .eq("activo", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formateados = (data || []).map((item) => ({
        ...item,
        calle_nombre: item.calles?.nombre || "Vía no especificada",
        categoria_nombre: item.categorias_incidente?.nombre || "General",
        departamento_nombre: item.departamentos?.nombre || null,
        total_apoyos: item.apoyos_incidente ? item.apoyos_incidente.length : 0,
      }));

      setIncidentes(formateados);
    } catch (err) {
      console.error("Error al cargar incidentes:", err.message);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }

  const handleApoyar = async (incidenteId) => {
    if (!perfil?.id) {
      Alert.alert(
        "Acceso requerido",
        "Inicia sesión para respaldar este reporte.",
      );
      return;
    }

    try {
      const { error } = await supabase
        .from("apoyos_incidente")
        .insert([{ incidente_id: incidenteId, usuario_id: perfil.id }]);

      if (error) {
        if (error.code === "23505") {
          Alert.alert("Aviso", "Ya apoyaste este incidente anteriormente.");
          return;
        }
        throw error;
      }

      setIncidentes((prev) =>
        prev.map((item) =>
          item.id === incidenteId
            ? { ...item, total_apoyos: item.total_apoyos + 1 }
            : item,
        ),
      );
    } catch (err) {
      console.error("Error al apoyar:", err.message);
      Alert.alert("Error", "No se pudo registrar tu apoyo.");
    }
  };

  const getBadge = (estado) => {
    switch (estado) {
      case "en_revision":
        return {
          label: "En Revisión",
          bg: COLORS.amberBg,
          text: COLORS.amber,
          Icon: Clock,
        };
      case "realizando_trabajos":
        return {
          label: "En Trabajos",
          bg: COLORS.blueBg,
          text: COLORS.blue,
          Icon: Wrench,
        };
      case "hecho":
        return {
          label: "Resuelto",
          bg: COLORS.greenBg,
          text: COLORS.green,
          Icon: CheckCircle2,
        };
      case "rechazado":
        return {
          label: "Rechazado",
          bg: "#FEE2E2",
          text: "#DC2626",
          Icon: AlertCircle,
        };
      default:
        return {
          label: estado,
          bg: "#F1F5F9",
          text: COLORS.textMuted,
          Icon: AlertCircle,
        };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSub}>
          ZONA PILOTO: {zonaActiva.toUpperCase()}
        </Text>
        <Text style={styles.headerTitle}>Incidentes Urbanos</Text>
      </View>

      {/* Filtros en Acordeón */}
      <FiltrosAcordeon
        zonaSeleccionada={zonaActiva}
        calleSeleccionada={calleFiltro}
        categoriaSeleccionada={categoriaFiltro}
        onPressZona={() => {}}
        onPressCalle={() => {}}
        onPressCategoria={() => {}}
      />

      {/* Feed de Incidentes */}
      {cargando ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando incidentes...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={incidentes}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={() => {}}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={cargarIncidentes}
            />
          }
          renderItem={({ item }) => {
            const badge = getBadge(item.estado);
            const StatusIcon = badge.Icon;
            const esSeleccionado = incidenteIdSeleccionado === item.id;

            return (
              <View
                style={[styles.card, esSeleccionado && styles.cardSeleccionada]}
              >
                {esSeleccionado && (
                  <View style={styles.bannerSeleccionado}>
                    <MapPin size={11} color="#FFFFFF" strokeWidth={2.4} />
                    <Text style={styles.bannerSeleccionadoText}>
                      REPORTE SELECCIONADO EN MAPA
                    </Text>
                  </View>
                )}

                <View style={styles.cardTop}>
                  <Text style={styles.cardCalle}>{item.calle_nombre}</Text>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <StatusIcon
                      size={11}
                      color={badge.text}
                      strokeWidth={2.4}
                    />
                    <Text style={[styles.badgeText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardCategoria}>
                  {item.categoria_nombre}
                </Text>
                <Text style={styles.cardTitle}>{item.titulo}</Text>
                <Text style={styles.cardDesc}>{item.descripcion}</Text>

                {/* Unidad Municipal Asignada */}
                {item.departamento_nombre && (
                  <View style={styles.dptoBadge}>
                    <Building2 size={12} color={COLORS.textDark} />
                    <Text style={styles.dptoBadgeText}>
                      Unidad: {item.departamento_nombre}
                    </Text>
                  </View>
                )}

                {/* Nota Oficial de la Alcaldía */}
                {item.nota_alcaldia ? (
                  <View style={styles.notaAlcaldiaBox}>
                    <View style={styles.notaAlcaldiaHeader}>
                      <ShieldCheck
                        size={13}
                        color={COLORS.primary}
                        strokeWidth={2.2}
                      />
                      <Text style={styles.notaAlcaldiaTitle}>
                        RESOLUCIÓN MUNICIPAL (D-12)
                      </Text>
                    </View>
                    <Text style={styles.notaAlcaldiaText}>
                      {item.nota_alcaldia}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.cardFooter}>
                  <View style={styles.dateRow}>
                    <Calendar size={12} color={COLORS.textSubtle} />
                    <Text style={styles.cardDate}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.btnApoyo}
                    activeOpacity={0.7}
                    onPress={() => handleApoyar(item.id)}
                  >
                    <ThumbsUp
                      size={12}
                      color={COLORS.primaryDark}
                      strokeWidth={2.4}
                    />
                    <Text style={styles.btnApoyoText}>
                      Apoyar ({item.total_apoyos})
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingTop: 50,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textDark,
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.bottomInset,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
  },
  cardSeleccionada: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: "#F0F9FF",
  },
  bannerSeleccionado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  bannerSeleccionadoText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardCalle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
    textTransform: "uppercase",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  badgeText: { fontSize: 10, fontWeight: "700" },
  cardCategoria: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  dptoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    alignSelf: "flex-start",
    marginTop: 4,
    marginBottom: 6,
  },
  dptoBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  notaAlcaldiaBox: {
    backgroundColor: "#F8FAFC",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    borderRadius: 4,
    padding: 8,
    marginTop: 4,
    marginBottom: SPACING.xs,
  },
  notaAlcaldiaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  notaAlcaldiaTitle: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  notaAlcaldiaText: {
    fontSize: 11,
    color: COLORS.textDark,
    lineHeight: 15,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 8,
    marginTop: 6,
  },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  cardDate: { fontSize: 11, color: COLORS.textSubtle },
  btnApoyo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  btnApoyoText: { fontSize: 11, fontWeight: "700", color: COLORS.primaryDark },
});
