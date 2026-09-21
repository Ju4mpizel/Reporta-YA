// src/screens/MapaScreen.js
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Linking,
  Animated,
  Platform,
} from "react-native";
import {
  MapPin,
  Navigation,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  List,
  Check,
  ChevronRight,
  ShieldCheck,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { incidentesService } from "../services/incidentesService";
import { COLORS, SPACING, RADIUS } from "../constants/theme";

export default function MapaScreen({ route, navigation }) {
  const [incidentes, setIncidentes] = useState([]);
  const [incidenteActivo, setIncidenteActivo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const incidenteIdParam = route?.params?.incidenteIdSeleccionado;

  useFocusEffect(
    useCallback(() => {
      cargarIncidentes();
    }, []),
  );

  useEffect(() => {
    const desuscribir = incidentesService.suscribirACambios(() => {
      cargarIncidentes();
    });

    return () => {
      if (desuscribir) desuscribir();
    };
  }, []);

  useEffect(() => {
    if (incidenteIdParam && incidentes.length > 0) {
      const objetivo = incidentes.find(
        (i) => Number(i.id) === Number(incidenteIdParam),
      );
      if (objetivo) {
        setIncidenteActivo(objetivo);
      }
    }
  }, [incidenteIdParam, incidentes]);

  async function cargarIncidentes() {
    try {
      setCargando(true);
      const datos = await incidentesService.obtenerParaFeed();
      const lista = Array.isArray(datos) ? datos : [];
      setIncidentes(lista);

      if (lista.length > 0) {
        setIncidenteActivo((prev) => {
          if (incidenteIdParam) {
            const desdeRuta = lista.find(
              (i) => Number(i.id) === Number(incidenteIdParam),
            );
            if (desdeRuta) return desdeRuta;
          }
          if (!prev) return lista[0];
          const existe = lista.find((item) => item.id === prev.id);
          return existe || lista[0];
        });
      }
    } catch (err) {
      console.error(
        "Error al cargar incidentes para Google Maps:",
        err.message,
      );
    } finally {
      setCargando(false);
    }
  }

  const obtenerUrlGoogleMapsEmbed = () => {
    if (!incidenteActivo) {
      return "https://maps.google.com/maps?q=Plaza+Cala+Cala,+Cochabamba&hl=es&z=16&output=embed";
    }

    const query = encodeURIComponent(
      `${incidenteActivo.calle_nombre}, Cala Cala, Cochabamba`,
    );
    return `https://maps.google.com/maps?q=${query}&hl=es&z=17&output=embed`;
  };

  const abrirEnGoogleMapsApp = () => {
    if (!incidenteActivo) return;

    if (incidenteActivo.maps_url) {
      Linking.openURL(incidenteActivo.maps_url);
      return;
    }

    const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${incidenteActivo.calle_nombre}, Cala Cala, Cochabamba`,
    )}`;
    Linking.openURL(fallbackUrl);
  };

  return (
    <View style={styles.container}>
      {/* Header Institucional Curvo Homologado */}
      <View style={styles.headerDark}>
        <View style={styles.headerTopLine}>
          <ShieldCheck size={13} color="#38BDF8" strokeWidth={2.4} />
          <Text style={styles.headerSub}>SUBALCALDÍA CALA CALA · D-12</Text>
        </View>
        <Text style={styles.headerTitle}>Mapa Territorial</Text>
      </View>

      {/* Visor */}
      <View style={styles.mapContainer}>
        {cargando ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>
              Conectando con Google Maps...
            </Text>
          </View>
        ) : (
          <iframe
            key={incidenteActivo?.id || "default-map"}
            src={obtenerUrlGoogleMapsEmbed()}
            style={styles.iframe}
            title="Google Maps Cala Cala"
            loading="lazy"
          />
        )}

        {/* Mini Acordeón Flotante Inferior */}
        {incidenteActivo && (
          <View style={styles.floatingAccordionContainer}>
            <TouchableOpacity
              style={styles.accordionHeader}
              activeOpacity={0.8}
              onPress={() => setMenuAbierto((prev) => !prev)}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.headerIndicatorRow}>
                  <Text style={styles.badgeNumero}>
                    REPORTE EN VISTA (
                    {incidentes.findIndex((i) => i.id === incidenteActivo.id) +
                      1}
                    /{incidentes.length})
                  </Text>
                  <Text style={styles.toggleHintText}>
                    {menuAbierto
                      ? "Toca para cerrar lista"
                      : "Toca para ver todos"}
                  </Text>
                </View>
                <Text style={styles.headerCalle} numberOfLines={1}>
                  {incidenteActivo.calle_nombre}
                </Text>
                <Text style={styles.headerTitulo} numberOfLines={1}>
                  {incidenteActivo.titulo}
                </Text>
              </View>

              <View style={styles.iconDropdownWrap}>
                {menuAbierto ? (
                  <ChevronDown
                    size={18}
                    color={COLORS.primary}
                    strokeWidth={2.5}
                  />
                ) : (
                  <ChevronUp
                    size={18}
                    color={COLORS.primary}
                    strokeWidth={2.5}
                  />
                )}
              </View>
            </TouchableOpacity>

            {menuAbierto && (
              <View style={styles.accordionBody}>
                <ScrollView
                  style={styles.scrollList}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  {incidentes.map((inc, idx) => {
                    const esSeleccionado = inc.id === incidenteActivo.id;
                    return (
                      <TouchableOpacity
                        key={inc.id}
                        style={[
                          styles.listItem,
                          esSeleccionado && styles.listItemActive,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => {
                          setIncidenteActivo(inc);
                          setMenuAbierto(false);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={styles.listItemTop}>
                            <Text
                              style={[
                                styles.listItemCalle,
                                esSeleccionado && styles.listItemCalleActive,
                              ]}
                              numberOfLines={1}
                            >
                              {idx + 1}. {inc.calle_nombre}
                            </Text>
                            {esSeleccionado && (
                              <View style={styles.chipActivo}>
                                <Check
                                  size={10}
                                  color="#FFFFFF"
                                  strokeWidth={2.5}
                                />
                                <Text style={styles.chipActivoText}>
                                  En Mapa
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text
                            style={[
                              styles.listItemTitulo,
                              esSeleccionado && styles.listItemTituloActive,
                            ]}
                            numberOfLines={1}
                          >
                            {inc.titulo}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Barra de Acciones */}
            <View style={styles.cardActionsRow}>
              <TouchableOpacity
                style={styles.btnAppMaps}
                activeOpacity={0.8}
                onPress={abrirEnGoogleMapsApp}
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
                <List size={13} color={COLORS.primaryDark} strokeWidth={2.2} />
                <Text style={styles.btnDetalleListaText}>Ver detalle</Text>
                <ChevronRight size={12} color={COLORS.primaryDark} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerDark: {
    backgroundColor: "#0F172A",
    paddingHorizontal: SPACING.lg,
    paddingTop: 52,
    paddingBottom: SPACING.md,
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
  mapContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#E2E8F0",
  },
  iframe: {
    width: "100%",
    height: "100%",
    border: "none",
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  floatingAccordionContainer: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 8,
    shadowColor: "#0F172A",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 7,
  },
  headerIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
    paddingRight: 6,
  },
  badgeNumero: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  toggleHintText: {
    fontSize: 9,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  headerCalle: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textDark,
    textTransform: "uppercase",
  },
  headerTitulo: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textDark,
    marginTop: 1,
  },
  iconDropdownWrap: {
    backgroundColor: "#F1F5F9",
    padding: 6,
    borderRadius: RADIUS.sm,
    marginLeft: 8,
  },
  accordionBody: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: "#F8FAFC",
  },
  scrollList: {
    maxHeight: 160,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  listItem: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    marginBottom: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  listItemActive: {
    backgroundColor: "#EFF6FF",
    borderColor: COLORS.primary,
  },
  listItemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listItemCalle: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    flex: 1,
  },
  listItemCalleActive: {
    color: COLORS.primary,
  },
  listItemTitulo: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textDark,
    marginTop: 1,
  },
  listItemTituloActive: {
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  chipActivo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  chipActivoText: {
    fontSize: 8,
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
    borderRadius: RADIUS.sm,
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
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  btnDetalleListaText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
});
