// src/components/AdminIncidenteCard.js
import React, { useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Platform,
  Image,
} from "react-native";
import {
  Building2,
  SlidersHorizontal,
  MapPin,
  Trash2,
  ImageOff,
} from "lucide-react-native";
import { COLORS, RADIUS, SPACING } from "../constants/theme";
import { getBadgeConfig } from "../utils/statusBadges";

export default function AdminIncidenteCard({
  item,
  index = 0,
  onDictaminar,
  onEliminar,
}) {
  const animFade = useRef(new Animated.Value(0)).current;
  const animSlide = useRef(new Animated.Value(16)).current;
  const animScaleBtn = useRef(new Animated.Value(1)).current;

  const badge = getBadgeConfig(item.estado);
  const StatusIcon = badge.Icon;
  const tieneDpto = Boolean(item.departamento_nombre);
  const estaResuelto = item.estado === "hecho";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animFade, {
        toValue: 1,
        duration: 300,
        delay: Math.min(index * 50, 350),
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(animSlide, {
        toValue: 0,
        duration: 300,
        delay: Math.min(index * 50, 350),
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(animScaleBtn, {
      toValue: 0.95,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(animScaleBtn, {
      toValue: 1,
      friction: 4,
      tension: 160,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: animFade,
          transform: [{ translateY: animSlide }],
        },
      ]}
    >
      <View style={styles.cardTop}>
        <View style={styles.calleRow}>
          <MapPin size={11} color={COLORS.primary} strokeWidth={2.4} />
          <Text style={styles.cardCalle} numberOfLines={1}>
            {item.calle_nombre}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <StatusIcon size={11} color={badge.text} strokeWidth={2.4} />
          <Text style={[styles.badgeText, { color: badge.text }]}>
            {badge.label}
          </Text>
        </View>
      </View>

      <Text style={styles.cardCategoria}>{item.categoria_nombre}</Text>
      <Text style={styles.cardTitle}>{item.titulo}</Text>
      <Text style={styles.cardDesc}>{item.descripcion}</Text>

      {item.foto_url ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.foto_url }} style={styles.cardImage} />
        </View>
      ) : (
        <View style={styles.noImagePlaceholder}>
          <ImageOff size={18} color="#94A3B8" strokeWidth={1.8} />
          <Text style={styles.noImageText}>Sin foto adjunta</Text>
        </View>
      )}

      <View style={styles.dptoContainer}>
        <Building2
          size={13}
          color={tieneDpto ? COLORS.primaryDark : COLORS.textMuted}
        />
        <Text style={styles.dptoText}>
          Unidad:{" "}
          {tieneDpto ? (
            <Text style={styles.dptoName}>{item.departamento_nombre}</Text>
          ) : (
            <Text style={styles.dptoNone}>Sin Asignar (Pendiente)</Text>
          )}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <Animated.View
          style={{ flex: 1, transform: [{ scale: animScaleBtn }] }}
        >
          <TouchableOpacity
            style={styles.btnAction}
            activeOpacity={0.85}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => onDictaminar(item)}
          >
            <SlidersHorizontal size={13} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.btnActionText}>
              {tieneDpto ? "Modificar Dictamen" : "Asignar Unidad"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Botón de eliminación */}
        <TouchableOpacity
          style={[
            styles.btnDelete,
            estaResuelto ? styles.btnDeleteActive : styles.btnDeleteDisabled,
          ]}
          activeOpacity={0.7}
          onPress={() => onEliminar(item)}
        >
          <Trash2
            size={15}
            color={estaResuelto ? "#DC2626" : "#94A3B8"}
            strokeWidth={2.2}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  calleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  cardCalle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
    textTransform: "uppercase",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  badgeText: { fontSize: 10, fontWeight: "800" },
  cardCategoria: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "700",
    marginBottom: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    lineHeight: 17,
    marginBottom: SPACING.xs,
  },
  imageContainer: {
    width: "100%",
    height: 120,
    borderRadius: RADIUS.sm,
    overflow: "hidden",
    marginVertical: 6,
    backgroundColor: "#E2E8F0",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  noImagePlaceholder: {
    width: "100%",
    height: 48,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginVertical: 4,
  },
  noImageText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94A3B8",
  },
  dptoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  dptoText: { fontSize: 11, color: COLORS.textMuted },
  dptoName: { fontWeight: "800", color: COLORS.primaryDark },
  dptoNone: { fontStyle: "italic", color: COLORS.textMuted },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  btnAction: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 11,
    borderRadius: RADIUS.sm,
  },
  btnActionText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  btnDelete: {
    width: 44,
    height: 42,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  btnDeleteActive: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  btnDeleteDisabled: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
});
