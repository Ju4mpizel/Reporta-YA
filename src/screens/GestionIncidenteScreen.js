// src/screens/GestionIncidenteScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Linking,
  Animated,
  Platform,
} from "react-native";
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  Clock,
  ThumbsUp,
  User,
  ChevronDown,
  ChevronUp,
  Check,
  CheckCircle2,
  MapPin,
  ExternalLink,
  FileCheck,
} from "lucide-react-native";
import { supabase } from "../services/supabase";
import { incidentesService } from "../services/incidentesService";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

const ESTADOS_DISPONIBLES = [
  { key: "en_revision", label: "En Revisión (Pendiente)" },
  { key: "realizando_trabajos", label: "Realizando Trabajos (Cuadrilla)" },
  { key: "hecho", label: "Hecho (Resuelto)" },
  { key: "rechazado", label: "Rechazado (No procede)" },
];

export default function GestionIncidenteScreen({ route, navigation }) {
  const { incidente } = route.params;

  const [departamentos, setDepartamentos] = useState([]);
  const [deptoSeleccionado, setDeptoSeleccionado] = useState(
    incidente.departamento_id || null,
  );
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(
    incidente.estado || "en_revision",
  );
  const [notaMunicipal, setNotaMunicipal] = useState(
    incidente.nota_alcaldia || "",
  );

  const [acordeonAbierto, setAcordeonAbierto] = useState(null);
  const [cargandoDeptos, setCargandoDeptos] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [modalExitoVisible, setModalExitoVisible] = useState(false);

  const animFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animFade, {
      toValue: 1,
      duration: 350,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, []);

  useEffect(() => {
    cargarDepartamentos();
  }, []);

  async function cargarDepartamentos() {
    try {
      setCargandoDeptos(true);
      const { data, error } = await supabase
        .from("departamentos")
        .select("id, nombre")
        .eq("activo", true)
        .order("id", { ascending: true });

      if (error) throw error;
      setDepartamentos(data || []);
    } catch (err) {
      console.error("Fallo al cargar departamentos:", err.message);
    } finally {
      setCargandoDeptos(false);
    }
  }

  const toggleAcordeon = (seccion) => {
    setAcordeonAbierto((prev) => (prev === seccion ? null : seccion));
  };

  async function handleGuardar() {
    try {
      setGuardando(true);

      await incidentesService.dictaminar(incidente.id, {
        departamentoId: deptoSeleccionado,
        estado: estadoSeleccionado,
        notaAlcaldia: notaMunicipal,
      });

      setModalExitoVisible(true);
    } catch (err) {
      console.error("Error al dictaminar:", err.message);
    } finally {
      setGuardando(false);
    }
  }

  const handleCerrarModal = () => {
    setModalExitoVisible(false);
    navigation.goBack();
  };

  const nombreDeptoActual = deptoSeleccionado
    ? departamentos.find((d) => d.id === deptoSeleccionado)?.nombre ||
      incidente.departamento_nombre ||
      "Asignado"
    : "Sin Asignar (Pendiente)";

  const etiquetaEstadoActual =
    ESTADOS_DISPONIBLES.find((e) => e.key === estadoSeleccionado)?.label ||
    "En Revisión";

  return (
    <View style={styles.screenWrapper}>
      {/* Header Oscuro Institucional */}
      <View style={styles.headerDark}>
        <TouchableOpacity
          style={styles.btnBack}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={16} color="#38BDF8" strokeWidth={2.4} />
          <Text style={styles.btnBackText}>Volver a la Bandeja</Text>
        </TouchableOpacity>
        <Text style={styles.headerSub}>GESTIÓN OPERATIVA · DISTRITO 12</Text>
        <Text style={styles.headerTitle}>Dictamen de Expediente</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: animFade }}>
          {/* Tarjeta Resumen del Incidente */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryInfo}>
              <View style={styles.badgeJurisdiccion}>
                <MapPin size={10} color={COLORS.primary} strokeWidth={2.5} />
                <Text style={styles.summaryCalle}>
                  {incidente.calle_nombre}
                </Text>
              </View>

              <Text style={styles.summaryTitle}>{incidente.titulo}</Text>
              <Text style={styles.summaryDesc}>{incidente.descripcion}</Text>

              <View style={styles.metaRow}>
                <View style={styles.infoLine}>
                  <User size={11} color={COLORS.textMuted} />
                  <Text style={styles.infoLineText}>
                    Vecino: {incidente.usuario_nombre || "Vecino Registrado"}
                  </Text>
                </View>
                <View style={styles.infoLine}>
                  <ThumbsUp
                    size={11}
                    color={COLORS.primary}
                    strokeWidth={2.2}
                  />
                  <Text style={styles.infoLineVotes}>
                    {incidente.total_apoyos} respaldos
                  </Text>
                </View>
              </View>

              {incidente.maps_url ? (
                <TouchableOpacity
                  style={styles.btnAdminMaps}
                  activeOpacity={0.7}
                  onPress={() => Linking.openURL(incidente.maps_url)}
                >
                  <MapPin size={11} color="#0284C7" strokeWidth={2.2} />
                  <Text style={styles.btnAdminMapsText}>
                    Ver punto exacto en Google Maps
                  </Text>
                  <ExternalLink size={10} color="#0284C7" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Paso 1: Departamento */}
          <View style={styles.accordionContainer}>
            <TouchableOpacity
              style={styles.accordionHeader}
              activeOpacity={0.7}
              onPress={() => toggleAcordeon("departamento")}
            >
              <View style={styles.accordionHeaderLeft}>
                <Building2 size={16} color={COLORS.primary} strokeWidth={2.2} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.accordionStep}>
                    PASO 1 · UNIDAD RESPONSABLE
                  </Text>
                  <Text style={styles.accordionValue} numberOfLines={1}>
                    {nombreDeptoActual}
                  </Text>
                </View>
              </View>
              {acordeonAbierto === "departamento" ? (
                <ChevronUp size={16} color={COLORS.textDark} />
              ) : (
                <ChevronDown size={16} color={COLORS.textDark} />
              )}
            </TouchableOpacity>

            {acordeonAbierto === "departamento" && (
              <View style={styles.accordionBody}>
                {cargandoDeptos ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.primary}
                    style={{ padding: 10 }}
                  />
                ) : (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.optionItem,
                        deptoSeleccionado === null && styles.optionItemActive,
                      ]}
                      onPress={() => {
                        setDeptoSeleccionado(null);
                        setAcordeonAbierto(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.optionContent}>
                        {deptoSeleccionado === null && (
                          <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                        )}
                        <Text
                          style={[
                            styles.optionText,
                            deptoSeleccionado === null &&
                              styles.optionTextActive,
                            { fontStyle: "italic" },
                          ]}
                        >
                          -- Sin Asignar (Pendiente) --
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {departamentos.map((dpto) => {
                      const activo = deptoSeleccionado === dpto.id;
                      return (
                        <TouchableOpacity
                          key={dpto.id}
                          style={[
                            styles.optionItem,
                            activo && styles.optionItemActive,
                          ]}
                          onPress={() => {
                            setDeptoSeleccionado(dpto.id);
                            setAcordeonAbierto(null);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.optionContent}>
                            {activo && (
                              <Check
                                size={14}
                                color="#FFFFFF"
                                strokeWidth={2.5}
                              />
                            )}
                            <Text
                              style={[
                                styles.optionText,
                                activo && styles.optionTextActive,
                              ]}
                            >
                              {dpto.nombre}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </>
                )}
              </View>
            )}
          </View>

          {/* Paso 2: Estado */}
          <View style={styles.accordionContainer}>
            <TouchableOpacity
              style={styles.accordionHeader}
              activeOpacity={0.7}
              onPress={() => toggleAcordeon("estado")}
            >
              <View style={styles.accordionHeaderLeft}>
                <Clock size={16} color={COLORS.primary} strokeWidth={2.2} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.accordionStep}>
                    PASO 2 · ESTADO DEL EXPEDIENTE
                  </Text>
                  <Text style={styles.accordionValue} numberOfLines={1}>
                    {etiquetaEstadoActual}
                  </Text>
                </View>
              </View>
              {acordeonAbierto === "estado" ? (
                <ChevronUp size={16} color={COLORS.textDark} />
              ) : (
                <ChevronDown size={16} color={COLORS.textDark} />
              )}
            </TouchableOpacity>

            {acordeonAbierto === "estado" && (
              <View style={styles.accordionBody}>
                {ESTADOS_DISPONIBLES.map((est) => {
                  const activo = estadoSeleccionado === est.key;
                  return (
                    <TouchableOpacity
                      key={est.key}
                      style={[
                        styles.optionItem,
                        activo && styles.optionItemActive,
                      ]}
                      onPress={() => {
                        setEstadoSeleccionado(est.key);
                        setAcordeonAbierto(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.optionContent}>
                        {activo && (
                          <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                        )}
                        <Text
                          style={[
                            styles.optionText,
                            activo && styles.optionTextActive,
                          ]}
                        >
                          {est.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Paso 3: Nota Oficial */}
          <View style={styles.formGroup}>
            <View style={styles.formLabelRow}>
              <FileCheck size={13} color={COLORS.primary} />
              <Text style={styles.formLabel}>
                PASO 3 · NOTA OFICIAL DE LA ALCALDÍA
              </Text>
            </View>
            <TextInput
              style={styles.textarea}
              placeholder="Escribe la instrucción técnica o respuesta para la ciudadanía..."
              placeholderTextColor={COLORS.textSubtle}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={notaMunicipal}
              onChangeText={setNotaMunicipal}
            />
          </View>

          <TouchableOpacity
            style={[styles.btnSubmit, guardando && styles.btnDisabled]}
            onPress={handleGuardar}
            disabled={guardando}
            activeOpacity={0.8}
          >
            {guardando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.btnContent}>
                <ShieldCheck size={16} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.btnSubmitText}>
                  Guardar Asignación y Estado
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Modal Bottom Sheet de Éxito */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalExitoVisible}
        onRequestClose={handleCerrarModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={handleCerrarModal}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalIconWrap}>
              <CheckCircle2 size={32} color="#16A34A" strokeWidth={2.4} />
            </View>
            <Text style={styles.modalTitle}>¡Expediente Actualizado!</Text>
            <Text style={styles.modalDesc}>
              La unidad responsable, el estado y la resolución oficial fueron
              registrados correctamente en el padrón municipal.
            </Text>

            <TouchableOpacity
              style={styles.btnModalConfirm}
              activeOpacity={0.8}
              onPress={handleCerrarModal}
            >
              <Text style={styles.btnModalConfirmText}>
                Volver a la Bandeja
              </Text>
            </TouchableOpacity>
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
    paddingBottom: SPACING.md,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
    elevation: 3,
  },
  btnBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  btnBackText: { fontSize: 12, fontWeight: "700", color: "#38BDF8" },
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
    marginTop: 2,
  },
  container: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: SPACING.bottomInset || 20 },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 1,
  },
  summaryInfo: { flex: 1 },
  badgeJurisdiccion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0F9FF",
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    marginBottom: 6,
  },
  summaryCalle: {
    fontSize: 9.5,
    fontWeight: "800",
    color: COLORS.primary,
    textTransform: "uppercase",
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  summaryDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginBottom: 6,
  },
  infoLine: { flexDirection: "row", alignItems: "center", gap: 5 },
  infoLineText: { fontSize: 10.5, color: COLORS.textMuted },
  infoLineVotes: { fontSize: 10.5, fontWeight: "700", color: COLORS.primary },

  btnAdminMaps: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    alignSelf: "flex-start",
  },
  btnAdminMapsText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#0284C7",
  },

  accordionContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
    overflow: "hidden",
    elevation: 1,
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  accordionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    flex: 1,
    marginRight: 8,
  },
  accordionStep: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  accordionValue: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textDark,
    marginTop: 2,
  },
  accordionBody: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    padding: SPACING.xs,
    backgroundColor: "#F8FAFC",
  },
  optionItem: {
    paddingVertical: 10,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  optionItemActive: {
    backgroundColor: COLORS.primaryDark,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  optionTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  formGroup: { marginTop: SPACING.xs, marginBottom: SPACING.md },
  formLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  formLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  textarea: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 12,
    color: COLORS.textDark,
    height: 90,
  },
  btnSubmit: {
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  btnDisabled: { opacity: 0.6 },
  btnContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnSubmitText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

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
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#DCFCE7",
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
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 4,
    marginBottom: SPACING.lg,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  btnModalConfirm: {
    width: "100%",
    paddingVertical: 13,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    backgroundColor: COLORS.primaryDark,
  },
  btnModalConfirmText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
