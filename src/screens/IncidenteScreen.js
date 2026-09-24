// src/screens/IncidenteScreen.js
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import { useAuth } from "../context/AuthContext";
import { incidentesService } from "../services/incidentesService";
import { commandQueueService } from "../services/CommandQueueService";
import HeaderInstitucional from "../components/HeaderInstitucional";
import FiltrosAcordeon from "../components/FiltrosAcordeon";
import IncidenteCard from "../components/IncidenteCard";
import CustomModalAlert from "../components/CustomModalAlert";
import OfflineEmptyState from "../components/OfflineEmptyState";
import { COLORS, SPACING } from "../constants/theme";

export default function IncidenteScreen({ route, navigation }) {
  const { perfil } = useAuth();
  const flatListRef = useRef(null);
  const incidenteIdSeleccionado = route?.params?.incidenteIdSeleccionado;

  const [incidentes, setIncidentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [errorConexion, setErrorConexion] = useState(false);

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
    // 1. Escuchar cambios en tiempo real de Supabase
    const cancelarSuscripcionSupabase = incidentesService.suscribirACambios(
      () => {
        cargarIncidentes();
      },
    );

    // 2. Escuchar la sincronización reactiva del CommandQueue (cuando se despachan reportes offline)
    const cancelarSuscripcionQueue = commandQueueService.suscribir((evento) => {
      if (evento === "COMANDO_EJECUTADO") {
        cargarIncidentes();
      }
    });

    // 3. Listener nativo de reconexión física de red (Web y Mobile)
    const handleReconexion = () => {
      cargarIncidentes();
    };

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.addEventListener("online", handleReconexion);
    }

    const desuscribirNet = NetInfo.addEventListener((state) => {
      const hayRed = Boolean(
        state.isConnected && state.isInternetReachable !== false,
      );
      if (hayRed) {
        cargarIncidentes();
      }
    });

    return () => {
      cancelarSuscripcionSupabase();
      cancelarSuscripcionQueue();
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.removeEventListener("online", handleReconexion);
      }
      desuscribirNet();
    };
  }, [perfil?.id]);

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
      setErrorConexion(false);
      const datos = await incidentesService.obtenerParaFeed(perfil?.id);
      setIncidentes(datos);
    } catch (err) {
      console.warn("Aviso al cargar incidentes:", err.message);
      const esErrorDeRed =
        err.message?.toLowerCase().includes("failed to fetch") ||
        err.message?.toLowerCase().includes("network") ||
        (Platform.OS === "web" &&
          typeof navigator !== "undefined" &&
          !navigator.onLine);

      if (esErrorDeRed) {
        setErrorConexion(true);
      }
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
    // 1. Verificación de sesión
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

    // 2. Verificación estricta de conexión a internet
    let conexionEstable = true;
    if (Platform.OS === "web" && typeof navigator !== "undefined") {
      conexionEstable = navigator.onLine === true;
    }

    if (conexionEstable) {
      const netState = await NetInfo.fetch();
      conexionEstable = Boolean(
        netState.isConnected && netState.isInternetReachable !== false,
      );
    }

    if (!conexionEstable) {
      setAlerta({
        visible: true,
        tipo: "error",
        titulo: "Sin Conexión",
        mensaje:
          "No tienes conexión a internet para respaldar reportes en este momento. Inténtalo cuando recuperes la red.",
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
      const esErrorDeRed =
        err.message?.toLowerCase().includes("failed to fetch") ||
        err.message?.toLowerCase().includes("network") ||
        (Platform.OS === "web" &&
          typeof navigator !== "undefined" &&
          !navigator.onLine);

      if (esErrorDeRed) {
        setAlerta({
          visible: true,
          tipo: "error",
          titulo: "Sin Conexión",
          mensaje:
            "No tienes conexión a internet para respaldar reportes en este momento. Inténtalo cuando recuperes la red.",
        });
      } else {
        setAlerta({
          visible: true,
          tipo: "error",
          titulo: "Aviso",
          mensaje: err.message || "No se pudo registrar tu respaldo.",
        });
      }
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
          mensaje="No fue posible conectar con el servidor municipal para cargar los reportes. Los incidentes que envíes se guardarán localmente."
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
