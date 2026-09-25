// src/screens/NuevoIncidenteScreen.js
import React, { useEffect, useState, useRef, useCallback } from "react";
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
  MapPin,
  Navigation,
  AlertTriangle,
  FileText,
  Send,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import NetInfo from "@react-native-community/netinfo";
import { catalogoService } from "../services/catalogoService";
import { CrearIncidenteCommand } from "../services/commands/CrearIncidenteCommand";
import { commandQueueService } from "../services/CommandQueueService";
import HeaderInstitucional from "../components/layout/HeaderInstitucional";
import CustomModalAlert from "../components/feedback/CustomModalAlert";
import PasoAcordeon from "../components/formulario/PasoAcordeon";
import AdjuntarFotoSection from "../components/formulario/AdjuntarFotoSection";
import { useAuth } from "../context/AuthContext";
import { styles } from "../styles/nuevoIncidente.styles";
import { COLORS } from "../constants/theme";

export default function NuevoIncidenteScreen({ navigation }) {
  const { perfil } = useAuth();

  const [zonas, setZonas] = useState([]);
  const [calles, setCalles] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoZonas, setCargandoZonas] = useState(false);
  const [cargandoCalles, setCargandoCalles] = useState(false);

  const [acordeonAbierto, setAcordeonAbierto] = useState("zona");

  const [zonaSeleccionada, setZonaSeleccionada] = useState(null);
  const [calleSeleccionada, setCalleSeleccionada] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenUri, setImagenUri] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const [modalFotoVisible, setModalFotoVisible] = useState(false);
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
      setCargandoZonas(true);
      const [listaZonas, listaCats] = await Promise.all([
        catalogoService.obtenerZonas(),
        catalogoService.obtenerCategorias(),
      ]);
      if (listaZonas?.length > 0) setZonas(listaZonas);
      if (listaCats?.length > 0) setCategorias(listaCats);
    } catch (err) {
      console.warn("Aviso catálogo:", err.message);
    } finally {
      setCargando(false);
      setCargandoZonas(false);
    }
  }

  const cargarCallesDeZona = useCallback(async (zonaId) => {
    if (!zonaId) return;
    try {
      setCargandoCalles(true);
      const lista = await catalogoService.obtenerCallesPorZona(zonaId);
      setCalles(lista || []);
    } catch (err) {
      console.warn("Aviso calles:", err.message);
      setCalles([]);
    } finally {
      setCargandoCalles(false);
    }
  }, []);

  const capturarDesdeCamara = async () => {
    setModalFotoVisible(false);
    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) {
        setAlerta({
          visible: true,
          tipo: "error",
          titulo: "Permiso Denegado",
          mensaje: "Se requiere autorización para abrir la cámara.",
        });
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
        base64: true,
      });
      if (!res.canceled && res.assets?.[0]) {
        const asset = res.assets[0];
        setImagenUri(
          asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri,
        );
      }
    } catch (error) {
      console.warn("Aviso cámara:", error.message);
    }
  };

  const seleccionarDeGaleria = async () => {
    setModalFotoVisible(false);
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        setAlerta({
          visible: true,
          tipo: "error",
          titulo: "Permiso Denegado",
          mensaje: "Se requiere autorización para acceder a la galería.",
        });
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
        base64: true,
      });
      if (!res.canceled && res.assets?.[0]) {
        const asset = res.assets[0];
        setImagenUri(
          asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri,
        );
      }
    } catch (error) {
      console.warn("Aviso galería:", error.message);
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
        mensaje: "Por favor selecciona zona, calle y categoría.",
      });
      return;
    }
    if (!titulo.trim() || !descripcion.trim()) {
      setAlerta({
        visible: true,
        tipo: "error",
        titulo: "Detalles Requeridos",
        mensaje: "Debes ingresar título y descripción.",
      });
      return;
    }

    const comando = new CrearIncidenteCommand({
      usuarioId: perfil?.id,
      calleId: calleSeleccionada.id,
      categoriaId: categoriaSeleccionada.id,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      mapsUrl: calleSeleccionada.google_maps_url || null,
      fotoLocalUri: imagenUri || null,
    });

    try {
      setEnviando(true);
      let tieneInternet =
        Platform.OS === "web"
          ? typeof navigator !== "undefined" && navigator.onLine
          : (await NetInfo.fetch()).isConnected;

      if (tieneInternet) {
        await comando.execute();
        limpiarFormulario();
        setAlerta({
          visible: true,
          tipo: "exito",
          titulo: "¡Reporte Registrado!",
          mensaje: "Tu reporte fue transmitido exitosamente.",
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
            "Sin conexión. Se enviará automáticamente cuando recuperes red.",
          onConfirmar: () => navigation.navigate("Incidentes"),
        });
      }
    } catch (err) {
      setAlerta({
        visible: true,
        tipo: "error",
        titulo: "Error al enviar",
        mensaje: err.message || "No se pudo procesar el reporte.",
      });
    } finally {
      setEnviando(false);
    }
  }

  const pasoCalleBloqueado = !zonaSeleccionada;
  const pasoCatBloqueado = !calleSeleccionada;
  const pasoDetallesBloqueado = !categoriaSeleccionada;

  if (cargando) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando formulario...</Text>
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
          {/* PASO 1: ZONA */}
          <PasoAcordeon
            pasoNumero="1"
            pasoEtiqueta="JURISDICCIÓN"
            titulo={
              zonaSeleccionada
                ? `Zona: ${zonaSeleccionada.nombre}`
                : "Seleccionar Zona"
            }
            icono={MapPin}
            abierto={acordeonAbierto === "zona"}
            bloqueado={false}
            cargando={cargandoZonas}
            items={zonas}
            itemSeleccionado={zonaSeleccionada}
            onToggle={() =>
              setAcordeonAbierto((prev) => (prev === "zona" ? null : "zona"))
            }
            onSeleccionarItem={(z) => {
              setZonaSeleccionada(z);
              setAcordeonAbierto("calle");
            }}
            onReintentar={cargarDatosIniciales}
            textoCargando="Cargando zonas..."
            textoVacio="No se encontraron zonas."
            getLabel={(z) => `${z.nombre} (Distrito ${z.distrito})`}
          />

          {/* PASO 2: CALLE */}
          <PasoAcordeon
            pasoNumero="2"
            pasoEtiqueta="CALLE O AVENIDA"
            titulo={
              pasoCalleBloqueado
                ? "Selecciona primero una zona"
                : calleSeleccionada
                  ? `Calle: ${calleSeleccionada.nombre}`
                  : "Seleccionar Calle"
            }
            icono={Navigation}
            abierto={acordeonAbierto === "calle"}
            bloqueado={pasoCalleBloqueado}
            cargando={cargandoCalles}
            items={calles}
            itemSeleccionado={calleSeleccionada}
            onToggle={() =>
              setAcordeonAbierto((prev) => (prev === "calle" ? null : "calle"))
            }
            onSeleccionarItem={(c) => {
              setCalleSeleccionada(c);
              setAcordeonAbierto("categoria");
            }}
            onReintentar={() => cargarCallesDeZona(zonaSeleccionada?.id)}
            textoCargando={`Cargando vías de ${zonaSeleccionada?.nombre}...`}
            textoVacio="No hay vías registradas para esta zona."
          />

          {/* PASO 3: CATEGORÍA */}
          <PasoAcordeon
            pasoNumero="3"
            pasoEtiqueta="CATEGORÍA DEL DAÑO"
            titulo={
              pasoCatBloqueado
                ? "Selecciona primero una calle"
                : categoriaSeleccionada
                  ? `Categoría: ${categoriaSeleccionada.nombre}`
                  : "Seleccionar Categoría"
            }
            icono={AlertTriangle}
            abierto={acordeonAbierto === "categoria"}
            bloqueado={pasoCatBloqueado}
            items={categorias}
            itemSeleccionado={categoriaSeleccionada}
            onToggle={() =>
              setAcordeonAbierto((prev) =>
                prev === "categoria" ? null : "categoria",
              )
            }
            onSeleccionarItem={(cat) => {
              setCategoriaSeleccionada(cat);
              setAcordeonAbierto(null);
            }}
            onReintentar={cargarDatosIniciales}
            textoVacio="No se encontraron categorías."
          />

          {/* PASO 4: DETALLES */}
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
                    : "Indica referencias exactas o daño observado..."
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

            <AdjuntarFotoSection
              imagenUri={imagenUri}
              onAbrirModal={() => setModalFotoVisible(true)}
              onRemoverFoto={() => setImagenUri(null)}
              deshabilitado={pasoDetallesBloqueado}
            />
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
                    ? "Subiendo imagen a la nube..."
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

      <CustomModalAlert
        visible={modalFotoVisible}
        tipo="confirmar"
        titulo="Adjuntar Fotografía"
        mensaje="Selecciona si deseas tomar una foto en el momento o subirla desde tu galería."
        textoBotonConfirmar="Tomar Foto (Cámara)"
        textoBotonCancelar="Elegir de Galería"
        onConfirmar={capturarDesdeCamara}
        onCancelar={seleccionarDeGaleria}
      />

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
