// src/screens/AdminPanelScreen.js
import React, { useState, useCallback, useEffect } from "react";
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
import { incidentesService } from "../services/incidentesService";
import FiltrosAcordeon from "../components/FiltrosAcordeon";
import HeaderInstitucional from "../components/HeaderInstitucional";
import AdminIncidenteCard from "../components/AdminIncidenteCard";
import CustomModalAlert from "../components/CustomModalAlert";
import OfflineEmptyState from "../components/OfflineEmptyState";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

export default function AdminPanelScreen({ navigation }) {
  const [incidentes, setIncidentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [errorConexion, setErrorConexion] = useState(false);

  // Filtros dinámicos con "Todas" por defecto
  const [zonaFiltro, setZonaFiltro] = useState("Todas");
  const [calleFiltro, setCalleFiltro] = useState("Todas");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");

  // Estado de Alerta Institucional Reutilizable
  const [alerta, setAlerta] = useState({
    visible: false,
    tipo: "confirmar",
    titulo: "",
    mensaje: "",
    textoBotonConfirmar: "Entendido",
    textoBotonCancelar: "Cancelar",
    onConfirmar: null,
    onCancelar: null,
  });

  useFocusEffect(
    useCallback(() => {
      cargarBandeja();
    }, []),
  );

  useEffect(() => {
    const desuscribir = incidentesService.suscribirACambios(() => {
      cargarBandeja();
    });

    return () => {
      if (desuscribir) desuscribir();
    };
  }, []);

  async function cargarBandeja() {
    try {
      setCargando(true);
      setErrorConexion(false);
      const datos = await incidentesService.obtenerParaFeed();
      setIncidentes(Array.isArray(datos) ? datos : []);
    } catch (err) {
      console.error("Error al cargar bandeja admin:", err.message);
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

  const listaSegura = Array.isArray(incidentes) ? incidentes : [];

  // Filtrado compuesto: Zona + Calle + Categoría
  const incidentesFiltrados = listaSegura.filter((item) => {
    const coincideZona =
      zonaFiltro === "Todas" || item.zona_nombre === zonaFiltro;
    const coincideCalle =
      calleFiltro === "Todas" || item.calle_nombre === calleFiltro;
    const coincideCat =
      categoriaFiltro === "Todas" || item.categoria_nombre === categoriaFiltro;
    return coincideZona && coincideCalle && coincideCat;
  });

  const nuevos = listaSegura.filter((i) => i.estado === "en_revision").length;
  const enCurso = listaSegura.filter(
    (i) => i.estado === "realizando_trabajos",
  ).length;
  const hechos = listaSegura.filter((i) => i.estado === "hecho").length;

  const handlePresionarEliminar = (incidente) => {
    if (incidente.estado === "hecho") {
      setAlerta({
        visible: true,
        tipo: "confirmar",
        titulo: "¿Archivar Expediente?",
        mensaje: `El reporte "${incidente.titulo}" en ${incidente.calle_nombre} pasará a inactivo y se retirará del mapa ciudadano.`,
        textoBotonConfirmar: "Sí, Archivar",
        textoBotonCancelar: "Cancelar",
        onConfirmar: () => ejecutarArchivado(incidente.id),
        onCancelar: () => setAlerta((prev) => ({ ...prev, visible: false })),
      });
    } else {
      setAlerta({
        visible: true,
        tipo: "error",
        titulo: "Expediente no Concluido",
        mensaje: `Este reporte en ${incidente.calle_nombre} aún se encuentra en estado "${incidente.estado?.toUpperCase()}". Solo los expedientes resueltos pueden archivarse.`,
        textoBotonConfirmar: "Entendido",
        onConfirmar: () => setAlerta((prev) => ({ ...prev, visible: false })),
        onCancelar: null,
      });
    }
  };

  const ejecutarArchivado = async (incidenteId) => {
    try {
      await incidentesService.eliminar(incidenteId);
      setIncidentes((prev) => prev.filter((i) => i.id !== incidenteId));
      setAlerta({
        visible: true,
        tipo: "exito",
        titulo: "Expediente Archivado",
        mensaje: "El expediente ha sido retirado de la vista pública.",
        textoBotonConfirmar: "Aceptar",
        onConfirmar: () => setAlerta((prev) => ({ ...prev, visible: false })),
        onCancelar: null,
      });
    } catch (err) {
      setAlerta({
        visible: true,
        tipo: "error",
        titulo: "Fallo al archivar",
        mensaje: err.message || "No se pudo archivar el registro.",
        textoBotonConfirmar: "Cerrar",
        onConfirmar: () => setAlerta((prev) => ({ ...prev, visible: false })),
        onCancelar: null,
      });
    }
  };

  return (
    <View style={styles.container}>
      <HeaderInstitucional titulo="Bandeja de Incidentes" />

      {/* Métricas Operativas */}
      <View style={styles.statsContainer}>
        <View style={[styles.statBox, styles.statBoxAmber]}>
          <Text style={[styles.statNum, { color: "#D97706" }]}>{nuevos}</Text>
          <Text style={styles.statLabel}>Nuevos</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxBlue]}>
          <Text style={[styles.statNum, { color: "#2563EB" }]}>{enCurso}</Text>
          <Text style={styles.statLabel}>En Cuadrilla</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxGreen]}>
          <Text style={[styles.statNum, { color: "#059669" }]}>{hechos}</Text>
          <Text style={styles.statLabel}>Resueltos</Text>
        </View>
      </View>

      <FiltrosAcordeon
        zonaSeleccionada={zonaFiltro}
        calleSeleccionada={calleFiltro}
        categoriaSeleccionada={categoriaFiltro}
        onPressZona={(zona) => setZonaFiltro(zona)}
        onPressCalle={(calle) => setCalleFiltro(calle)}
        onPressCategoria={(cat) => setCategoriaFiltro(cat)}
      />

      <View style={styles.listHeaderRow}>
        <Text style={styles.listSubtitle}>
          EXPEDIENTES PENDIENTES DE RESOLUCIÓN
        </Text>
      </View>

      {cargando ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Sincronizando expedientes...</Text>
        </View>
      ) : errorConexion && listaSegura.length === 0 ? (
        <OfflineEmptyState
          titulo="Bandeja desconectada"
          mensaje="No es posible recuperar los expedientes del servidor municipal sin conexión a internet."
          onReintentar={cargarBandeja}
        />
      ) : (
        <FlatList
          data={incidentesFiltrados}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={cargarBandeja}
            />
          }
          renderItem={({ item, index }) => (
            <AdminIncidenteCard
              item={item}
              index={index}
              onDictaminar={(inc) =>
                navigation.navigate("GestionIncidente", { incidente: inc })
              }
              onEliminar={handlePresionarEliminar}
            />
          )}
        />
      )}

      {/* Alerta Institucional Unificada */}
      <CustomModalAlert
        visible={alerta.visible}
        tipo={alerta.tipo}
        titulo={alerta.titulo}
        mensaje={alerta.mensaje}
        textoBotonConfirmar={alerta.textoBotonConfirmar}
        textoBotonCancelar={alerta.textoBotonCancelar}
        onConfirmar={alerta.onConfirmar}
        onCancelar={alerta.onCancelar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  statsContainer: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    alignItems: "center",
    elevation: 1,
  },
  statBoxAmber: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
  statBoxBlue: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  statBoxGreen: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  statNum: { fontSize: 20, fontWeight: "900" },
  statLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    color: COLORS.textMuted,
    marginTop: 2,
    textTransform: "uppercase",
  },
  listHeaderRow: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 9.5,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.bottomInset || 20,
  },
});
