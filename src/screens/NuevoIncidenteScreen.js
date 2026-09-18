// src/screens/NuevoIncidenteScreen.js
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
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
} from "lucide-react-native";
import { supabase } from "../services/supabase";
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
  const [enviando, setEnviando] = useState(false);

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
        .select("id, nombre, tipo")
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

  async function handleGuardar() {
    if (!zonaSeleccionada || !calleSeleccionada || !categoriaSeleccionada) {
      Alert.alert(
        "Campos incompletos",
        "Por favor completa la zona, calle y categoría.",
      );
      return;
    }
    if (!titulo.trim() || !descripcion.trim()) {
      Alert.alert(
        "Detalles incompletos",
        "Escribe un título y descripción del problema.",
      );
      return;
    }

    try {
      setEnviando(true);

      const { error } = await supabase.from("incidentes").insert([
        {
          usuario_id: perfil?.id,
          calle_id: calleSeleccionada.id,
          categoria_id: categoriaSeleccionada.id,
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          estado: "en_revision",
        },
      ]);

      if (error) throw error;

      Alert.alert(
        "¡Reporte Enviado!",
        "El incidente ha sido registrado con éxito.",
        [
          {
            text: "Ver Incidentes",
            onPress: () => {
              setZonaSeleccionada(null);
              setCalleSeleccionada(null);
              setCategoriaSeleccionada(null);
              setTitulo("");
              setDescripcion("");
              navigation.navigate("Incidentes");
            },
          },
        ],
      );
    } catch (err) {
      Alert.alert("Error al enviar", err.message);
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
        <Text style={styles.loadingText}>Cargando opciones...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerSub}>SISTEMA DE GESTIÓN URBANA</Text>
        <Text style={styles.headerTitle}>Registrar Incidente</Text>
      </View>

      {/* 1. ACORDEÓN: ZONA */}
      <View style={styles.accordionContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.accordionHeader}
          onPress={() => toggleAcordeon("zona", false)}
        >
          <View style={styles.accordionHeaderLeft}>
            <MapPin size={18} color={COLORS.textDark} strokeWidth={2.2} />
            <View>
              <Text style={styles.accordionStep}>PASO 1</Text>
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
                  style={[styles.optionItem, activa && styles.optionItemActive]}
                  onPress={() => {
                    setZonaSeleccionada(z);
                    setAcordeonAbierto(null);
                  }}
                >
                  <View style={styles.optionContent}>
                    {activa && (
                      <Check
                        size={14}
                        color={COLORS.textWhite}
                        strokeWidth={2.5}
                      />
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
              <Lock size={16} color={COLORS.textSubtle} />
            ) : (
              <Navigation size={18} color={COLORS.textDark} strokeWidth={2.2} />
            )}
            <View>
              <Text
                style={[
                  styles.accordionStep,
                  pasoCalleBloqueado && styles.textDisabled,
                ]}
              >
                PASO 2
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
                No hay calles registradas en esta zona.
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
                      setAcordeonAbierto(null);
                    }}
                  >
                    <View style={styles.optionContent}>
                      {activa && (
                        <Check
                          size={14}
                          color={COLORS.textWhite}
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
          onPress={() => toggleAcordeon("categoria", pasoCategoriaBloqueado)}
        >
          <View style={styles.accordionHeaderLeft}>
            {pasoCategoriaBloqueado ? (
              <Lock size={16} color={COLORS.textSubtle} />
            ) : (
              <AlertTriangle
                size={18}
                color={COLORS.textDark}
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
                PASO 3
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
                  style={[styles.optionItem, activa && styles.optionItemActive]}
                  onPress={() => {
                    setCategoriaSeleccionada(cat);
                    setAcordeonAbierto(null);
                  }}
                >
                  <View style={styles.optionContent}>
                    {activa && (
                      <Check
                        size={14}
                        color={COLORS.textWhite}
                        strokeWidth={2.5}
                      />
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
            size={15}
            color={pasoDetallesBloqueado ? COLORS.textSubtle : COLORS.textDark}
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
            style={[styles.label, pasoDetallesBloqueado && styles.textDisabled]}
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
                ? "Completa los pasos 1, 2 y 3 para escribir"
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
            style={[styles.label, pasoDetallesBloqueado && styles.textDisabled]}
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
                ? "Completa los pasos 1, 2 y 3 para escribir"
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
          <ActivityIndicator color={COLORS.textWhite} />
        ) : (
          <View style={styles.btnContent}>
            <Send size={15} color={COLORS.textWhite} strokeWidth={2.4} />
            <Text style={styles.btnSubmitText}>
              Enviar Reporte de Incidente
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
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
  accordionContainer: {
    borderWidth: 1.5,
    borderColor: COLORS.textDark,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
    overflow: "hidden",
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
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textDark,
    marginTop: 2,
  },
  accordionBody: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    padding: SPACING.xs,
    backgroundColor: "#FAFAFA",
  },
  optionItem: {
    paddingVertical: 10,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  optionItemActive: { backgroundColor: COLORS.textDark },
  optionContent: { flexDirection: "row", alignItems: "center", gap: 6 },
  optionText: { fontSize: 12, fontWeight: "600", color: COLORS.textDark },
  optionTextActive: { color: COLORS.textWhite, fontWeight: "800" },
  emptyNote: {
    padding: SPACING.sm,
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: "italic",
  },
  containerDisabled: { borderColor: "#CBD5E1", backgroundColor: "#F8FAFC" },
  headerDisabled: { backgroundColor: "#F1F5F9" },
  textDisabled: { color: "#94A3B8" },
  sectionDisabled: { opacity: 0.65 },
  inputDisabled: {
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
    color: "#94A3B8",
  },
  formSection: { marginTop: SPACING.sm },
  formSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: SPACING.sm,
  },
  formSectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  inputGroup: { marginBottom: SPACING.md },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.textDark,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textDark,
  },
  textarea: { height: 85 },
  btnSubmit: {
    backgroundColor: COLORS.textDark,
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  btnDisabled: { backgroundColor: "#94A3B8", opacity: 0.7 },
  btnContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnSubmitText: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
