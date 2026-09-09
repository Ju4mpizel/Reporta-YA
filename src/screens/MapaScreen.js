// src/screens/MapaScreen.js
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MapPin, Navigation } from "lucide-react-native";
import { COLORS } from "../constants/theme";

export default function MapaScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.cardPlaceholder}>
        <View style={styles.iconWrapper}>
          <MapPin size={32} color={COLORS.primary} strokeWidth={2} />
        </View>
        <Text style={styles.title}>Mapa de Cala Cala</Text>
        <Text style={styles.subtitle}>
          Visualización geográfica con pines georreferenciados agrupados por
          calles y estado de atención.
        </Text>
        <View style={styles.badgeHint}>
          <Navigation size={14} color={COLORS.primary} />
          <Text style={styles.badgeHintText}>Cala Cala · Distrito 12</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    paddingBottom: 120,
  },
  cardPlaceholder: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    maxWidth: 360,
    width: "100%",
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  badgeHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeHintText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
});
