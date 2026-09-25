// src/screens/PerfilScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { LogOut, AlertCircle } from "lucide-react-native";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import HeaderInstitucional from "../components/layout/HeaderInstitucional";
import CustomModalAlert from "../components/feedback/CustomModalAlert";
import PerfilCredencialCard from "../components/perfil/PerfilCredencialCard";
import PerfilMetricas from "../components/perfil/PerfilMetricas";
import PerfilInfoCard from "../components/perfil/PerfilInfoCard";
import PerfilHistorialItem from "../components/perfil/PerfilHistorialItem";
import { styles } from "../styles/perfilScreen.styles";
import { COLORS } from "../constants/theme";

export default function PerfilScreen() {
  const { perfil, logout } = useAuth();
  const [metricas, setMetricas] = useState({
    total: 0,
    enProceso: 0,
    resueltos: 0,
  });
  const [misIncidentes, setMisIncidentes] = useState([]);
  const [modalLogout, setModalLogout] = useState(false);

  const animFade = useRef(new Animated.Value(0)).current;
  const animSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animFade, {
        toValue: 1,
        duration: 350,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(animSlide, {
        toValue: 0,
        duration: 350,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (perfil?.id) {
      cargarIncidentesUsuario();
    }
  }, [perfil?.id]);

  async function cargarIncidentesUsuario() {
    try {
      const { data, error } = await supabase
        .from("incidentes")
        .select(`id, titulo, estado, created_at, calles ( nombre )`)
        .eq("usuario_id", perfil.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const items = data || [];
      setMisIncidentes(items);

      setMetricas({
        total: items.length,
        enProceso: items.filter(
          (i) =>
            i.estado === "en_revision" || i.estado === "realizando_trabajos",
        ).length,
        resueltos: items.filter((i) => i.estado === "hecho").length,
      });
    } catch (err) {
      console.error("Error al cargar incidentes de usuario:", err.message);
    }
  }

  return (
    <View style={styles.screenWrapper}>
      <HeaderInstitucional titulo="Credencial Ciudadana" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{ opacity: animFade, transform: [{ translateY: animSlide }] }}
        >
          {/* Tarjeta de Identidad */}
          <PerfilCredencialCard perfil={perfil} />

          {/* Métricas */}
          <PerfilMetricas metricas={metricas} />

          {/* Datos del Registro */}
          <PerfilInfoCard perfil={perfil} />

          {/* Historial Reciente */}
          <Text style={styles.sectionHeader}>HISTORIAL RECIENTE</Text>
          {misIncidentes.length === 0 ? (
            <View style={styles.emptyCard}>
              <AlertCircle size={24} color={COLORS.textSubtle} />
              <Text style={styles.emptyText}>
                No tienes incidencias registradas en la zona.
              </Text>
            </View>
          ) : (
            misIncidentes
              .slice(0, 3)
              .map((item) => <PerfilHistorialItem key={item.id} item={item} />)
          )}

          {/* Botón Logout */}
          <TouchableOpacity
            style={styles.btnLogout}
            activeOpacity={0.8}
            onPress={() => setModalLogout(true)}
          >
            <LogOut size={16} color="#EF4444" strokeWidth={2.4} />
            <Text style={styles.btnLogoutText}>Cerrar Sesión Activa</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <CustomModalAlert
        visible={modalLogout}
        tipo="confirmar"
        titulo="¿Deseas cerrar tu sesión?"
        mensaje="Deberás volver a ingresar tu CI y contraseña para respaldar o reportar problemas vecinales."
        textoBotonConfirmar="Cerrar Sesión"
        textoBotonCancelar="Cancelar"
        onConfirmar={() => {
          setModalLogout(false);
          logout();
        }}
        onCancelar={() => setModalLogout(false)}
      />
    </View>
  );
}
