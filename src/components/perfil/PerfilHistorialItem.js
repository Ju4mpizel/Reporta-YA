// src/components/perfil/PerfilHistorialItem.js
import React from "react";
import { View, Text } from "react-native";
import { Clock } from "lucide-react-native";
import { COLORS } from "../../constants/theme";
import { styles } from "../../styles/perfilScreen.styles";

export default function PerfilHistorialItem({ item }) {
  const esHecho = item.estado === "hecho";
  const esTrabajos = item.estado === "realizando_trabajos";

  const badgeBg = esHecho ? "#DCFCE7" : esTrabajos ? "#DBEAFE" : "#FEF3C7";
  const badgeColor = esHecho ? "#15803D" : esTrabajos ? "#1D4ED8" : "#B45309";
  const badgeLabel = esHecho
    ? "RESUELTO"
    : esTrabajos
      ? "EN TRABAJOS"
      : "EN REVISIÓN";

  return (
    <View style={styles.historyCard}>
      <View style={styles.historyTop}>
        <Text style={styles.historyStreet}>
          {item.calles?.nombre || "Vía de Cala Cala"}
        </Text>
        <View style={[styles.historyBadgeWrap, { backgroundColor: badgeBg }]}>
          <Text style={[styles.historyBadgeText, { color: badgeColor }]}>
            {badgeLabel}
          </Text>
        </View>
      </View>

      <Text style={styles.historyTitle}>{item.titulo}</Text>

      <View style={styles.historyFooter}>
        <Clock size={11} color={COLORS.textSubtle} />
        <Text style={styles.historyDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
}
