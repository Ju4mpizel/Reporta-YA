// src/hooks/useIncidentesFeed.js
import { useState, useCallback, useEffect } from "react";
import { Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import { incidentesService } from "../services/incidentesService";
import { commandQueueService } from "../services/CommandQueueService";

export function useIncidentesFeed(usuarioId) {
  const [incidentes, setIncidentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [errorConexion, setErrorConexion] = useState(false);

  // Filtros dinámicos
  const [zonaFiltro, setZonaFiltro] = useState("Todas");
  const [calleFiltro, setCalleFiltro] = useState("Todas");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");

  const cargarIncidentes = useCallback(async () => {
    try {
      setCargando(true);
      setErrorConexion(false);
      const datos = await incidentesService.obtenerParaFeed(usuarioId);
      setIncidentes(Array.isArray(datos) ? datos : []);
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
  }, [usuarioId]);

  useFocusEffect(
    useCallback(() => {
      cargarIncidentes();
    }, [cargarIncidentes]),
  );

  useEffect(() => {
    // 1. Suscripción a cambios Realtime de Supabase
    const cancelarRealtime = incidentesService.suscribirACambios(() => {
      cargarIncidentes();
    });

    // 2. Suscripción a la cola offline
    const cancelarQueue = commandQueueService.suscribir((evento) => {
      if (evento === "COMANDO_EJECUTADO") {
        cargarIncidentes();
      }
    });

    // 3. Listener de red física
    const handleReconexionWeb = () => cargarIncidentes();
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.addEventListener("online", handleReconexionWeb);
    }

    const desuscribirNetInfo = NetInfo.addEventListener((state) => {
      const hayRed = Boolean(
        state.isConnected && state.isInternetReachable !== false,
      );
      if (hayRed) {
        cargarIncidentes();
      }
    });

    return () => {
      cancelarRealtime();
      cancelarQueue();
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.removeEventListener("online", handleReconexionWeb);
      }
      desuscribirNetInfo();
    };
  }, [cargarIncidentes]);

  // Filtrado compuesto en memoria
  const incidentesFiltrados = incidentes.filter((item) => {
    const coincideZona =
      zonaFiltro === "Todas" || item.zona_nombre === zonaFiltro;
    const coincideCalle =
      calleFiltro === "Todas" || item.calle_nombre === calleFiltro;
    const coincideCat =
      categoriaFiltro === "Todas" || item.categoria_nombre === categoriaFiltro;
    return coincideZona && coincideCalle && coincideCat;
  });

  return {
    incidentes,
    setIncidentes,
    incidentesFiltrados,
    cargando,
    refrescando,
    errorConexion,
    cargarIncidentes,
    filtros: {
      zona: zonaFiltro,
      calle: calleFiltro,
      categoria: categoriaFiltro,
      setZona: setZonaFiltro,
      setCalle: setCalleFiltro,
      setCategoria: setCategoriaFiltro,
    },
  };
}
