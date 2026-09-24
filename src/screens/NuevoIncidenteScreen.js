// src/screens/NuevoIncidenteScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Platform,
  Image,
} from "react-native";
import {
  MapPin,
  Navigation,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
  Check,
  Send,
  Lock,
  Camera,
  X,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import NetInfo from "@react-native-community/netinfo";
import { supabase } from "../services/supabase";
import { CrearIncidenteCommand } from "../services/commands/CrearIncidenteCommand";
import { commandQueueService } from "../services/CommandQueueService";
import HeaderInstitucional from "../components/HeaderInstitucional";
import CustomModalAlert from "../components/CustomModalAlert";
import { useAuth } from "../context/AuthContext";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

export default function NuevoIncidenteScreen({ navigation }) {
  const { perfil } = useAuth();

  const [zonas, setZonas] = useState([]);
  const [calles, setCalles] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [acordeonAbierto, setAcordeonAbierto] = useState("zona");

  const [zonaSeleccionada, setZonaSeleccionada] = useState(null);
  const [calleSeleccionada, setCalleSeleccionada] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenUri, setImagenUri] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Estado unificado de Alertas
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
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (zonaSeleccionada) {
      cargarCallesDeZona(zonaSeleccionada.id);
    } else {
      setCalles([]);
      setCalleSeleccionada(null);
    }
  }, [zonaSeleccionada]);

  async function cargarDatosIniciales() {
    try {
      setCargando(true);
      const [resZonas, resCats] = await Promise.all([
        supabase.from("zonas").select("id, nombre, distrito").order("nombre"),
        supabase
          .from("categorias_incidente")
          .select("id, nombre")
          .order("nombre"),
      ]);

      if (resZonas.data) setZonas(resZonas.data);
      if (resCats.data) setCategorias(resCats.data);
    } catch (err) {
      console.error("Error al cargar datos:", err);
    } finally {
      setCargando(false);
    }
  }

  async function cargarCallesDeZona(zonaId) {
    try {
      const { data, error } = await supabase
        .from("calles")
        .select("id, nombre, tipo, google_maps_url")
        .eq("zona_id", zonaId)
        .order("nombre");

      if (error) throw error;
      setCalles(data || []);
      setCalleSeleccionada(null);
    } catch (err) {
      console.error("Error al cargar calles:", err);
      setCalles([]);
    }
  }

  const toggleAcordeon = (seccion, bloqueado) => {
    if (bloqueado) return;
    setAcordeonAbierto((prev) => (prev === seccion ? null : seccion));
  };

  const seleccionarImagen = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        setAlerta({
          visible: true,
          tipo: "error",
          titulo: "Permiso Denegado",
          mensaje:
            "Se requiere permiso para acceder a la galería y adjuntar fotografías evidenciales.",
          onConfirmar: null,
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImagenUri(result.assets[0].uri);
      }
    } catch (error) {
      console.warn("Aviso selección de imagen:", error.message);
    }
  };

  const limpiarFormulario = () => {
    setZonaSeleccionada(null);
    setCalleSeleccionada(null);
    setCategoriaSeleccionada(null);
    setTitulo("");
    setDescripcion("");
    setImagenUri(null);
    setAcordeonAbierto("zona");
  };

  async function handleGuardar() {
    if (!zonaSeleccionada || !calleSeleccionada || !categoriaSeleccionada) {
      setAlerta({
        visible: true,
        tipo: "error",
        titulo: "Pasos Incompletos",
        mensaje:
          "Por favor selecciona la zona, calle y categoría del problema.",
        onConfirmar: null,
      });
      return;
    }
    if (!titulo.trim() || !descripcion.trim()) {
      setAlerta({
        visible: true,
        tipo: "error",
        titulo: "Detalles Requeridos",
        mensaje:
          "Debes ingresar un título y la descripción detallada del problema.",
        onConfirmar: null,
      });
      return;
    }

    try {
      setEnviando(true);

      const comando = new CrearIncidenteCommand({
        usuarioId: perfil?.id,
        calleId: calleSeleccionada.id,
        categoriaId: categoriaSeleccionada.id,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        mapsUrl: calleSeleccionada.google_maps_url || null,
        fotoLocalUri: imagenUri || null,
      });

      const netState = await NetInfo.fetch();
      const hayInternet = Boolean(
        netState.isConnected && netState.isInternetReachable !== false,
      );

      if (hayInternet) {
        await comando.execute();
        limpiarFormulario();
        setAlerta({
          visible: true,
          tipo: "exito",
          titulo: "¡Reporte Registrado!",
          mensaje:
            "Tu reporte fue transmitido exitosamente al servidor distrital. Los vecinos y la Subalcaldía podrán darle seguimiento.",
          onConfirmar: () => navigation.navigate("Incidentes"),
        });
      } else {
        await commandQueueService.encolar(comando);
        limpiarFormulario();
        setAlerta({
          visible: true,
          tipo: "info",
          titulo: "Reporte Guardado en Cola",
          mensaje:
            "Sin conexión a internet en este momento. Tu reporte fue almacenado localmente y se enviará de forma automática al restablecerse la red.",
          onConfirmar: () => navigation.navigate("Incidentes"),
        });
      }
    } catch (err) {
      setAlerta({
        visible: true,
        tipo: "error",
        titulo: "Error al enviar",
        mensaje: err.message || "No se pudo procesar el reporte.",
        onConfirmar: null,
      });
    } finally {
      setEnviando(false);
    }
  }

  const pasoCalleBloqueado = !zonaSeleccionada;
  const pasoCategoriaBloqueado = !calleSeleccionada;
  const pasoDetallesBloqueado = !categoriaSeleccionada;

  if (cargando) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando formulario distrital...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenWrapper}>
      <HeaderInstitucional titulo="Registrar Incidente" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: animFade }}>
          {/* 1. ACORDEÓN: ZONA */}
          <View style={styles.accordionContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.accordionHeader}
              onPress={() => toggleAcordeon("zona", false)}
            >
              <View style={styles.accordionHeaderLeft}>
                <MapPin size={17} color={COLORS.primary} strokeWidth={2.2} />
                <View>
                  <Text style={styles.accordionStep}>
                    PASO 1 · JURISDICCIÓN
                  </Text>
                  <Text style={styles.accordionTitle}>
                    {zonaSeleccionada
                      ? `Zona: ${zonaSeleccionada.nombre}`
                      : "Seleccionar Zona"}
                  </Text>
                </View>
              </View>
              {acordeonAbierto === "zona" ? (
                <ChevronUp size={16} color={COLORS.textDark} />
              ) : (
                <ChevronDown size={16} color={COLORS.textDark} />
              )}
            </TouchableOpacity>

            {acordeonAbierto === "zona" && (
              <View style={styles.accordionBody}>
                {zonas.map((z) => {
                  const activa = zonaSeleccionada?.id === z.id;
                  return (
                    <TouchableOpacity
                      key={z.id}
                      style={[
                        styles.optionItem,
                        activa && styles.optionItemActive,
                      ]}
                      onPress={() => {
                        setZonaSeleccionada(z);
                        setAcordeonAbierto("calle");
                      }}
                    >
                      <View style={styles.optionContent}>
                        {activa && (
                          <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                        )}
                        <Text
                          style={[
                            styles.optionText,
                            activa && styles.optionTextActive,
                          ]}
                        >
                          {z.nombre} (Distrito {z.distrito})
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* 2. ACORDEÓN: CALLE */}
          <View
            style={[
              styles.accordionContainer,
              pasoCalleBloqueado && styles.containerDisabled,
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.accordionHeader,
                pasoCalleBloqueado && styles.headerDisabled,
              ]}
              onPress={() => toggleAcordeon("calle", pasoCalleBloqueado)}
            >
              <View style={styles.accordionHeaderLeft}>
                {pasoCalleBloqueado ? (
                  <Lock size={15} color={COLORS.textSubtle} />
                ) : (
                  <Navigation
                    size={17}
                    color={COLORS.primary}
                    strokeWidth={2.2}
                  />
                )}
                <View>
                  <Text
                    style={[
                      styles.accordionStep,
                      pasoCalleBloqueado && styles.textDisabled,
                    ]}
                  >
                    PASO 2 · CALLE O AVENIDA
                  </Text>
                  <Text
                    style={[
                      styles.accordionTitle,
                      pasoCalleBloqueado && styles.textDisabled,
                    ]}
                  >
                    {pasoCalleBloqueado
                      ? "Selecciona primero una zona"
                      : calleSeleccionada
                        ? `Calle: ${calleSeleccionada.nombre}`
                        : "Seleccionar Calle"}
                  </Text>
                </View>
              </View>
              {!pasoCalleBloqueado &&
                (acordeonAbierto === "calle" ? (
                  <ChevronUp size={16} color={COLORS.textDark} />
                ) : (
                  <ChevronDown size={16} color={COLORS.textDark} />
                ))}
            </TouchableOpacity>

            {acordeonAbierto === "calle" && !pasoCalleBloqueado && (
              <View style={styles.accordionBody}>
                {calles.length === 0 ? (
                  <Text style={styles.emptyNote}>
                    No hay vías registradas en esta zona.
                  </Text>
                ) : (
                  calles.map((c) => {
                    const activa = calleSeleccionada?.id === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.optionItem,
                          activa && styles.optionItemActive,
                        ]}
                        onPress={() => {
                          setCalleSeleccionada(c);
                          setAcordeonAbierto("categoria");
                        }}
                      >
                        <View style={styles.optionContent}>
                          {activa && (
                            <Check
                              size={14}
                              color="#FFFFFF"
                              strokeWidth={2.5}
                            />
                          )}
                          <Text
                            style={[
                              styles.optionText,
                              activa && styles.optionTextActive,
                            ]}
                          >
                            {c.nombre}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}
          </View>

          {/* 3. ACORDEÓN: CATEGORÍA */}
          <View
            style={[
              styles.accordionContainer,
              pasoCategoriaBloqueado && styles.containerDisabled,
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.accordionHeader,
                pasoCategoriaBloqueado && styles.headerDisabled,
              ]}
              onPress={() =>
                toggleAcordeon("categoria", pasoCategoriaBloqueado)
              }
            >
              <View style={styles.accordionHeaderLeft}>
                {pasoCategoriaBloqueado ? (
                  <Lock size={15} color={COLORS.textSubtle} />
                ) : (
                  <AlertTriangle
                    size={17}
                    color={COLORS.primary}
                    strokeWidth={2.2}
                  />
                )}
                <View>
                  <Text
                    style={[
                      styles.accordionStep,
                      pasoCategoriaBloqueado && styles.textDisabled,
                    ]}
                  >
                    PASO 3 · CATEGORÍA DEL DAÑO
                  </Text>
                  <Text
                    style={[
                      styles.accordionTitle,
                      pasoCategoriaBloqueado && styles.textDisabled,
                    ]}
                  >
                    {pasoCategoriaBloqueado
                      ? "Selecciona primero una calle"
                      : categoriaSeleccionada
                        ? `Categoría: ${categoriaSeleccionada.nombre}`
                        : "Seleccionar Categoría"}
                  </Text>
                </View>
              </View>
              {!pasoCategoriaBloqueado &&
                (acordeonAbierto === "categoria" ? (
                  <ChevronUp size={16} color={COLORS.textDark} />
                ) : (
                  <ChevronDown size={16} color={COLORS.textDark} />
                ))}
            </TouchableOpacity>

            {acordeonAbierto === "categoria" && !pasoCategoriaBloqueado && (
              <View style={styles.accordionBody}>
                {categorias.map((cat) => {
                  const activa = categoriaSeleccionada?.id === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.optionItem,
                        activa && styles.optionItemActive,
                      ]}
                      onPress={() => {
                        setCategoriaSeleccionada(cat);
                        setAcordeonAbierto(null);
                      }}
                    >
                      <View style={styles.optionContent}>
                        {activa && (
                          <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                        )}
                        <Text
                          style={[
                            styles.optionText,
                            activa && styles.optionTextActive,
                          ]}
                        >
                          {cat.nombre}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* 4. DETALLES DEL PROBLEMA */}
          <View
            style={[
              styles.formSection,
              pasoDetallesBloqueado && styles.sectionDisabled,
            ]}
          >
            <View style={styles.formSectionHeader}>
              <FileText
                size={14}
                color={
                  pasoDetallesBloqueado ? COLORS.textSubtle : COLORS.primary
                }
              />
              <Text
                style={[
                  styles.formSectionTitle,
                  pasoDetallesBloqueado && styles.textDisabled,
                ]}
              >
                PASO 4 · DETALLES DEL PROBLEMA
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  pasoDetallesBloqueado && styles.textDisabled,
                ]}
              >
                Título Corto
              </Text>
              <TextInput
                style={[
                  styles.input,
                  pasoDetallesBloqueado && styles.inputDisabled,
                ]}
                placeholder={
                  pasoDetallesBloqueado
                    ? "Completa los pasos anteriores..."
                    : "Ej: Bache profundo carril derecho"
                }
                placeholderTextColor={COLORS.textSubtle}
                value={titulo}
                onChangeText={setTitulo}
                editable={!pasoDetallesBloqueado}
                maxLength={120}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  pasoDetallesBloqueado && styles.textDisabled,
                ]}
              >
                Descripción Detallada
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textarea,
                  pasoDetallesBloqueado && styles.inputDisabled,
                ]}
                placeholder={
                  pasoDetallesBloqueado
                    ? "Completa los pasos anteriores..."
                    : "Indica referencias exactas, carril o daño observado..."
                }
                placeholderTextColor={COLORS.textSubtle}
                value={descripcion}
                onChangeText={setDescripcion}
                editable={!pasoDetallesBloqueado}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* FOTOGRAFÍA EVIDENCIAL */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  pasoDetallesBloqueado && styles.textDisabled,
                ]}
              >
                Fotografía Evidencial (Opcional)
              </Text>

              {imagenUri ? (
                <View style={styles.previewContainer}>
                  <Image
                    source={{ uri: imagenUri }}
                    style={styles.previewImage}
                  />
                  <TouchableOpacity
                    style={styles.btnRemoveImage}
                    onPress={() => setImagenUri(null)}
                    activeOpacity={0.8}
                  >
                    <X size={14} color="#FFFFFF" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.btnSelectImage,
                    pasoDetallesBloqueado && styles.inputDisabled,
                  ]}
                  onPress={seleccionarImagen}
                  disabled={pasoDetallesBloqueado}
                  activeOpacity={0.7}
                >
                  <Camera size={18} color={COLORS.primary} strokeWidth={2.2} />
                  <Text style={styles.btnSelectImageText}>
                    Adjuntar foto desde galería
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.btnSubmit,
              (pasoDetallesBloqueado || enviando) && styles.btnDisabled,
            ]}
            onPress={handleGuardar}
            disabled={pasoDetallesBloqueado || enviando}
            activeOpacity={0.8}
          >
            {enviando ? (
              <View style={styles.btnContent}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.btnSubmitText}>
                  {imagenUri
                    ? "Procesando evidencia..."
                    : "Despachando reporte..."}
                </Text>
              </View>
            ) : (
              <View style={styles.btnContent}>
                <Send size={15} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.btnSubmitText}>
                  Enviar Reporte Ciudadano
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Alerta Institucional Reutilizable */}
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
  },
  accordionStep: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  accordionTitle: {
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
  optionItemActive: { backgroundColor: COLORS.primaryDark },
  optionContent: { flexDirection: "row", alignItems: "center", gap: 6 },
  optionText: { fontSize: 12, fontWeight: "600", color: COLORS.textDark },
  optionTextActive: { color: "#FFFFFF", fontWeight: "800" },
  emptyNote: {
    padding: SPACING.sm,
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: "italic",
  },
  containerDisabled: { borderColor: "#E2E8F0", backgroundColor: "#F8FAFC" },
  headerDisabled: { backgroundColor: "#F8FAFC" },
  textDisabled: { color: "#94A3B8" },
  sectionDisabled: { opacity: 0.65 },
  inputDisabled: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    color: "#94A3B8",
  },
  formSection: { marginTop: SPACING.xs },
  formSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: SPACING.xs,
  },
  formSectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  inputGroup: { marginBottom: SPACING.sm },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textDark,
  },
  textarea: { height: 85 },
  btnSelectImage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F0F9FF",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#BAE6FD",
    borderRadius: RADIUS.md,
    paddingVertical: 14,
  },
  btnSelectImageText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  previewContainer: {
    position: "relative",
    width: "100%",
    height: 160,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  btnRemoveImage: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSubmit: {
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  btnDisabled: { backgroundColor: "#94A3B8", opacity: 0.7 },
  btnContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnSubmitText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
