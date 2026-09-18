// src/screens/MapaScreen.js
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Platform,
} from "react-native";
import { MapPin, Info } from "lucide-react-native";
import { supabase } from "../services/supabase";
import { COLORS, SPACING, RADIUS } from "../constants/theme";

// Coordenadas centro: Cala Cala (Distrito 12, Cochabamba)
const CALA_CALA_LAT = -17.3734;
const CALA_CALA_LNG = -66.1625;

export default function MapaScreen({ navigation }) {
  const [incidentes, setIncidentes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarIncidentes();

    // Listener para eventos emitidos desde el iframe interactivo en entorno Web
    const handleMessage = (event) => {
      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data && data.tipo === "SELECCIONAR_INCIDENTE") {
          navigation.navigate("Incidentes", {
            incidenteIdSeleccionado: data.id,
          });
        }
      } catch (err) {
        // Ignorar mensajes no relacionados
      }
    };

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    }
  }, []);

  async function cargarIncidentes() {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from("incidentes")
        .select(
          `
          id,
          titulo,
          descripcion,
          estado,
          calles ( id, nombre, latitud, longitud ),
          categorias_incidente ( nombre )
        `,
        )
        .eq("activo", true);

      if (error) throw error;

      const formateados = (data || []).map((item) => ({
        id: item.id,
        titulo: item.titulo,
        calle: item.calles?.nombre || "Vía de Cala Cala",
        lat: item.calles?.latitud || CALA_CALA_LAT,
        lng: item.calles?.longitud || CALA_CALA_LNG,
        categoria: item.categorias_incidente?.nombre || "Incidente",
      }));

      setIncidentes(formateados);
    } catch (err) {
      console.error("Error al cargar incidentes para el mapa:", err.message);
    } finally {
      setCargando(false);
    }
  }

  // Generación de HTML interactivo con Leaflet y OpenStreetMap (Cochabamba)
  const generarMapaHTML = () => {
    const marcadoresJS = incidentes
      .map(
        (inc) => `
        L.marker([${inc.lat}, ${inc.lng}])
          .addTo(map)
          .bindPopup('<b>${inc.calle}</b><br/>${inc.titulo}<br/><br/><button style="background:#0284C7;color:#fff;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-weight:bold;width:100%;" onclick="window.parent.postMessage({tipo:\\'SELECCIONAR_INCIDENTE\\', id:\\'${inc.id}\\'}, \\'*\\')">Ver en Lista</button>');
      `,
      )
      .join("\n");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #E2E8F0; }
            .leaflet-control-attribution { font-size: 9px; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            var map = L.map('map', {
              center: [${CALA_CALA_LAT}, ${CALA_CALA_LNG}],
              zoom: 15,
              minZoom: 13,
              maxZoom: 18
            });

            // Baldosas reales de OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap Cochabamba'
            }).addTo(map);

            // Marcadores dinámicos desde Supabase
            ${marcadoresJS}
          </script>
        </body>
      </html>
    `;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <MapPin size={12} color={COLORS.primary} strokeWidth={2.4} />
          <Text style={styles.headerSub}>CALA CALA · DISTRITO 12</Text>
        </View>
        <Text style={styles.headerTitle}>Mapa Interactivo</Text>
        <Text style={styles.headerHint}>
          Desliza, haz zoom y toca un marcador para inspeccionar el incidente
        </Text>
      </View>

      {/* Visor de Mapa Interactivo */}
      <View style={styles.mapContainer}>
        {cargando ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>
              Cargando cartografía urbana...
            </Text>
          </View>
        ) : (
          <iframe
            srcDoc={generarMapaHTML()}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
            title="Mapa de Cala Cala"
          />
        )}

        {/* Notificación flotante informativa */}
        <View style={styles.footerBadge}>
          <Info size={13} color={COLORS.textDark} />
          <Text style={styles.footerText}>
            {incidentes.length} puntos georreferenciados
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingTop: 50,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: COLORS.textDark },
  headerHint: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  mapContainer: { flex: 1, position: "relative" },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, fontSize: 12, color: COLORS.textMuted },

  footerBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 999,
  },
  footerText: { fontSize: 11, fontWeight: "700", color: COLORS.textDark },
});
