// src/screens/GestionIncidenteScreen.js
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  Clock,
  ThumbsUp,
  MapPin,
  User,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Check,
  CheckCircle2,
} from "lucide-react-native";
import { supabase } from "../services/supabase";
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

      const { error } = await supabase
        .from("incidentes")
        .update({
          departamento_id: deptoSeleccionado,
          estado: estadoSeleccionado,
          nota_alcaldia: notaMunicipal.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", incidente.id);

      if (error) throw error;

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
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Superior Limpio */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.btnBack}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color={COLORS.primary} strokeWidth={2.4} />
            <Text style={styles.btnBackText}>Volver a la Bandeja</Text>
          </TouchableOpacity>
          <Text style={styles.headerSub}>GESTIÓN OPERATIVA · D-12</Text>
          <Text style={styles.headerTitle}>Asignar y Dictaminar</Text>
        </View>

        {/* Resumen de Incidente */}
        <View style={styles.summaryCard}>
          <View style={styles.imgPlaceholder}>
            <ImageIcon size={22} color="#94A3B8" />
            <Text style={styles.imgPlaceholderText}>[ FOTO ]</Text>
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryCalle}>{incidente.calle_nombre}</Text>
            <Text style={styles.summaryTitle}>{incidente.titulo}</Text>
            <View style={styles.infoLine}>
              <User size={11} color={COLORS.textMuted} />
              <Text style={styles.infoLineText}>
                Vecino: {incidente.usuario_nombre || "Vecino Registrado"}
              </Text>
            </View>
            <View style={styles.infoLine}>
              <ThumbsUp size={11} color={COLORS.primary} strokeWidth={2.2} />
              <Text style={styles.infoLineVotes}>
                {incidente.total_apoyos} respaldos
              </Text>
            </View>
          </View>
        </View>

        {/* 1. ACORDEÓN: DEPARTAMENTO */}
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
                          deptoSeleccionado === null && styles.optionTextActive,
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

        {/* 2. ACORDEÓN: ESTADO */}
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
                  PASO 2 · ESTADO DEL INCIDENTE
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

        {/* 3. NOTA OFICIAL */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>
            PASO 3 · NOTA OFICIAL DE LA ALCALDÍA
          </Text>
          <TextInput
            style={styles.textarea}
            placeholder="Escribe la instrucción o respuesta que verán los vecinos..."
            placeholderTextColor={COLORS.textSubtle}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={notaMunicipal}
            onChangeText={setNotaMunicipal}
          />
        </View>

        {/* Botón Principal */}
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
            <Text style={styles.modalTitle}>¡Dictamen Actualizado!</Text>
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
  container: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: SPACING.bottomInset },
  header: {
    paddingTop: 45,
    marginBottom: SPACING.md,
  },
  btnBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  btnBackText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
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

  summaryCard: {
    flexDirection: "row",
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 1,
  },
  imgPlaceholder: {
    width: 65,
    height: 65,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    borderRadius: RADIUS.sm,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  imgPlaceholderText: { fontSize: 8, fontWeight: "800", color: "#94A3B8" },
  summaryInfo: { flex: 1, justifyContent: "center" },
  summaryCalle: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 2,
  },
  infoLineText: { fontSize: 10, color: COLORS.textMuted },
  infoLineVotes: { fontSize: 10, fontWeight: "700", color: COLORS.primary },

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
  formLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
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
