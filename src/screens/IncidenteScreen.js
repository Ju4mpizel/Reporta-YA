// src/screens/IncidenteScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useAuth } from "../context/AuthContext";
import { incidentesService } from "../services/incidentesService";
import { useIncidentesFeed } from "../hooks/useIncidentesFeed";
import HeaderInstitucional from "../components/layout/HeaderInstitucional";
import FiltrosAcordeon from "../components/layout/FiltrosAcordeon";
import IncidenteCard from "../components/cards/IncidenteCard";
import CustomModalAlert from "../components/feedback/CustomModalAlert";
import OfflineEmptyState from "../components/feedback/OfflineEmptyState";
import { styles } from "../styles/incidenteScreen.styles";
import { COLORS } from "../constants/theme";

export default function IncidenteScreen({ route, navigation }) {
  const { perfil } = useAuth();
  const flatListRef = useRef(null);
  const incidenteIdSeleccionado = route?.params?.incidenteIdSeleccionado;

  const {
    incidentes,
    setIncidentes,
    incidentesFiltrados,
    cargando,
    refrescando,
    errorConexion,
    cargarIncidentes,
    filtros,
  } = useIncidentesFeed(perfil?.id);

  const [alerta, setAlerta] = useState({
    visible: false,
    tipo: "info",
    titulo: "",
    mensaje: "",
  });

  // Auto-scroll si se navegó desde el mapa con un ID seleccionado
  useEffect(() => {
    if (incidenteIdSeleccionado && incidentes.length > 0) {
      const index = incidentes.findIndex(
        (i) => Number(i.id) === Number(incidenteIdSeleccionado),
      );

      if (index !== -1) {
        const timeoutId = setTimeout(() => {
          if (flatListRef.current) {
            try {
              flatListRef.current.scrollToIndex({
                index,
                animated: true,
                viewPosition: 0.2,
              });
            } catch (err) {}
          }
        }, 300);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [incidenteIdSeleccionado, incidentes]);

  const handleApoyar = async (incidenteId) => {
    if (!perfil?.id) {
      setAlerta({
        visible: true,
        tipo: "info",
        titulo: "Acceso Requerido",
        mensaje:
          "Debes iniciar sesión con tu carnet de identidad para respaldar este reporte.",
      });
      return;
    }

    let conexionEstable =
      Platform.OS === "web"
        ? typeof navigator !== "undefined" && navigator.onLine
        : (await NetInfo.fetch()).isConnected;

    if (!conexionEstable) {
      setAlerta({
        visible: true,
        tipo: "error",
        titulo: "Sin Conexión",
        mensaje:
          "No tienes conexión a internet para respaldar reportes en este momento.",
      });
      return;
    }

    try {
      const res = await incidentesService.toggleApoyo(incidenteId, perfil.id);
      setIncidentes((prev) =>
        prev.map((item) => {
          if (item.id === incidenteId) {
            const nuevoTotal = res.apoyado
              ? item.total_apoyos + 1
              : Math.max(0, item.total_apoyos - 1);
            return {
              ...item,
              total_apoyos: nuevoTotal,
              apoyado_por_mi: res.apoyado,
            };
          }
          return item;
        }),
      );
    } catch (err) {
      setAlerta({
        visible: true,
        tipo: "error",
        titulo: "Aviso",
        mensaje: err.message || "No se pudo registrar tu respaldo.",
      });
    }
  };

  return (
    <View style={styles.container}>
      <HeaderInstitucional titulo="Incidentes Urbanos" />

      <FiltrosAcordeon
        zonaSeleccionada={filtros.zona}
        calleSeleccionada={filtros.calle}
        categoriaSeleccionada={filtros.categoria}
        onPressZona={filtros.setZona}
        onPressCalle={filtros.setCalle}
        onPressCategoria={filtros.setCategoria}
      />

      {cargando && incidentes.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            Cargando incidentes distritales...
          </Text>
        </View>
      ) : errorConexion && incidentes.length === 0 ? (
        <OfflineEmptyState
          titulo="Modo fuera de línea"
          mensaje="No fue posible conectar con el servidor municipal para cargar los reportes."
          onReintentar={cargarIncidentes}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={incidentesFiltrados}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={() => {}}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={cargarIncidentes}
            />
          }
          renderItem={({ item, index }) => (
            <IncidenteCard
              item={item}
              index={index}
              esSeleccionado={
                Number(incidenteIdSeleccionado) === Number(item.id)
              }
              onApoyar={handleApoyar}
              onVerMapaApp={(id) =>
                navigation.navigate("Mapa", { incidenteIdSeleccionado: id })
              }
            />
          )}
        />
      )}

      <CustomModalAlert
        visible={alerta.visible}
        tipo={alerta.tipo}
        titulo={alerta.titulo}
        mensaje={alerta.mensaje}
        onConfirmar={() => setAlerta((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}
