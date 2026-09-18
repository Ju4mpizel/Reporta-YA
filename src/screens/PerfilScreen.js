// src/screens/PerfilScreen.js
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import {
  User,
  Phone,
  MapPin,
  Calendar,
  LogOut,
  FileText,
  AlertCircle,
} from "lucide-react-native";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

export default function PerfilScreen() {
  const { perfil, logout } = useAuth();
  const [metricas, setMetricas] = useState({
    total: 0,
    enProceso: 0,
    resueltos: 0,
  });
  const [misIncidentes, setMisIncidentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (perfil?.id) {
      cargarIncidentesUsuario();
    } else {
      setCargando(false);
    }
  }, [perfil]);

  async function cargarIncidentesUsuario() {
    try {
      setCargando(true);

      const { data: incidentesData, error: incError } = await supabase
        .from("incidentes")
        .select(
          `
          id,
          titulo,
          estado,
          created_at,
          calles ( nombre )
        `,
        )
        .eq("usuario_id", perfil.id)
        .order("created_at", { ascending: false });

      if (incError) throw incError;

      const items = incidentesData || [];
      setMisIncidentes(items);

      const total = items.length;
      const enProceso = items.filter(
        (i) => i.estado === "en_revision" || i.estado === "realizando_trabajos",
      ).length;
      const resueltos = items.filter((i) => i.estado === "hecho").length;

      setMetricas({ total, enProceso, resueltos });
    } catch (err) {
      console.error("Error al cargar incidentes de usuario:", err.message);
    } finally {
      setCargando(false);
    }
  }

  const confirmarLogout = () => {
    setModalVisible(false);
    logout();
  };

  if (cargando) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerSub}>CALA CALA · DISTRITO 12</Text>
          <Text style={styles.headerTitle}>Mi Perfil Ciudadano</Text>
        </View>

        <View style={styles.identityCard}>
          <View style={styles.avatarCircle}>
            <User size={36} color={COLORS.textDark} strokeWidth={2} />
          </View>
          <Text style={styles.userName}>
            {perfil?.nombre_completo || "Ciudadano"}
          </Text>
          <View style={styles.badgesRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {(
                  perfil?.roles?.nombre ||
                  perfil?.rol_id ||
                  "Ciudadano"
                ).toUpperCase()}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {perfil?.activo ? "ACTIVO" : "INACTIVO"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardSectionTitle}>DATOS DE LA CUENTA</Text>

          <View style={styles.infoRow}>
            <View style={styles.iconLabel}>
              <FileText size={15} color={COLORS.textMuted} />
              <Text style={styles.labelText}>Carnet de Identidad (CI)</Text>
            </View>
            <Text style={styles.valueText}>
              {perfil?.ci || "No registrado"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconLabel}>
              <Phone size={15} color={COLORS.textMuted} />
              <Text style={styles.labelText}>Teléfono / Celular</Text>
            </View>
            <Text style={styles.valueText}>
              {perfil?.telefono || "No registrado"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconLabel}>
              <MapPin size={15} color={COLORS.textMuted} />
              <Text style={styles.labelText}>Jurisdicción</Text>
            </View>
            <Text style={styles.valueText}>Cala Cala (D-12)</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={styles.iconLabel}>
              <Calendar size={15} color={COLORS.textMuted} />
              <Text style={styles.labelText}>Miembro desde</Text>
            </View>
            <Text style={styles.valueText}>
              {perfil?.created_at
                ? new Date(perfil.created_at).toLocaleDateString()
                : "Septiembre 2026"}
            </Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{metricas.total}</Text>
            <Text style={styles.statLabel}>Registrados</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: COLORS.amber }]}>
              {metricas.enProceso}
            </Text>
            <Text style={styles.statLabel}>En Proceso</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: COLORS.green }]}>
              {metricas.resueltos}
            </Text>
            <Text style={styles.statLabel}>Resueltos</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>MIS REPORTES RECIENTES</Text>
        {misIncidentes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Aún no has registrado ningún reporte.
            </Text>
          </View>
        ) : (
          misIncidentes.slice(0, 3).map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.historyTop}>
                <Text style={styles.historyStreet}>
                  {item.calles?.nombre || "Vía urbana"}
                </Text>
                <Text style={styles.historyBadge}>
                  {item.estado === "hecho"
                    ? "RESUELTO"
                    : item.estado === "realizando_trabajos"
                      ? "EN TRABAJOS"
                      : "EN REVISIÓN"}
                </Text>
              </View>
              <Text style={styles.historyTitle}>{item.titulo}</Text>
              <Text style={styles.historyDate}>
                Reportado el {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}

        {/* Botón de Cerrar Sesión */}
        <TouchableOpacity
          style={styles.btnLogout}
          activeOpacity={0.7}
          onPress={() => setModalVisible(true)}
        >
          <LogOut size={16} color="#DC2626" strokeWidth={2.2} />
          <Text style={styles.btnLogoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal / Bottom Sheet Moderno de Confirmación */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalIconWrap}>
              <AlertCircle size={28} color="#DC2626" strokeWidth={2.4} />
            </View>
            <Text style={styles.modalTitle}>¿Cerrar Sesión?</Text>
            <Text style={styles.modalDesc}>
              Tendrás que volver a ingresar tu carnet y contraseña para realizar
              o apoyar incidentes.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnModalCancel}
                activeOpacity={0.7}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnModalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnModalConfirm}
                activeOpacity={0.8}
                onPress={confirmarLogout}
              >
                <Text style={styles.btnModalConfirmText}>Sí, Salir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.bottomInset,
  },
  header: { paddingTop: 40, marginBottom: SPACING.md },
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
    backgroundColor: COLORS.background,
  },
  loadingText: { marginTop: 10, fontSize: 12, color: COLORS.textMuted },
  identityCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.textDark,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: COLORS.textDark,
    backgroundColor: COLORS.surfaceMuted,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  userName: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 6,
  },
  badgesRow: { flexDirection: "row", gap: SPACING.xs },
  roleBadge: {
    backgroundColor: COLORS.textDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  roleText: { color: COLORS.textWhite, fontSize: 9, fontWeight: "800" },
  statusBadge: {
    borderWidth: 1,
    borderColor: COLORS.textDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
  },
  statusText: { color: COLORS.textDark, fontSize: 9, fontWeight: "800" },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.textDark,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardSectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  iconLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
  labelText: { fontSize: 11, fontWeight: "600", color: COLORS.textMuted },
  valueText: { fontSize: 12, fontWeight: "700", color: COLORS.textDark },
  statsContainer: {
    flexDirection: "row",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.textDark,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    alignItems: "center",
  },
  statNum: { fontSize: 18, fontWeight: "800", color: COLORS.textDark },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  historyCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.textDark,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
  },
  historyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  historyStreet: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
    textTransform: "uppercase",
  },
  historyBadge: { fontSize: 9, fontWeight: "800", color: COLORS.textDark },
  historyTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  historyDate: { fontSize: 10, color: COLORS.textSubtle, marginTop: 4 },
  emptyCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  emptyText: { fontSize: 12, color: COLORS.textMuted },

  btnLogout: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    borderWidth: 1.5,
    borderColor: "#EF4444",
    borderRadius: RADIUS.sm,
    paddingVertical: 13,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  btnLogoutText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#DC2626",
    textTransform: "uppercase",
  },

  /* Modal Bottom Sheet */
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
    borderTopWidth: 2,
    borderColor: COLORS.textDark,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    marginBottom: SPACING.md,
  },
  modalIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.textDark,
  },
  modalDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 4,
    marginBottom: SPACING.lg,
    lineHeight: 17,
    paddingHorizontal: 12,
  },
  modalActions: {
    flexDirection: "row",
    gap: SPACING.sm,
    width: "100%",
  },
  btnModalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
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
    paddingVertical: 12,
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
});
