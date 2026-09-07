import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/theme";

export default function MapaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📍 Mapa de Cala Cala</Text>
      <Text style={styles.subtitle}>
        Aquí irán los pines agrupados por calle con react-native-maps.
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
