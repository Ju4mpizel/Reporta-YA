// src/components/feedback/OfflineEmptyState.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { WifiOff, RefreshCw } from "lucide-react-native";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";

export default function OfflineEmptyState({
  titulo = "Sin conexión a internet",
  mensaje = "No se pudieron sincronizar los expedientes en este momento. Revisa tu conexión a la red.",
  onReintentar,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <WifiOff size={32} color="#DC2626" strokeWidth={2.2} />
      </View>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.mensaje}>{mensaje}</Text>

      {onReintentar && (
        <TouchableOpacity
          style={styles.btnReintentar}
          activeOpacity={0.8}
          onPress={onReintentar}
        >
          <RefreshCw size={14} color="#FFFFFF" strokeWidth={2.4} />
          <Text style={styles.btnText}>Reintentar sincronización</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  titulo: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textDark,
    textAlign: "center",
    marginBottom: 6,
  },
  mensaje: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 320,
    marginBottom: SPACING.lg,
  },
  btnReintentar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
});
