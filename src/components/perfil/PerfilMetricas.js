// src/components/perfil/PerfilMetricas.js
import React from "react";
import { View, Text } from "react-native";
import { COLORS } from "../../constants/theme";
import { styles } from "../../styles/perfilScreen.styles";

export default function PerfilMetricas({ metricas }) {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statBox}>
        <Text style={styles.statNum}>{metricas.total}</Text>
        <Text style={styles.statLabel}>Reportados</Text>
      </View>
      <View style={[styles.statBox, styles.statBoxActive]}>
        <Text style={[styles.statNum, { color: COLORS.amber }]}>
          {metricas.enProceso}
        </Text>
        <Text style={styles.statLabel}>En Proceso</Text>
      </View>
      <View style={[styles.statBox, styles.statBoxDone]}>
        <Text style={[styles.statNum, { color: "#059669" }]}>
          {metricas.resueltos}
        </Text>
        <Text style={styles.statLabel}>Resueltos</Text>
      </View>
    </View>
  );
}
