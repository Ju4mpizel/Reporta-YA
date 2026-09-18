// src/components/FiltrosAcordeon.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  MapPin,
  Navigation,
  AlertTriangle,
  ChevronDown,
} from "lucide-react-native";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

export default function FiltrosAcordeon({
  zonaSeleccionada = "Cala Cala",
  calleSeleccionada = "Todas",
  categoriaSeleccionada = "Todas",
  onPressZona,
  onPressCalle,
  onPressCategoria,
}) {
  return (
    <View style={styles.container}>
      {/* Filtro Zona */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.filterBox}
        onPress={onPressZona}
      >
        <View style={styles.content}>
          <View style={styles.labelRow}>
            <MapPin size={11} color={COLORS.textMuted} strokeWidth={2.2} />
            <Text style={styles.label}>Zona</Text>
          </View>
          <Text style={styles.value} numberOfLines={1}>
            {zonaSeleccionada}
          </Text>
        </View>
        <ChevronDown size={13} color={COLORS.textDark} strokeWidth={2.2} />
      </TouchableOpacity>

      {/* Filtro Calle */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.filterBox}
        onPress={onPressCalle}
      >
        <View style={styles.content}>
          <View style={styles.labelRow}>
            <Navigation size={11} color={COLORS.textMuted} strokeWidth={2.2} />
            <Text style={styles.label}>Calle</Text>
          </View>
          <Text style={styles.value} numberOfLines={1}>
            {calleSeleccionada}
          </Text>
        </View>
        <ChevronDown size={13} color={COLORS.textDark} strokeWidth={2.2} />
      </TouchableOpacity>

      {/* Filtro Categoría */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.filterBox}
        onPress={onPressCategoria}
      >
        <View style={styles.content}>
          <View style={styles.labelRow}>
            <AlertTriangle
              size={11}
              color={COLORS.textMuted}
              strokeWidth={2.2}
            />
            <Text style={styles.label}>Categ.</Text>
          </View>
          <Text style={styles.value} numberOfLines={1}>
            {categoriaSeleccionada}
          </Text>
        </View>
        <ChevronDown size={13} color={COLORS.textDark} strokeWidth={2.2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: COLORS.textDark,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: COLORS.surface,
  },
  content: {
    flex: 1,
    marginRight: 4,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textDark,
  },
});
