// src/screens/PerfilScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Animated,
  Platform,
} from "react-native";
import {
  User,
  Phone,
  MapPin,
  Calendar,
  LogOut,
  FileText,
  AlertCircle,
  ShieldCheck,
  Award,
  ChevronRight,
  Clock,
  CheckCircle2,
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

  const animFade = useRef(new Animated.Value(0)).current;
  const animSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animFade, {
        toValue: 1,
        duration: 350,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(animSlide, {
        toValue: 0,
        duration: 350,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  }, []);

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
        <Text style={styles.loadingText}>Cargando perfil ciudadano...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenWrapper}>
      {/* Header Institucional Curvo */}
      <View style={styles.headerDark}>
        <View style={styles.headerTopLine}>
          <ShieldCheck size={13} color="#38BDF8" strokeWidth={2.4} />
          <Text style={styles.headerSub}>SUBALCALDÍA CALA CALA · D-12</Text>
        </View>
        <Text style={styles.headerTitle}>Credencial Ciudadana</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: animFade,
            transform: [{ translateY: animSlide }],
          }}
        >
          {/* Tarjeta de Identidad Ciudadana Estilizada */}
          <View style={styles.identityCard}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                <User size={38} color="#FFFFFF" strokeWidth={2.2} />
              </View>
              <View style={styles.activeBadge}>
                <ShieldCheck size={11} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </View>

            <Text style={styles.userName}>
              {perfil?.nombre_completo || "Vecino Registrado"}
            </Text>
            <Text style={styles.userJurisdiccion}>
              Distrito Municipal 12 · Cala Cala
            </Text>

            <View style={styles.badgesRow}>
              <View style={styles.roleBadge}>
                <Award size={12} color="#0284C7" strokeWidth={2.4} />
                <Text style={styles.roleText}>
                  {(
                    perfil?.roles?.nombre ||
                    perfil?.rol_id ||
                    "Ciudadano"
                  ).toUpperCase()}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>
                  {perfil?.activo ? "ACTIVO" : "INACTIVO"}
                </Text>
              </View>
            </View>
          </View>

          {/* Tarjeta de Métricas Territoriales */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{metricas.total}</Text>
              <Text style={styles.statLabel}>Reportados</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxActive]}>
              <Text style={[styles.statNum, { color: COLORS.amber }]}>
                {metricas.enProceso}
              </Text>
              <Text style={styles.statLabel}>En Proceso</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxDone]}>
              <Text style={[styles.statNum, { color: "#059669" }]}>
                {metricas.resueltos}
              </Text>
              <Text style={styles.statLabel}>Resueltos</Text>
            </View>
          </View>

          {/* Tarjeta de Información de la Cuenta */}
          <View style={styles.infoCard}>
            <Text style={styles.cardSectionTitle}>DATOS DEL REGISTRO</Text>

            <View style={styles.infoRow}>
              <View style={styles.iconLabel}>
                <View style={styles.iconWrapMini}>
                  <FileText size={14} color="#0284C7" />
                </View>
                <Text style={styles.labelText}>Cédula de Identidad</Text>
              </View>
              <Text style={styles.valueText}>{perfil?.ci || "Sin CI"}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconLabel}>
                <View style={styles.iconWrapMini}>
                  <Phone size={14} color="#0284C7" />
                </View>
                <Text style={styles.labelText}>Teléfono de Contacto</Text>
              </View>
              <Text style={styles.valueText}>
                {perfil?.telefono || "No asignado"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconLabel}>
                <View style={styles.iconWrapMini}>
                  <MapPin size={14} color="#0284C7" />
                </View>
                <Text style={styles.labelText}>Jurisdicción Asignada</Text>
              </View>
              <Text style={styles.valueText}>Cochabamba - D12</Text>
            </View>

            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <View style={styles.iconLabel}>
                <View style={styles.iconWrapMini}>
                  <Calendar size={14} color="#0284C7" />
                </View>
                <Text style={styles.labelText}>Fecha de Alta</Text>
              </View>
              <Text style={styles.valueText}>
                {perfil?.created_at
                  ? new Date(perfil.created_at).toLocaleDateString()
                  : "2026"}
              </Text>
            </View>
          </View>

          {/* Historial Reciente */}
          <Text style={styles.sectionHeader}>HISTORIAL RECIENTE</Text>
          {misIncidentes.length === 0 ? (
            <View style={styles.emptyCard}>
              <AlertCircle size={24} color={COLORS.textSubtle} />
              <Text style={styles.emptyText}>
                No tienes incidencias registradas en la zona.
              </Text>
            </View>
          ) : (
            misIncidentes.slice(0, 3).map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyTop}>
                  <Text style={styles.historyStreet}>
                    {item.calles?.nombre || "Vía de Cala Cala"}
                  </Text>
                  <View
                    style={[
                      styles.historyBadgeWrap,
                      item.estado === "hecho"
                        ? { backgroundColor: "#DCFCE7" }
                        : item.estado === "realizando_trabajos"
                          ? { backgroundColor: "#DBEAFE" }
                          : { backgroundColor: "#FEF3C7" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.historyBadgeText,
                        item.estado === "hecho"
                          ? { color: "#15803D" }
                          : item.estado === "realizando_trabajos"
                            ? { color: "#1D4ED8" }
                            : { color: "#B45309" },
                      ]}
                    >
                      {item.estado === "hecho"
                        ? "RESUELTO"
                        : item.estado === "realizando_trabajos"
                          ? "EN TRABAJOS"
                          : "EN REVISIÓN"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.historyTitle}>{item.titulo}</Text>
                <View style={styles.historyFooter}>
                  <Clock size={11} color={COLORS.textSubtle} />
                  <Text style={styles.historyDate}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          )}

          {/* Botón de Logout Institucional */}
          <TouchableOpacity
            style={styles.btnLogout}
            activeOpacity={0.8}
            onPress={() => setModalVisible(true)}
          >
            <LogOut size={16} color="#EF4444" strokeWidth={2.4} />
            <Text style={styles.btnLogoutText}>Cerrar Sesión Activa</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Modal / Bottom Sheet */}
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
            <Text style={styles.modalTitle}>¿Deseas cerrar tu sesión?</Text>
            <Text style={styles.modalDesc}>
              Deberás volver a ingresar tu CI y clave de acceso para respaldar o
              reportar nuevos problemas vecinales.
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
                <Text style={styles.btnModalConfirmText}>Cerrar Sesión</Text>
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
  headerDark: {
    backgroundColor: "#0F172A",
    paddingHorizontal: SPACING.lg,
    paddingTop: 52,
    paddingBottom: SPACING.lg,
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
  container: { flex: 1 },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.bottomInset || 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: { marginTop: 10, fontSize: 12, color: COLORS.textMuted },

  /* Tarjeta de Identidad */
  identityCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  avatarWrap: {
    position: "relative",
    marginBottom: SPACING.sm,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#38BDF8",
  },
  activeBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userName: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.textDark,
    marginBottom: 2,
  },
  userJurisdiccion: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "600",
    marginBottom: 10,
  },
  badgesRow: { flexDirection: "row", gap: 8 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  roleText: { color: "#0369A1", fontSize: 9.5, fontWeight: "800" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
  },
  statusText: { color: "#15803D", fontSize: 9.5, fontWeight: "800" },

  /* Métricas */
  statsContainer: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: "center",
    elevation: 1,
  },
  statBoxActive: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  statBoxDone: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  statNum: { fontSize: 20, fontWeight: "900", color: COLORS.textDark },
  statLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginTop: 2,
    textTransform: "uppercase",
  },

  /* Card Info */
  infoCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 1,
  },
  cardSectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  iconLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconWrapMini: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: "#F0F9FF",
    alignItems: "center",
    justifyContent: "center",
  },
  labelText: { fontSize: 11.5, fontWeight: "600", color: COLORS.textMuted },
  valueText: { fontSize: 12, fontWeight: "800", color: COLORS.textDark },

  /* Historial */
  sectionHeader: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
    marginLeft: 4,
  },
  historyCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
    elevation: 1,
  },
  historyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  historyStreet: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
    textTransform: "uppercase",
  },
  historyBadgeWrap: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyBadgeText: { fontSize: 8.5, fontWeight: "800" },
  historyTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  historyFooter: { flexDirection: "row", alignItems: "center", gap: 4 },
  historyDate: { fontSize: 10, color: COLORS.textSubtle },

  emptyCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: SPACING.md,
  },
  emptyText: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600" },

  btnLogout: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  btnLogoutText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "#DC2626",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  /* Modal */
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
