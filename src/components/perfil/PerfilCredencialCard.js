// src/components/perfil/PerfilCredencialCard.js
import React from "react";
import { View, Text } from "react-native";
import { User, ShieldCheck, Award } from "lucide-react-native";
import { styles } from "../../styles/perfilScreen.styles";

export default function PerfilCredencialCard({ perfil }) {
  const rolTexto = (
    perfil?.roles?.nombre ||
    perfil?.rol_id ||
    "Ciudadano"
  ).toUpperCase();

  return (
    <View style={styles.identityCard}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatarCircle}>
          <User size={38} color="#FFFFFF" strokeWidth={2.2} />
        </View>
        <View style={styles.activeBadge}>
          <ShieldCheck size={11} color="#FFFFFF" strokeWidth={2.5} />
        </View>
      </View>

      <Text style={styles.userName}>
        {perfil?.nombre_completo || "Vecino Registrado"}
      </Text>
      <Text style={styles.userJurisdiccion}>
        Distrito Municipal 12 · Cala Cala
      </Text>

      <View style={styles.badgesRow}>
        <View style={styles.roleBadge}>
          <Award size={12} color="#0284C7" strokeWidth={2.4} />
          <Text style={styles.roleText}>{rolTexto}</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            {perfil?.activo ? "ACTIVO" : "INACTIVO"}
          </Text>
        </View>
      </View>
    </View>
  );
}
