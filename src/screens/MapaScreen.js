// src/screens/MapaScreen.js
import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
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
  X,
  Check,
  List,
  ChevronRight,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import { WebView } from "react-native-webview";
import { useAuth } from "../context/AuthContext";
import { incidentesService } from "../services/incidentesService";
import { callesService } from "../services/callesService";
import HeaderInstitucional from "../components/HeaderInstitucional";
import CustomModalAlert from "../components/CustomModalAlert";
import OfflineEmptyState from "../components/OfflineEmptyState";
import { COLORS, RADIUS } from "../constants/theme";

const LAT_DEFAULT = -17.3684722;
const LNG_DEFAULT = -66.1638889;

export default function MapaScreen({ route, navigation }) {
  const { perfil } = useAuth();

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

  // Listener exclusivo para entorno Web
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
        if (datos?.tipo === "PUNTO_SELECCIONADO" && esAdmin) {
          setCoordenadaMarcada({
            lat: Number(datos.lat.toFixed(7)),
            lng: Number(datos.lng.toFixed(7)),
          });
        } else if (datos?.tipo === "INCIDENTE_CLICKEADO") {
          const encontrado = incidentes.find(
            (i) => Number(i.id) === Number(datos.id),
          );
          if (encontrado) setIncidenteActivo(encontrado);
        }
      } catch (e) {}
    };

    window.addEventListener("message", handleMensajeIframe);
    return () => {
      window.removeEventListener("message", handleMensajeIframe);
    };
  }, [esAdmin, incidentes]);

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

        if (primero.lat && primero.lng && esAdmin) {
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

      if (esErrorDeRed) {
        setErrorConexion(true);
      }
    } finally {
      setCargando(false);
    }
  }

  const enfocarIncidente = (inc) => {
    setIncidenteActivo(inc);
    setMenuAbierto(false);

    if (Platform.OS === "web" && typeof document !== "undefined") {
      const iframe = document.getElementById("visor-leaflet-mapa");
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            tipo: "VOLAR_A_INCIDENTE",
            id: inc.id,
            lat: inc.lat,
            lng: inc.lng,
          }),
          "*",
        );
      }
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
        mensaje: "Ubica la vía antes de guardar.",
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

  const generarHtmlLeaflet = () => {
    const latInicial =
      Number(incidenteActivo?.lat) ||
      Number(coordenadaMarcada?.lat) ||
      LAT_DEFAULT;
    const lngInicial =
      Number(incidenteActivo?.lng) ||
      Number(coordenadaMarcada?.lng) ||
      LNG_DEFAULT;

    const jsonIncidentes = JSON.stringify(
      incidentes
        .filter((i) => i.lat && i.lng)
        .map((i) => ({
          id: i.id,
          lat: i.lat,
          lng: i.lng,
          titulo: i.titulo || "Incidente",
          calle: i.calle_nombre || "Vía",
          estado: i.estado || "en_revision",
        })),
    );

    return `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Mapa Territorial</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #f8fafc; }
            .pop-calle { font-size: 10px; font-weight: 800; color: #DC2626; text-transform: uppercase; margin-bottom: 2px; font-family: system-ui, sans-serif; }
            .pop-tit { font-size: 12px; font-weight: 700; color: #0F172A; font-family: system-ui, sans-serif; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            var esAdmin = ${esAdmin ? "true" : "false"};
            var incidentes = ${jsonIncidentes};

            var map = L.map('map', { zoomControl: false }).setView([${latInicial}, ${lngInicial}], 16);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

            incidentes.forEach(function(inc) {
              var m = L.marker([inc.lat, inc.lng]).addTo(map);
              m.bindPopup('<div class="pop-calle">🔴 ' + (inc.calle || '') + '</div><div class="pop-tit">' + (inc.titulo || '') + '</div>');
            });
          </script>
        </body>
      </html>
    `;
  };

  const tituloEncabezado = esAdmin
    ? "Gestor Territorial (Admin)"
    : "Mapa Territorial";

  return (
    <View style={styles.container}>
      <HeaderInstitucional titulo={tituloEncabezado} />

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
            srcDoc={generarHtmlLeaflet()}
            style={styles.iframe}
            title="Mapa Territorial Cochabamba D12"
          />
        ) : (
          <WebView
            originWhitelist={["*"]}
            source={{ html: generarHtmlLeaflet() }}
            style={styles.iframe}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            )}
          />
        )}

        {esAdmin && coordenadaMarcada && !errorConexion && (
          <View style={styles.floatingCoordBox}>
            <View style={styles.coordRow}>
              <MapPin size={18} color={COLORS.primary} strokeWidth={2.5} />
              <View style={{ flex: 1 }}>
                <Text style={styles.coordLabel}>Punto Seleccionado:</Text>
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
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Registrar Nueva Calle</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Coordenadas marcadas:</Text>
              <View style={styles.modalCoordBox}>
                <Text style={styles.modalCoordText}>
                  {coordenadaMarcada?.lat}, {coordenadaMarcada?.lng}
                </Text>
              </View>

              <Text style={styles.modalLabel}>Zona Municipal:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 4 }}
              >
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {zonas.map((z) => (
                    <TouchableOpacity
                      key={z.id}
                      style={[
                        styles.chipZona,
                        zonaSeleccionada === z.id && styles.chipZonaActiva,
                      ]}
                      onPress={() => setZonaSeleccionada(z.id)}
                    >
                      <Text
                        style={[
                          styles.chipZonaText,
                          zonaSeleccionada === z.id &&
                            styles.chipZonaTextActiva,
                        ]}
                      >
                        {z.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.modalLabel}>Nombre oficial de la vía:</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Av. América (esq. Adela Zamudio)"
                value={nombreNuevaCalle}
                onChangeText={setNombreNuevaCalle}
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.modalLabel}>Tipo de vía:</Text>
              <View style={styles.tipoRow}>
                {["avenida", "calle", "pasaje", "plaza"].map((tipo) => (
                  <TouchableOpacity
                    key={tipo}
                    style={[
                      styles.tipoBtn,
                      tipoNuevaCalle === tipo && styles.tipoBtnActive,
                    ]}
                    onPress={() => setTipoNuevaCalle(tipo)}
                  >
                    <Text
                      style={[
                        styles.tipoBtnText,
                        tipoNuevaCalle === tipo && styles.tipoBtnTextActive,
                      ]}
                    >
                      {tipo.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.btnGuardarFinal}
                activeOpacity={0.8}
                onPress={handleGuardarCalle}
                disabled={guardandoCalle}
              >
                {guardandoCalle ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.btnGuardarFinalText}>
                    Guardar Vía en Base de Datos
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || "#F8FAFC",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#F8FAFC",
  },
  iframe: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F8FAFC",
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: { marginTop: 8, fontSize: 12, color: COLORS.textMuted },

  floatingCoordBox: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    padding: 10,
    elevation: 6,
    zIndex: 10,
  },
  coordRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  coordLabel: { fontSize: 10, fontWeight: "700", color: COLORS.textMuted },
  coordValue: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textDark,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  btnCrearCalle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#16A34A",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  btnCrearCalleText: { fontSize: 11, fontWeight: "800", color: "#FFFFFF" },

  floatingAccordionContainer: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 8,
    overflow: "hidden",
    zIndex: 10,
  },
  accordionHeader: { flexDirection: "row", alignItems: "center", padding: 12 },
  headerCalle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textDark,
    textTransform: "uppercase",
  },
  headerTitulo: { fontSize: 13, fontWeight: "700", color: COLORS.textDark },
  accordionBody: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: "#F8FAFC",
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderRadius: RADIUS.sm,
    marginBottom: 4,
    backgroundColor: "#FFFFFF",
  },
  listItemActive: { backgroundColor: "#EFF6FF" },
  listItemCalle: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
    textTransform: "uppercase",
  },
  listItemTitulo: { fontSize: 12, fontWeight: "600", color: COLORS.textDark },
  chipActivo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chipActivoText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#FFFFFF",
    gap: 8,
  },
  btnAppMaps: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#0F172A",
    paddingVertical: 7,
    borderRadius: RADIUS.sm || 6,
  },
  btnAppMapsText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  btnDetalleLista: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: COLORS.primaryLight || "#DBEAFE",
    paddingVertical: 7,
    borderRadius: RADIUS.sm || 6,
  },
  btnDetalleListaText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primaryDark || "#1E40AF",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    maxWidth: 440,
    borderRadius: RADIUS.md,
    padding: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textDark },
  modalLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginTop: 10,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  modalCoordBox: {
    backgroundColor: "#F1F5F9",
    padding: 8,
    borderRadius: RADIUS.sm,
  },
  modalCoordText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: "700",
  },
  chipZona: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm || 6,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  chipZonaActiva: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipZonaText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
  },
  chipZonaTextActiva: {
    color: "#FFFFFF",
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.textDark,
    backgroundColor: "#FFFFFF",
  },
  tipoRow: { flexDirection: "row", gap: 6, marginVertical: 6 },
  tipoBtn: {
    flex: 1,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  tipoBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tipoBtnText: { fontSize: 10, fontWeight: "800", color: COLORS.textMuted },
  tipoBtnTextActive: { color: "#FFFFFF" },
  btnGuardarFinal: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    marginTop: 16,
  },
  btnGuardarFinalText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
});
