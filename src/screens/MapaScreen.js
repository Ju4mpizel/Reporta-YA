// src/screens/MapaScreen.js
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import {
  Navigation,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  PlusCircle,
  Check,
  List,
  ChevronRight,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import VisorMapaNativo from "../components/mapa/VisorMapaNativo";
import ModalNuevaCalle from "../components/mapa/ModalNuevaCalle";
import HeaderInstitucional from "../components/layout/HeaderInstitucional";
import CustomModalAlert from "../components/feedback/CustomModalAlert";
import OfflineEmptyState from "../components/feedback/OfflineEmptyState";
import { useAuth } from "../context/AuthContext";
import { incidentesService } from "../services/incidentesService";
import { callesService } from "../services/callesService";
import { generarHtmlLeaflet } from "../utils/leafletTemplate";
import { styles } from "../styles/mapaScreen.styles";
import { COLORS } from "../constants/theme";

const LAT_DEFAULT = -17.3684722;
const LNG_DEFAULT = -66.1638889;

export default function MapaScreen({ route, navigation }) {
  const { perfil } = useAuth();
  const webViewRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.title = "Mapa Territorial | Reporta YA!";
    }
  }, []);

  const rolUser = String(
    perfil?.roles?.nombre ||
      perfil?.rol_nombre ||
      perfil?.rol ||
      perfil?.rol_id ||
      perfil?.roles?.id ||
      "",
  )
    .toLowerCase()
    .trim();

  const esAdmin = Boolean(
    rolUser.includes("admin") ||
    rolUser.includes("funcionario") ||
    perfil?.es_admin === true,
  );

  const [incidentes, setIncidentes] = useState([]);
  const [incidenteActivo, setIncidenteActivo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [errorConexion, setErrorConexion] = useState(false);

  const [zonas, setZonas] = useState([]);
  const [zonaSeleccionada, setZonaSeleccionada] = useState(null);
  const [coordenadaMarcada, setCoordenadaMarcada] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [nombreNuevaCalle, setNombreNuevaCalle] = useState("");
  const [tipoNuevaCalle, setTipoNuevaCalle] = useState("avenida");
  const [guardandoCalle, setGuardandoCalle] = useState(false);

  const [alerta, setAlerta] = useState({
    visible: false,
    tipo: "exito",
    titulo: "",
    mensaje: "",
  });

  const incidenteIdParam = route?.params?.incidenteIdSeleccionado;

  useFocusEffect(
    useCallback(() => {
      cargarIncidentes();
      cargarZonas();
    }, []),
  );

  async function cargarZonas() {
    try {
      const lista = await callesService.obtenerZonas();
      setZonas(lista);
      if (lista.length > 0 && !zonaSeleccionada) {
        setZonaSeleccionada(lista[0].id);
      }
    } catch (e) {
      console.error("Error al cargar zonas:", e);
    }
  }

  const procesarEventoMapa = useCallback(
    (datos) => {
      if (!datos) return;
      if (datos.tipo === "PUNTO_SELECCIONADO" && esAdmin) {
        setCoordenadaMarcada({
          lat: Number(Number(datos.lat).toFixed(7)),
          lng: Number(Number(datos.lng).toFixed(7)),
        });
      } else if (datos.tipo === "INCIDENTE_CLICKEADO") {
        const encontrado = incidentes.find(
          (i) => Number(i.id) === Number(datos.id),
        );
        if (encontrado) setIncidenteActivo(encontrado);
      }
    },
    [esAdmin, incidentes],
  );

  useEffect(() => {
    if (
      Platform.OS !== "web" ||
      typeof window === "undefined" ||
      !window.addEventListener
    ) {
      return;
    }

    const handleMensajeIframe = (event) => {
      try {
        const datos =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        procesarEventoMapa(datos);
      } catch (e) {}
    };

    window.addEventListener("message", handleMensajeIframe);
    return () => {
      window.removeEventListener("message", handleMensajeIframe);
    };
  }, [procesarEventoMapa]);

  const handleMensajeWebView = (event) => {
    try {
      const datos = JSON.parse(event.nativeEvent.data);
      procesarEventoMapa(datos);
    } catch (e) {}
  };

  useEffect(() => {
    const desuscribir = incidentesService.suscribirACambios(() => {
      cargarIncidentes();
    });
    return () => {
      if (desuscribir) desuscribir();
    };
  }, []);

  async function cargarIncidentes() {
    try {
      setCargando(true);
      setErrorConexion(false);
      const datos = await incidentesService.obtenerParaFeed();
      const lista = Array.isArray(datos) ? datos : [];
      setIncidentes(lista);

      if (lista.length > 0) {
        const primero = lista[0];
        setIncidenteActivo((prev) => {
          if (incidenteIdParam) {
            const desdeRuta = lista.find(
              (i) => Number(i.id) === Number(incidenteIdParam),
            );
            if (desdeRuta) return desdeRuta;
          }
          return prev || primero;
        });

        if (primero.lat && primero.lng && esAdmin && !coordenadaMarcada) {
          setCoordenadaMarcada({ lat: primero.lat, lng: primero.lng });
        }
      } else {
        setIncidenteActivo(null);
      }
    } catch (err) {
      console.error("Error al cargar incidentes:", err.message);
      const esErrorDeRed =
        err.message?.toLowerCase().includes("failed to fetch") ||
        err.message?.toLowerCase().includes("network");

      if (esErrorDeRed) setErrorConexion(true);
    } finally {
      setCargando(false);
    }
  }

  const enfocarIncidente = (inc) => {
    setIncidenteActivo(inc);
    setMenuAbierto(false);

    const payload = JSON.stringify({
      tipo: "VOLAR_A_INCIDENTE",
      id: inc.id,
      lat: inc.lat,
      lng: inc.lng,
    });

    if (Platform.OS === "web" && typeof document !== "undefined") {
      const iframe = document.getElementById("visor-leaflet-mapa");
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(payload, "*");
      }
    } else if (webViewRef.current) {
      const jsCode = `
        if (window.volarAIncidente) {
          window.volarAIncidente(${inc.id}, ${inc.lat}, ${inc.lng});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(jsCode);
    }
  };

  const abrirEnGoogleMaps = (inc) => {
    if (inc?.maps_url) {
      Linking.openURL(inc.maps_url);
      return;
    }
    const lat = inc?.lat || LAT_DEFAULT;
    const lng = inc?.lng || LNG_DEFAULT;
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    );
  };

  const handleGuardarCalle = async () => {
    const netState = await NetInfo.fetch();
    const conexionActiva = Boolean(
      netState.isConnected && netState.isInternetReachable !== false,
    );

    if (!conexionActiva) {
      setAlerta({
        visible: true,
        tipo: "error",
        titulo: "Operación no disponible",
        mensaje:
          "No tienes conexión a internet. No se pueden registrar nuevas vías en el catastro territorial en modo fuera de línea.",
      });
      return;
    }

    if (!nombreNuevaCalle.trim()) {
      setAlerta({
        visible: true,
        tipo: "error",
        titulo: "Nombre Requerido",
        mensaje: "Por favor ingresa el nombre de la vía o intersección.",
      });
      return;
    }
    if (!coordenadaMarcada) {
      setAlerta({
        visible: true,
        tipo: "error",
        titulo: "Punto no marcado",
        mensaje: "Toca el mapa para ubicar la vía antes de guardar.",
      });
      return;
    }

    try {
      setGuardandoCalle(true);
      await callesService.crearCalle({
        nombre: nombreNuevaCalle.trim(),
        tipo: tipoNuevaCalle,
        zonaId: zonaSeleccionada,
        latitud: coordenadaMarcada.lat,
        longitud: coordenadaMarcada.lng,
      });

      setModalVisible(false);
      setNombreNuevaCalle("");
      cargarIncidentes();

      setAlerta({
        visible: true,
        tipo: "exito",
        titulo: "Vía Registrada",
        mensaje: `La vía "${nombreNuevaCalle}" se guardó correctamente en el catastro municipal.`,
      });
    } catch (err) {
      setAlerta({
        visible: true,
        tipo: "error",
        titulo: "Error al guardar",
        mensaje:
          err.message || "No se pudo registrar la calle en la base de datos.",
      });
    } finally {
      setGuardandoCalle(false);
    }
  };

  const htmlLeaflet = generarHtmlLeaflet({
    latInicial:
      Number(coordenadaMarcada?.lat) ||
      Number(incidenteActivo?.lat) ||
      LAT_DEFAULT,
    lngInicial:
      Number(coordenadaMarcada?.lng) ||
      Number(incidenteActivo?.lng) ||
      LNG_DEFAULT,
    incidentes,
    esAdmin,
  });

  return (
    <View style={styles.container}>
      <HeaderInstitucional
        titulo={esAdmin ? "Gestor Territorial (Admin)" : "Mapa Territorial"}
      />

      <View style={styles.mapContainer}>
        {cargando ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Conectando con mapa...</Text>
          </View>
        ) : errorConexion ? (
          <OfflineEmptyState
            titulo="Mapa no disponible sin conexión"
            mensaje="El visor territorial requiere conexión a internet para descargar la cartografía."
            onReintentar={cargarIncidentes}
          />
        ) : Platform.OS === "web" ? (
          <iframe
            id="visor-leaflet-mapa"
            key={`mapa-${esAdmin ? "admin" : "ciudadano"}`}
            srcDoc={htmlLeaflet}
            style={styles.iframe}
            title="Mapa Territorial Cochabamba D12"
          />
        ) : (
          <VisorMapaNativo
            webViewRef={webViewRef}
            htmlSource={htmlLeaflet}
            onMessage={handleMensajeWebView}
          />
        )}

        {esAdmin && coordenadaMarcada && !errorConexion && (
          <View style={styles.floatingCoordBox}>
            <View style={styles.coordRow}>
              <MapPin size={18} color={COLORS.primary} strokeWidth={2.5} />
              <View style={{ flex: 1 }}>
                <Text style={styles.coordLabel}>
                  Punto Marcado (Toca el mapa para mover):
                </Text>
                <Text style={styles.coordValue}>
                  {coordenadaMarcada.lat}, {coordenadaMarcada.lng}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.btnCrearCalle}
                activeOpacity={0.8}
                onPress={() => setModalVisible(true)}
              >
                <PlusCircle size={14} color="#FFFFFF" />
                <Text style={styles.btnCrearCalleText}>+ Añadir Calle</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {incidenteActivo && !errorConexion && (
          <View style={styles.floatingAccordionContainer}>
            <TouchableOpacity
              style={styles.accordionHeader}
              activeOpacity={0.8}
              onPress={() => setMenuAbierto((prev) => !prev)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.headerCalle} numberOfLines={1}>
                  {incidenteActivo.calle_nombre || "UBICACIÓN REGISTRADA"}
                </Text>
                <Text style={styles.headerTitulo} numberOfLines={1}>
                  {incidenteActivo.titulo || "Incidente Urbano"}
                </Text>
              </View>
              {menuAbierto ? (
                <ChevronDown size={18} color={COLORS.primary} />
              ) : (
                <ChevronUp size={18} color={COLORS.primary} />
              )}
            </TouchableOpacity>

            {menuAbierto && (
              <View style={styles.accordionBody}>
                <ScrollView style={{ maxHeight: 150, padding: 8 }}>
                  {incidentes.map((inc, idx) => {
                    const esSeleccionado = inc.id === incidenteActivo.id;
                    return (
                      <TouchableOpacity
                        key={inc.id}
                        style={[
                          styles.listItem,
                          esSeleccionado && styles.listItemActive,
                        ]}
                        onPress={() => enfocarIncidente(inc)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.listItemCalle}>
                            {idx + 1}. {inc.calle_nombre || "Vía"}
                          </Text>
                          <Text style={styles.listItemTitulo} numberOfLines={1}>
                            {inc.titulo || "Reporte"}
                          </Text>
                        </View>
                        {esSeleccionado && (
                          <View style={styles.chipActivo}>
                            <Check
                              size={10}
                              color="#FFFFFF"
                              strokeWidth={2.5}
                            />
                            <Text style={styles.chipActivoText}>En Foco</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View style={styles.cardActionsRow}>
              <TouchableOpacity
                style={styles.btnAppMaps}
                activeOpacity={0.8}
                onPress={() => abrirEnGoogleMaps(incidenteActivo)}
              >
                <Navigation size={12} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.btnAppMapsText}>Abrir en Google Maps</Text>
                <ExternalLink size={11} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnDetalleLista}
                activeOpacity={0.75}
                onPress={() =>
                  navigation.navigate("Incidentes", {
                    incidenteIdSeleccionado: incidenteActivo.id,
                  })
                }
              >
                <List
                  size={13}
                  color={COLORS.primaryDark || "#1E40AF"}
                  strokeWidth={2.2}
                />
                <Text style={styles.btnDetalleListaText}>Ver detalle</Text>
                <ChevronRight
                  size={12}
                  color={COLORS.primaryDark || "#1E40AF"}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {esAdmin && (
        <ModalNuevaCalle
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          coordenadaMarcada={coordenadaMarcada}
          zonas={zonas}
          zonaSeleccionada={zonaSeleccionada}
          onSelectZona={setZonaSeleccionada}
          nombreNuevaCalle={nombreNuevaCalle}
          onChangeNombre={setNombreNuevaCalle}
          tipoNuevaCalle={tipoNuevaCalle}
          onSelectTipo={setTipoNuevaCalle}
          onGuardar={handleGuardarCalle}
          guardando={guardandoCalle}
        />
      )}

      <CustomModalAlert
        visible={alerta.visible}
        tipo={alerta.tipo}
        titulo={alerta.titulo}
        mensaje={alerta.mensaje}
        onConfirmar={() => setAlerta((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}
