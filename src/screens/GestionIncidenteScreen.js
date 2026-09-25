// src/screens/GestionIncidenteScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Platform,
} from "react-native";
import {
  ShieldCheck,
  Building2,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
  FileCheck,
} from "lucide-react-native";
import NetInfo from "@react-native-community/netinfo";
import { catalogoService } from "../services/catalogoService";
import { DictaminarIncidenteCommand } from "../services/commands/DictaminarIncidenteCommand";
import { commandQueueService } from "../services/CommandQueueService";
import HeaderInstitucional from "../components/layout/HeaderInstitucional";
import CustomModalAlert from "../components/feedback/CustomModalAlert";
import ExpedienteResumenCard from "../components/formulario/ExpedienteResumenCard";
import { styles } from "../styles/gestionIncidente.styles";
import { COLORS } from "../constants/theme";

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
          {/* Ficha técnica del incidente extraída */}
          <ExpedienteResumenCard incidente={incidente} />

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
