import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Trash2, AlertTriangle } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { incidentesService } from "../services/incidentesService";
import FiltrosAcordeon from "../components/FiltrosAcordeon";
import HeaderInstitucional from "../components/HeaderInstitucional";
import AdminIncidenteCard from "../components/AdminIncidenteCard";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

export default function AdminPanelScreen({ navigation }) {
  const [incidentes, setIncidentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const [zonaFiltro] = useState("Cala Cala");
  const [calleFiltro, setCalleFiltro] = useState("Todas");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");

  // Estados para los modales profesionales
  const [incidenteSeleccionado, setIncidenteSeleccionado] = useState(null);
  const [modalConfirmVisible, setModalConfirmVisible] = useState(false);
  const [modalAvisoVisible, setModalAvisoVisible] = useState(false);
  const [eliminando, setEliminando] = useState(false);

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

  const handlePresionarEliminar = (incidente) => {
    setIncidenteSeleccionado(incidente);
    if (incidente.estado === "hecho") {
      setModalConfirmVisible(true);
    } else {
      setModalAvisoVisible(true);
    }
  };

  const confirmarArchivado = async () => {
    if (!incidenteSeleccionado) return;
    try {
      setEliminando(true);
      await incidentesService.eliminar(incidenteSeleccionado.id);
      setIncidentes((prev) =>
        prev.filter((i) => i.id !== incidenteSeleccionado.id),
      );
      setModalConfirmVisible(false);
      setIncidenteSeleccionado(null);
    } catch (err) {
      console.error("Error al archivar:", err.message);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderInstitucional titulo="Bandeja de Incidentes" />

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
          renderItem={({ item, index }) => (
            <AdminIncidenteCard
              item={item}
              index={index}
              onDictaminar={(inc) =>
                navigation.navigate("GestionIncidente", { incidente: inc })
              }
              onEliminar={handlePresionarEliminar}
            />
          )}
        />
      )}

      {/* 1. Modal Institucional de Confirmación (Resuelto) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalConfirmVisible}
        onRequestClose={() => setModalConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setModalConfirmVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalIconWrapRed}>
              <Trash2 size={28} color="#DC2626" strokeWidth={2.4} />
            </View>
            <Text style={styles.modalTitle}>¿Archivar Expediente?</Text>
            <Text style={styles.modalDesc}>
              El reporte de{" "}
              <Text style={styles.boldText}>
                "{incidenteSeleccionado?.titulo}"
              </Text>{" "}
              en {incidenteSeleccionado?.calle_nombre} pasará a estado inactivo
              y se retirará del mapa ciudadano.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnModalCancel}
                activeOpacity={0.7}
                onPress={() => setModalConfirmVisible(false)}
                disabled={eliminando}
              >
                <Text style={styles.btnModalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnModalConfirm}
                activeOpacity={0.8}
                onPress={confirmarArchivado}
                disabled={eliminando}
              >
                {eliminando ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnModalConfirmText}>Sí, Archivar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. Modal Institucional de Aviso (Pendiente / En revisión) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalAvisoVisible}
        onRequestClose={() => setModalAvisoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setModalAvisoVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalIconWrapAmber}>
              <AlertTriangle size={28} color="#D97706" strokeWidth={2.4} />
            </View>
            <Text style={styles.modalTitle}>Expediente no Concluido</Text>
            <Text style={styles.modalDesc}>
              Este reporte en{" "}
              <Text style={styles.boldText}>
                {incidenteSeleccionado?.calle_nombre}
              </Text>{" "}
              aún se encuentra en estado{" "}
              <Text style={styles.boldText}>
                {incidenteSeleccionado?.estado?.toUpperCase()}
              </Text>
              . Solo los reportes dictaminados como{" "}
              <Text style={styles.boldText}>RESUELTOS</Text> pueden archivarse.
            </Text>

            <TouchableOpacity
              style={styles.btnModalAvisoOk}
              activeOpacity={0.8}
              onPress={() => setModalAvisoVisible(false)}
            >
              <Text style={styles.btnModalAvisoOkText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
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

  /* Modales Estilizados */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: COLORS.borderLight,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    marginBottom: SPACING.md,
  },
  modalIconWrapRed: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  modalIconWrapAmber: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textDark,
  },
  modalDesc: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 6,
    marginBottom: SPACING.lg,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  boldText: {
    fontWeight: "800",
    color: COLORS.textDark,
  },
  modalActions: {
    flexDirection: "row",
    gap: SPACING.sm,
    width: "100%",
  },
  btnModalCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  btnModalCancelText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  btnModalConfirm: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    backgroundColor: "#DC2626",
  },
  btnModalConfirmText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  btnModalAvisoOk: {
    width: "100%",
    paddingVertical: 13,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    backgroundColor: COLORS.primaryDark,
  },
  btnModalAvisoOkText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
