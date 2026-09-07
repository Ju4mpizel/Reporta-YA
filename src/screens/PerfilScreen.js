import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/theme";

export default function PerfilScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>👤 Mi Perfil</Text>
      <Text style={styles.subtitle}>
        Datos del ciudadano (CI, teléfono), historial de reportes propios y
        botón de cerrar sesión.
      </Text>
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
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textDark,
    marginBottom: 8,
  },
  subtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: "center" },
});
