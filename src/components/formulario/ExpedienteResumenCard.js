// src/components/formulario/ExpedienteResumenCard.js
import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { MapPin, User, ThumbsUp, ExternalLink } from "lucide-react-native";
import { COLORS } from "../../constants/theme";
import { styles } from "../../styles/gestionIncidente.styles";

export default function ExpedienteResumenCard({ incidente }) {
  if (!incidente) return null;

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryInfo}>
        <View style={styles.badgeJurisdiccion}>
          <MapPin size={10} color={COLORS.primary} strokeWidth={2.5} />
          <Text style={styles.summaryCalle}>
            {incidente.calle_nombre || "Vía Registrada"}
          </Text>
        </View>

        <Text style={styles.summaryTitle}>{incidente.titulo}</Text>
        <Text style={styles.summaryDesc}>{incidente.descripcion}</Text>

        <View style={styles.metaRow}>
          <View style={styles.infoLine}>
            <User size={11} color={COLORS.textMuted} />
            <Text style={styles.infoLineText}>
              Vecino: {incidente.usuario_nombre || "Vecino Registrado"}
            </Text>
          </View>
          <View style={styles.infoLine}>
            <ThumbsUp size={11} color={COLORS.primary} strokeWidth={2.2} />
            <Text style={styles.infoLineVotes}>
              {incidente.total_apoyos} respaldos
            </Text>
          </View>
        </View>

        {incidente.maps_url ? (
          <TouchableOpacity
            style={styles.btnAdminMaps}
            activeOpacity={0.7}
            onPress={() => Linking.openURL(incidente.maps_url)}
          >
            <MapPin size={11} color="#0284C7" strokeWidth={2.2} />
            <Text style={styles.btnAdminMapsText}>
              Ver punto exacto en Google Maps
            </Text>
            <ExternalLink size={10} color="#0284C7" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
