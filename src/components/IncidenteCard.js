// src/components/IncidenteCard.js
import React, { useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Platform,
  Linking,
  Image,
} from "react-native";
import {
  ThumbsUp,
  Calendar,
  MapPin,
  Building2,
  ShieldCheck,
  ExternalLink,
  Map,
  ImageOff,
} from "lucide-react-native";
import { COLORS, RADIUS, SPACING } from "../constants/theme";
import { getBadgeConfig } from "../utils/statusBadges";

export default function IncidenteCard({
  item,
  index = 0,
  esSeleccionado = false,
  onApoyar,
  onVerMapaApp,
}) {
  const animFade = useRef(new Animated.Value(0)).current;
  const animTranslateY = useRef(new Animated.Value(18)).current;
  const animEscalaApoyo = useRef(new Animated.Value(1)).current;

  const badge = getBadgeConfig(item.estado);
  const StatusIcon = badge.Icon;
  const estaApoyado = Boolean(item.apoyado_por_mi);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animFade, {
        toValue: 1,
        duration: 320,
        delay: Math.min(index * 60, 360),
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(animTranslateY, {
        toValue: 0,
        duration: 320,
        delay: Math.min(index * 60, 360),
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  }, []);

  const handlePresionarApoyo = () => {
    Animated.sequence([
      Animated.timing(animEscalaApoyo, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.spring(animEscalaApoyo, {
        toValue: 1,
        friction: 4,
        tension: 140,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();

    if (onApoyar) onApoyar(item.id);
  };

  return (
    <Animated.View
      style={[
        styles.card,
        esSeleccionado && styles.cardSeleccionada,
        {
          opacity: animFade,
          transform: [{ translateY: animTranslateY }],
        },
      ]}
    >
      {esSeleccionado && (
        <View style={styles.bannerSeleccionado}>
          <MapPin size={11} color="#FFFFFF" strokeWidth={2.4} />
          <Text style={styles.bannerSeleccionadoText}>
            EXPEDIENTE SELECCIONADO EN MAPA
          </Text>
        </View>
      )}

      {/* Encabezado */}
      <View style={styles.cardTop}>
        <View style={styles.calleContainer}>
          <MapPin size={12} color={COLORS.primary} strokeWidth={2.4} />
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

      {/* Fotografía Evidencial o Placeholder Estilizado */}
      {item.foto_url ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.foto_url }} style={styles.cardImage} />
        </View>
      ) : (
        <View style={styles.noImagePlaceholder}>
          <ImageOff size={22} color="#94A3B8" strokeWidth={1.8} />
          <Text style={styles.noImageText}>
            Sin evidencia fotográfica adjunta
          </Text>
        </View>
      )}

      {/* Enlaces Cartográficos */}
      <View style={styles.linksContainer}>
        {item.maps_url ? (
          <TouchableOpacity
            style={styles.btnMapsLink}
            activeOpacity={0.7}
            onPress={() => Linking.openURL(item.maps_url)}
          >
            <MapPin size={11} color="#059669" strokeWidth={2.2} />
            <Text style={styles.btnMapsLinkText}>Abrir en Google Maps</Text>
            <ExternalLink size={11} color="#059669" />
          </TouchableOpacity>
        ) : null}

        {onVerMapaApp ? (
          <TouchableOpacity
            style={styles.btnVerEnMapaApp}
            activeOpacity={0.7}
            onPress={() => onVerMapaApp(item.id)}
          >
            <Map size={11} color={COLORS.primary} strokeWidth={2.2} />
            <Text style={styles.btnVerEnMapaAppText}>
              Ver en mapa interactivo
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Unidad Responsable */}
      {item.departamento_nombre && (
        <View style={styles.dptoBadge}>
          <Building2 size={12} color={COLORS.primaryDark} />
          <Text style={styles.dptoBadgeText}>
            Unidad: {item.departamento_nombre}
          </Text>
        </View>
      )}

      {/* Dictamen de la Alcaldía */}
      {item.nota_alcaldia ? (
        <View style={styles.notaAlcaldiaBox}>
          <View style={styles.notaAlcaldiaHeader}>
            <ShieldCheck size={13} color={COLORS.primary} strokeWidth={2.4} />
            <Text style={styles.notaAlcaldiaTitle}>
              RESOLUCIÓN MUNICIPAL OFICIAL
            </Text>
          </View>
          <Text style={styles.notaAlcaldiaText}>{item.nota_alcaldia}</Text>
        </View>
      ) : null}

      {/* Footer con Botón de Apoyo Reactivo */}
      <View style={styles.cardFooter}>
        <View style={styles.dateRow}>
          <Calendar size={12} color={COLORS.textSubtle} />
          <Text style={styles.cardDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>

        <Animated.View style={{ transform: [{ scale: animEscalaApoyo }] }}>
          <TouchableOpacity
            style={[styles.btnApoyo, estaApoyado && styles.btnApoyoActivo]}
            activeOpacity={0.8}
            onPress={handlePresionarApoyo}
          >
            <ThumbsUp
              size={12}
              color={estaApoyado ? "#FFFFFF" : COLORS.primaryDark}
              strokeWidth={2.4}
            />
            <Text
              style={[
                styles.btnApoyoText,
                estaApoyado && styles.btnApoyoTextActivo,
              ]}
            >
              {estaApoyado ? "Respaldado" : "Respaldar"} (
              {item.total_apoyos || 0})
            </Text>
          </TouchableOpacity>
        </Animated.View>
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
  cardSeleccionada: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: "#F0F9FF",
  },
  bannerSeleccionado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  bannerSeleccionadoText: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  calleContainer: {
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
    marginBottom: 4,
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
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },

  /* Contenedores de imagen */
  imageContainer: {
    width: "100%",
    height: 170,
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
    height: 72,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginVertical: 6,
  },
  noImageText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#94A3B8",
  },

  linksContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginVertical: 4,
  },
  btnMapsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  btnMapsLinkText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  btnVerEnMapaApp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  btnVerEnMapaAppText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
  },
  dptoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    alignSelf: "flex-start",
    marginTop: 4,
    marginBottom: 6,
  },
  dptoBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  notaAlcaldiaBox: {
    backgroundColor: "#F8FAFC",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    borderRadius: 4,
    padding: 8,
    marginTop: 4,
    marginBottom: SPACING.xs,
  },
  notaAlcaldiaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  notaAlcaldiaTitle: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  notaAlcaldiaText: {
    fontSize: 11,
    color: COLORS.textDark,
    lineHeight: 15,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 8,
    marginTop: 6,
  },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  cardDate: { fontSize: 11, color: COLORS.textSubtle },

  /* Botón de apoyo */
  btnApoyo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  btnApoyoActivo: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  btnApoyoText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  btnApoyoTextActivo: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
