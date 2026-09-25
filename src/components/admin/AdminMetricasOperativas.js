// src/components/admin/AdminMetricasOperativas.js
import React from "react";
import { View, Text } from "react-native";
import { styles } from "../../styles/adminPanel.styles";

export default function AdminMetricasOperativas({
  nuevos = 0,
  enCurso = 0,
  hechos = 0,
}) {
  return (
    <View style={styles.statsContainer}>
      <View style={[styles.statBox, styles.statBoxAmber]}>
        <Text style={[styles.statNum, { color: "#D97706" }]}>{nuevos}</Text>
        <Text style={styles.statLabel}>Nuevos</Text>
      </View>
      <View style={[styles.statBox, styles.statBoxBlue]}>
        <Text style={[styles.statNum, { color: "#2563EB" }]}>{enCurso}</Text>
        <Text style={styles.statLabel}>En Cuadrilla</Text>
      </View>
      <View style={[styles.statBox, styles.statBoxGreen]}>
        <Text style={[styles.statNum, { color: "#059669" }]}>{hechos}</Text>
        <Text style={styles.statLabel}>Resueltos</Text>
      </View>
    </View>
  );
}
