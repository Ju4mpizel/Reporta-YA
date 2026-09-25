// src/components/perfil/PerfilInfoCard.js
import React from "react";
import { View, Text } from "react-native";
import { FileText, Phone, MapPin, Calendar } from "lucide-react-native";
import { styles } from "../../styles/perfilScreen.styles";

export default function PerfilInfoCard({ perfil }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.cardSectionTitle}>DATOS DEL REGISTRO</Text>

      <View style={styles.infoRow}>
        <View style={styles.iconLabel}>
          <View style={styles.iconWrapMini}>
            <FileText size={14} color="#0284C7" />
          </View>
          <Text style={styles.labelText}>Cédula de Identidad</Text>
        </View>
        <Text style={styles.valueText}>{perfil?.ci || "Sin CI"}</Text>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.iconLabel}>
          <View style={styles.iconWrapMini}>
            <Phone size={14} color="#0284C7" />
          </View>
          <Text style={styles.labelText}>Teléfono de Contacto</Text>
        </View>
        <Text style={styles.valueText}>
          {perfil?.telefono || "No asignado"}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.iconLabel}>
          <View style={styles.iconWrapMini}>
            <MapPin size={14} color="#0284C7" />
          </View>
          <Text style={styles.labelText}>Jurisdicción Asignada</Text>
        </View>
        <Text style={styles.valueText}>Cochabamba - D12</Text>
      </View>

      <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
        <View style={styles.iconLabel}>
          <View style={styles.iconWrapMini}>
            <Calendar size={14} color="#0284C7" />
          </View>
          <Text style={styles.labelText}>Fecha de Alta</Text>
        </View>
        <Text style={styles.valueText}>
          {perfil?.created_at
            ? new Date(perfil.created_at).toLocaleDateString()
            : "2026"}
        </Text>
      </View>
    </View>
  );
}
