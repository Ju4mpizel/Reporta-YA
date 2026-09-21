// src/screens/AdminPanelScreen.js
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Platform,
} from "react-native";
import {
  Clock,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Building2,
  SlidersHorizontal,
  ShieldCheck,
  MapPin,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { incidentesService } from "../services/incidentesService";
import FiltrosAcordeon from "../components/FiltrosAcordeon";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

// Tarjeta animada para cada reporte en bandeja
function AdminIncidenteCard({ item, index, badge, onDictaminar }) {
  const animFade = useRef(new Animated.Value(0)).current;
  const animSlide = useRef(new Animated.Value(16)).current;
  const animScaleBtn = useRef(new Animated.Value(1)).current;

  const StatusIcon = badge.Icon;
  const tieneDpto = Boolean(item.departamento_nombre);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animFade, {
        toValue: 1,
        duration: 300,
        delay: Math.min(index * 50, 350),
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(animSlide, {
        toValue: 0,
        duration: 300,
        delay: Math.min(index * 50, 350),
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(animScaleBtn, {
      toValue: 0.95,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(animScaleBtn, {
      toValue: 1,
      friction: 4,
      tension: 160,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: animFade,
          transform: [{ translateY: animSlide }],
        },
      ]}
    >
      <View style={styles.cardTop}>
        <View style={styles.calleRow}>
          <MapPin size={11} color={COLORS.primary} strokeWidth={2.4} />
          <Text style={styles.cardCalle} numberOfLines={1}>
            {item.calle_nombre}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <StatusIcon size={11} color={badge.text} strokeWidth={2.4} />
          <Text style={[styles.badgeText, { color: badge.text }]}>
            {badge.label}
          </Text>
        </View>
      </View>

      <Text style={styles.cardCategoria}>{item.categoria_nombre}</Text>
      <Text style={styles.cardTitle}>{item.titulo}</Text>
      <Text style={styles.cardDesc}>{item.descripcion}</Text>

      <View style={styles.dptoContainer}>
        <Building2
          size={13}
          color={tieneDpto ? COLORS.primaryDark : COLORS.textMuted}
        />
        <Text style={styles.dptoText}>
          Unidad Asignada:{" "}
          {tieneDpto ? (
            <Text style={styles.dptoName}>{item.departamento_nombre}</Text>
          ) : (
            <Text style={styles.dptoNone}>Sin Asignar (Pendiente)</Text>
          )}
        </Text>
      </View>

      <Animated.View style={{ transform: [{ scale: animScaleBtn }] }}>
        <TouchableOpacity
          style={styles.btnAction}
          activeOpacity={0.85}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => onDictaminar(item)}
        >
          <SlidersHorizontal size={13} color="#FFFFFF" strokeWidth={2.4} />
          <Text style={styles.btnActionText}>
            {tieneDpto ? "Modificar Estado / Nota" : "Asignar Departamento"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

export default function AdminPanelScreen({ navigation }) {
  const [incidentes, setIncidentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const [zonaFiltro] = useState("Cala Cala");
  const [calleFiltro, setCalleFiltro] = useState("Todas");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");

  useFocusEffect(
    useCallback(() => {
      cargarBandeja();
    }, []),
  );

  useEffect(() => {
    const desuscribir = incidentesService.suscribirACambios(() => {
      cargarBandeja();
    });

    return () => {
      if (desuscribir) desuscribir();
    };
  }, []);

  async function cargarBandeja() {
    try {
      const datos = await incidentesService.obtenerParaFeed();
      setIncidentes(Array.isArray(datos) ? datos : []);
    } catch (err) {
      console.error("Error al cargar bandeja admin:", err.message);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }

  const listaSegura = Array.isArray(incidentes) ? incidentes : [];

  const incidentesFiltrados = listaSegura.filter((item) => {
    const coincideCalle =
      calleFiltro === "Todas" || item.calle_nombre === calleFiltro;
    const coincideCat =
      categoriaFiltro === "Todas" || item.categoria_nombre === categoriaFiltro;
    return coincideCalle && coincideCat;
  });

  const nuevos = listaSegura.filter((i) => i.estado === "en_revision").length;
  const enCurso = listaSegura.filter(
    (i) => i.estado === "realizando_trabajos",
  ).length;
  const hechos = listaSegura.filter((i) => i.estado === "hecho").length;

  const getBadge = (estado) => {
    switch (estado) {
      case "en_revision":
        return {
          label: "En Revisión",
          bg: "#FEF3C7",
          text: "#B45309",
          Icon: Clock,
        };
      case "realizando_trabajos":
        return {
          label: "En Trabajos",
          bg: "#DBEAFE",
          text: "#1D4ED8",
          Icon: Wrench,
        };
      case "hecho":
        return {
          label: "Resuelto",
          bg: "#DCFCE7",
          text: "#15803D",
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
      {/* Header Institucional Curvo */}
      <View style={styles.headerDark}>
        <View style={styles.headerTopLine}>
          <ShieldCheck size={13} color="#38BDF8" strokeWidth={2.4} />
          <Text style={styles.headerSub}>
            SUBALCALDÍA CALA CALA · DISTRITO 12
          </Text>
        </View>
        <Text style={styles.headerTitle}>Bandeja de Incidentes</Text>
      </View>

      {/* Métricas Operativas */}
      <View style={styles.statsContainer}>
        <View style={[styles.statBox, styles.statBoxAmber]}>
          <Text style={[styles.statNum, { color: "#D97706" }]}>{nuevos}</Text>
          <Text style={styles.statLabel}>Nuevos</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxBlue]}>
          <Text style={[styles.statNum, { color: "#2563EB" }]}>{enCurso}</Text>
          <Text style={styles.statLabel}>En Cuadrilla</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxGreen]}>
          <Text style={[styles.statNum, { color: "#059669" }]}>{hechos}</Text>
          <Text style={styles.statLabel}>Resueltos</Text>
        </View>
      </View>

      <FiltrosAcordeon
        zonaSeleccionada={zonaFiltro}
        calleSeleccionada={calleFiltro}
        categoriaSeleccionada={categoriaFiltro}
        onPressZona={() => {}}
        onPressCalle={(calle) => setCalleFiltro(calle)}
        onPressCategoria={(cat) => setCategoriaFiltro(cat)}
      />

      <View style={styles.listHeaderRow}>
        <Text style={styles.listSubtitle}>
          EXPEDIENTES PENDIENTES DE RESOLUCIÓN
        </Text>
      </View>

      {cargando ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Sincronizando expedientes...</Text>
        </View>
      ) : (
        <FlatList
          data={incidentesFiltrados}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={cargarBandeja}
            />
          }
          renderItem={({ item, index }) => {
            const badge = getBadge(item.estado);
            return (
              <AdminIncidenteCard
                item={item}
                index={index}
                badge={badge}
                onDictaminar={(inc) =>
                  navigation.navigate("GestionIncidente", { incidente: inc })
                }
              />
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerDark: {
    backgroundColor: "#0F172A",
    paddingHorizontal: SPACING.lg,
    paddingTop: 52,
    paddingBottom: SPACING.md,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
    elevation: 3,
  },
  headerTopLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: "800",
    color: "#38BDF8",
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  statsContainer: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    alignItems: "center",
    elevation: 1,
  },
  statBoxAmber: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
  statBoxBlue: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  statBoxGreen: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  statNum: { fontSize: 20, fontWeight: "900" },
  statLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    color: COLORS.textMuted,
    marginTop: 2,
    textTransform: "uppercase",
  },
  listHeaderRow: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 9.5,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.bottomInset || 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  calleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    marginRight: 8,
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
  badgeText: { fontSize: 10, fontWeight: "800" },
  cardCategoria: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "700",
    marginBottom: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    lineHeight: 17,
    marginBottom: SPACING.sm,
  },
  dptoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  dptoText: { fontSize: 11, color: COLORS.textMuted },
  dptoName: { fontWeight: "800", color: COLORS.primaryDark },
  dptoNone: { fontStyle: "italic", color: COLORS.textMuted },
  btnAction: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
  },
  btnActionText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
