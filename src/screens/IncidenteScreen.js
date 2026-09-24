// src/screens/IncidenteScreen.js
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { incidentesService } from "../services/incidentesService";
import HeaderInstitucional from "../components/HeaderInstitucional";
import FiltrosAcordeon from "../components/FiltrosAcordeon";
import IncidenteCard from "../components/IncidenteCard";
import CustomModalAlert from "../components/CustomModalAlert";
import { COLORS, SPACING } from "../constants/theme";

export default function IncidenteScreen({ route, navigation }) {
  const { perfil } = useAuth();
  const flatListRef = useRef(null);
  const incidenteIdSeleccionado = route?.params?.incidenteIdSeleccionado;

  const [incidentes, setIncidentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  // Filtros dinámicos con "Todas" por defecto
  const [zonaFiltro, setZonaFiltro] = useState("Todas");
  const [calleFiltro, setCalleFiltro] = useState("Todas");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");

  // Estado de Alerta Institucional
  const [alerta, setAlerta] = useState({
    visible: false,
    tipo: "info",
    titulo: "",
    mensaje: "",
  });

  useFocusEffect(
    useCallback(() => {
      cargarIncidentes();
    }, [perfil?.id]),
  );

  useEffect(() => {
    const cancelarSuscripcion = incidentesService.suscribirACambios(() => {
      cargarIncidentes();
    });

    return () => {
      cancelarSuscripcion();
    };
  }, []);

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

  async function cargarIncidentes() {
    try {
      setCargando(true);
      const datos = await incidentesService.obtenerParaFeed(perfil?.id);
      setIncidentes(datos);
    } catch (err) {
      console.error("Error al cargar incidentes:", err.message);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }

  // Filtrado compuesto: Zona + Calle + Categoría
  const incidentesFiltrados = incidentes.filter((item) => {
    const coincideZona =
      zonaFiltro === "Todas" || item.zona_nombre === zonaFiltro;
    const coincideCalle =
      calleFiltro === "Todas" || item.calle_nombre === calleFiltro;
    const coincideCat =
      categoriaFiltro === "Todas" || item.categoria_nombre === categoriaFiltro;
    return coincideZona && coincideCalle && coincideCat;
  });

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
        mensaje: err.message,
      });
    }
  };

  return (
    <View style={styles.container}>
      <HeaderInstitucional titulo="Incidentes Urbanos" />

      <FiltrosAcordeon
        zonaSeleccionada={zonaFiltro}
        calleSeleccionada={calleFiltro}
        categoriaSeleccionada={categoriaFiltro}
        onPressZona={(zona) => setZonaFiltro(zona)}
        onPressCalle={(calle) => setCalleFiltro(calle)}
        onPressCategoria={(cat) => setCategoriaFiltro(cat)}
      />

      {cargando ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            Cargando incidentes distritales...
          </Text>
        </View>
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
                navigation.navigate("Mapa", {
                  incidenteIdSeleccionado: id,
                })
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.bottomInset || 20,
  },
});
