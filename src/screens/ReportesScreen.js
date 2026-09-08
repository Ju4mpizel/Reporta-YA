// src/screens/ReportesScreen.js
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { REPORTES_EJEMPLO, ZONA_ACTUAL } from "../data/mockData";
import { supabase } from "../services/supabase";
import { COLORS } from "../constants/theme";

// [TI-08] Consulta de prueba (SELECT * FROM zonas) para validar conectividad
function ConsultaZonas() {
  const [estado, setEstado] = useState("cargando"); // cargando | ok | error
  const [mensaje, setMensaje] = useState("Verificando conexión con Supabase…");

  useEffect(() => {
    let activo = true;
    (async () => {
      const { data, error } = await supabase.from("zonas").select("*");
      if (!activo) return;
      if (error) {
        setEstado("error");
        setMensaje(`Error de conexión: ${error.message}`);
        return;
      }
      setEstado("ok");
      setMensaje(`Centro listo · ${data.length} zona(s) sincronizada(s) desde Supabase`);
    })();
    return () => {
      activo = false;
    };
  }, []);

  const fondo =
    estado === "ok" ? COLORS.greenBg : estado === "error" ? COLORS.redBg : "#F1F5F9";
  const texto =
    estado === "ok" ? COLORS.green : estado === "error" ? COLORS.red : COLORS.textMuted;

  return (
    <View style={[styles.connectionBadge, { backgroundColor: fondo }]}>
      <Text style={[styles.connectionText, { color: texto }]}>
        {estado === "ok" ? "✓ " : estado === "error" ? "✗ " : "… "}
        {mensaje}
      </Text>
    </View>
  );
}

export default function ReportesScreen() {
  const [reportes, setReportes] = useState(REPORTES_EJEMPLO);

  const handleApoyar = (id) => {
    setReportes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, apoyos: r.apoyos + 1 } : r)),
    );
  };

  const getBadge = (estado) => {
    switch (estado) {
      case "en_revision":
        return { label: "En Revisión", bg: COLORS.amberBg, text: COLORS.amber };
      case "realizando_trabajos":
        return { label: "En Trabajos", bg: COLORS.blueBg, text: COLORS.blue };
      case "hecho":
        return { label: "Resuelto", bg: COLORS.greenBg, text: COLORS.green };
      default:
        return { label: estado, bg: "#F1F5F9", text: COLORS.textMuted };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerSub}>
          ZONA PILOTO: {ZONA_ACTUAL.nombre.toUpperCase()}
        </Text>
        <Text style={styles.headerTitle}>Reportes Vecinales</Text>
        <ConsultaZonas />
      </View>

      <FlatList
        data={reportes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const badge = getBadge(item.estado);
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardCalle}>{item.calle_nombre}</Text>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.text }]}>
                    {badge.label}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>{item.titulo}</Text>
              <Text style={styles.cardDesc}>{item.descripcion}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardDate}>{item.created_at}</Text>
                <TouchableOpacity
                  style={styles.btnApoyo}
                  onPress={() => handleApoyar(item.id)}
                >
                  <Text style={styles.btnApoyoText}>
                    👍 Apoyar ({item.apoyos})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textDark,
    marginTop: 4,
  },
  connectionBadge: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardCalle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    textTransform: "uppercase",
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
  },
  cardDate: { fontSize: 12, color: "#94A3B8" },
  btnApoyo: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnApoyoText: { fontSize: 12, fontWeight: "600", color: COLORS.primaryDark },
});
