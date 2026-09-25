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
  Linking,
  Animated,
  Platform,
} from "react-native";
import {
  ShieldCheck,
  Building2,
  Clock,
  ThumbsUp,
  User,
  ChevronDown,
  ChevronUp,
  Check,
  MapPin,
  ExternalLink,
  FileCheck,
} from "lucide-react-native";
import NetInfo from "@react-native-community/netinfo";
import { catalogoService } from "../services/catalogoService";
import { DictaminarIncidenteCommand } from "../services/commands/DictaminarIncidenteCommand";
import { commandQueueService } from "../services/CommandQueueService";
import HeaderInstitucional from "../components/HeaderInstitucional";
import CustomModalAlert from "../components/CustomModalAlert";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

const ESTADOS_DISPONIBLES = [
  { key: "en_revision", label: "En Revisión (Pendiente)" },
  { key: "realizando_trabajos", label: "Realizando Trabajos (Cuadrilla)" },
  { key: "hecho", label: "Hecho (Resuelto)" },
  { key: "rechazado", label: "Rechazado (No procede)" },
];

export default function GestionIncidenteScreen({ route, navigation }) {
  const incidente = route?.params?.incidente;

  const [departamentos, setDepartamentos] = useState([]);
  const [deptoSeleccionado, setDeptoSeleccionado] = useState(
    incidente?.departamento_id || null,
  );
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(
    incidente?.estado || "en_revision",
  );
  const [notaMunicipal, setNotaMunicipal] = useState(
    incidente?.nota_alcaldia || "",
  );

  const [acordeonAbierto, setAcordeonAbierto] = useState(null);
  const [cargandoDeptos, setCargandoDeptos] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [alerta, setAlerta] = useState({
    visible: false,
    tipo: "exito",
    titulo: "",
    mensaje: "",
    onConfirmar: null,
  });

  const animFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animFade, {
      toValue: 1,
      duration: 350,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, []);

  useEffect(() => {
    if (incidente) {
      cargarDepartamentos();
    }
  }, [incidente]);

  async function cargarDepartamentos() {
    try {
      setCargandoDeptos(true);
      const data = await catalogoService.obtenerDepartamentos();
      setDepartamentos(data || []);
    } catch (err) {
      console.warn("Fallo al cargar departamentos:", err.message);
    } finally {
      setCargandoDeptos(false);
    }
  }

  const toggleAcordeon = (seccion) => {
    setAcordeonAbierto((prev) => (prev === seccion ? null : seccion));
  };

  async function handleGuardar() {
    if (!incidente) return;

    const comando = new DictaminarIncidenteCommand({
      incidenteId: incidente.id,
      departamentoId: deptoSeleccionado,
      estado: estadoSeleccionado,
      notaAlcaldia: notaMunicipal,
      tituloIncidente: incidente.titulo,
    });

    try {
      setGuardando(true);

      let tieneInternet = true;
      try {
        if (Platform.OS === "web" && typeof navigator !== "undefined") {
          tieneInternet = navigator.onLine === true;
        }
        if (tieneInternet) {
          const netState = await NetInfo.fetch();
          tieneInternet = Boolean(
            netState.isConnected && netState.isInternetReachable !== false,
          );
        }
      } catch {
        tieneInternet = false;
      }

      if (tieneInternet) {
        await comando.execute();
        setAlerta({
          visible: true,
          tipo: "exito",
          titulo: "¡Expediente Actualizado!",
          mensaje:
            "La unidad responsable, el estado y la resolución municipal fueron guardados exitosamente.",
          onConfirmar: () => navigation.goBack(),
        });
      } else {
        await commandQueueService.encolar(comando);
        setAlerta({
          visible: true,
          tipo: "info",
          titulo: "Dictamen Guardado en Cola",
          mensaje:
            "Sin conexión a internet. La asignación y resolución se guardaron localmente y se actualizarán automáticamente en el servidor municipal.",
          onConfirmar: () => navigation.goBack(),
        });
      }
    } catch (err) {
      const esErrorDeRed =
        err.message?.toLowerCase().includes("failed to fetch") ||
        err.message?.toLowerCase().includes("network") ||
        (Platform.OS === "web" &&
          typeof navigator !== "undefined" &&
          !navigator.onLine);

      if (esErrorDeRed) {
        await commandQueueService.encolar(comando);
        setAlerta({
          visible: true,
          tipo: "info",
          titulo: "Dictamen Guardado en Cola",
          mensaje:
            "La conexión se interrumpió durante el guardado. Tu resolución fue guardada localmente y se sincronizará automáticamente.",
          onConfirmar: () => navigation.goBack(),
        });
      } else {
        setAlerta({
          visible: true,
          tipo: "error",
          titulo: "Error al dictaminar",
          mensaje: err.message || "No se pudo actualizar el expediente.",
          onConfirmar: null,
        });
      }
    } finally {
      setGuardando(false);
    }
  }

  // Salvaguarda visual si la pantalla se abrió sin parámetros válidos
  if (!incidente) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorParamText}>
          No se proporcionó información de un expediente válido.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.btnVolverFallback}
          activeOpacity={0.8}
        >
          <Text style={styles.btnVolverFallbackText}>Volver a la Bandeja</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
      <HeaderInstitucional
        titulo="Dictamen de Expediente"
        subtitulo="GESTIÓN OPERATIVA · DISTRITO 12"
        onBack={() => navigation.goBack()}
        backText="Volver a la Bandeja"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: animFade }}>
          {/* Tarjeta Resumen */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryInfo}>
              <View style={styles.badgeJurisdiccion}>
                <MapPin size={10} color={COLORS.primary} strokeWidth={2.5} />
                <Text style={styles.summaryCalle}>
                  {incidente.calle_nombre || "Vía Registrada"}
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

      {/* Alerta Institucional */}
      <CustomModalAlert
        visible={alerta.visible}
        tipo={alerta.tipo}
        titulo={alerta.titulo}
        mensaje={alerta.mensaje}
        onConfirmar={() => {
          const accion = alerta.onConfirmar;
          setAlerta((prev) => ({ ...prev, visible: false }));
          if (accion) accion();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  errorParamText: {
    color: COLORS.textDark,
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 16,
  },
  btnVolverFallback: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  btnVolverFallbackText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },
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
});
