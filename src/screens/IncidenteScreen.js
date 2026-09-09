// src/screens/IncidenteScreen.js
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from "react-native";
import {
  ThumbsUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Check,
  X,
  Loader2,
} from "lucide-react-native";
import { INCIDENTES_EJEMPLO, ZONA_ACTUAL } from "../data/mockData";
import { supabase } from "../services/supabase";
import { COLORS } from "../constants/theme";

function ConsultaZonas() {
  const [estado, setEstado] = useState("cargando");
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
      setMensaje(
        `Centro listo · ${data ? data.length : 0} zona(s) sincronizada(s)`,
      );
    })();
    return () => {
      activo = false;
    };
  }, []);

  const fondo =
    estado === "ok"
      ? COLORS.greenBg
      : estado === "error"
        ? COLORS.redBg
        : "#F1F5F9";
  const colorTexto =
    estado === "ok"
      ? COLORS.green
      : estado === "error"
        ? COLORS.red
        : COLORS.textMuted;

  return (
    <View style={[styles.connectionBadge, { backgroundColor: fondo }]}>
      <View style={styles.connectionContent}>
        {estado === "ok" && (
          <Check size={14} color={colorTexto} strokeWidth={2.5} />
        )}
        {estado === "error" && (
          <X size={14} color={colorTexto} strokeWidth={2.5} />
        )}
        {estado === "cargando" && (
          <Loader2 size={14} color={colorTexto} strokeWidth={2.5} />
        )}
        <Text style={[styles.connectionText, { color: colorTexto }]}>
          {mensaje}
        </Text>
      </View>
    </View>
  );
}

export default function IncidenteScreen() {
  const [incidentes, setIncidentes] = useState(INCIDENTES_EJEMPLO);

  const handleApoyar = (id) => {
    setIncidentes((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, apoyos: item.apoyos + 1 } : item,
      ),
    );
  };

  const getBadge = (estado) => {
    switch (estado) {
      case "en_revision":
        return {
          label: "En Revisión",
          bg: COLORS.amberBg,
          text: COLORS.amber,
          Icon: Clock,
        };
      case "realizando_trabajos":
        return {
          label: "En Trabajos",
          bg: COLORS.blueBg,
          text: COLORS.blue,
          Icon: Wrench,
        };
      case "hecho":
        return {
          label: "Resuelto",
          bg: COLORS.greenBg,
          text: COLORS.green,
          Icon: CheckCircle2,
        };
      default:
        return {
          label: estado,
          bg: "#F1F5F9",
          text: COLORS.textMuted,
          Icon: AlertCircle,
        };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerSub}>
          ZONA PILOTO: {ZONA_ACTUAL.nombre.toUpperCase()}
        </Text>
        <Text style={styles.headerTitle}>Incidentes Urbanos</Text>
        <ConsultaZonas />
      </View>

      <FlatList
        data={incidentes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const badge = getBadge(item.estado);
          const BadgeIcon = badge.Icon;

          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardCalle}>{item.calle_nombre}</Text>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <BadgeIcon size={12} color={badge.text} strokeWidth={2.4} />
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
                  activeOpacity={0.8}
                  style={styles.btnApoyo}
                  onPress={() => handleApoyar(item.id)}
                >
                  <ThumbsUp
                    size={14}
                    color={COLORS.primaryDark}
                    strokeWidth={2.2}
                  />
                  <Text style={styles.btnApoyoText}>
                    Apoyar ({item.apoyos})
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
  connectionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingBottom: 120, // Espacio suficiente para no chocar con la TabBar flotante
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
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnApoyoText: { fontSize: 12, fontWeight: "600", color: COLORS.primaryDark },
});
