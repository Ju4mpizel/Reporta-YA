// src/components/NetworkBanner.js
import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, Animated, View, Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { WifiOff, Wifi, CheckCircle2 } from "lucide-react-native";
import { commandQueueService } from "../services/CommandQueueService";

export default function NetworkBanner() {
  const [estadoBanner, setEstadoBanner] = useState({
    tipo: "online", // "online" | "offline" | "sincronizado"
    visible: false,
    mensaje: "",
  });

  const estabaDesconectadoRef = useRef(false);
  const animY = useRef(new Animated.Value(-70)).current;
  const timeoutOcultarRef = useRef(null);

  const mostrarAviso = (tipo, mensaje, autoOcultarSegundos = null) => {
    if (timeoutOcultarRef.current) clearTimeout(timeoutOcultarRef.current);

    setEstadoBanner({ tipo, visible: true, mensaje });

    Animated.timing(animY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: Platform.OS !== "web",
    }).start();

    if (autoOcultarSegundos) {
      timeoutOcultarRef.current = setTimeout(() => {
        ocultarAviso();
      }, autoOcultarSegundos * 1000);
    }
  };

  const ocultarAviso = () => {
    Animated.timing(animY, {
      toValue: -70,
      duration: 300,
      useNativeDriver: Platform.OS !== "web",
    }).start(() => {
      setEstadoBanner((prev) => ({ ...prev, visible: false }));
    });
  };

  useEffect(() => {
    const evaluarConexion = (conectado) => {
      if (!conectado) {
        estabaDesconectadoRef.current = true;
        mostrarAviso(
          "offline",
          "Sin conexión a internet. Modo fuera de línea.",
        );
      } else if (conectado && estabaDesconectadoRef.current) {
        estabaDesconectadoRef.current = false;
        mostrarAviso("online", "Se restableció la conexión a internet.", 3);
        commandQueueService.procesarCola().catch(() => {});
      }
    };

    const handleWebOffline = () => evaluarConexion(false);
    const handleWebOnline = () => evaluarConexion(true);

    // 1. Escucha en Web (Eventos estándar del navegador con referencias estables)
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.addEventListener("offline", handleWebOffline);
      window.addEventListener("online", handleWebOnline);

      if (navigator.onLine === false) {
        evaluarConexion(false);
      }
    }

    // 2. Escucha nativa / NetInfo
    const desuscribirNet = NetInfo.addEventListener((state) => {
      const haySalida = Boolean(
        state.isConnected && state.isInternetReachable !== false,
      );
      evaluarConexion(haySalida);
    });

    // 3. Notificación reactiva al sincronizar comandos pendientes
    const desuscribirQueue = commandQueueService.suscribir((evento, datos) => {
      if (evento === "COMANDO_EJECUTADO") {
        const esDictamen =
          datos.tipo === "DICTAMINAR_INCIDENTE" ||
          Boolean(datos.nota_alcaldia !== undefined);
        const mensaje = esDictamen
          ? `Expediente actualizado: "${datos.titulo || "Dictamen municipal"}"`
          : `Reporte sincronizado: "${datos.titulo || "Incidente"}"`;

        mostrarAviso("sincronizado", mensaje, 4);
      }
    });

    return () => {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.removeEventListener("offline", handleWebOffline);
        window.removeEventListener("online", handleWebOnline);
      }
      desuscribirNet();
      desuscribirQueue();
      if (timeoutOcultarRef.current) clearTimeout(timeoutOcultarRef.current);
    };
  }, []);

  if (!estadoBanner.visible) return null;

  const esOffline = estadoBanner.tipo === "offline";
  const esSincronizado = estadoBanner.tipo === "sincronizado";

  return (
    <Animated.View
      style={[
        styles.banner,
        esOffline
          ? styles.bannerOffline
          : esSincronizado
            ? styles.bannerSincronizado
            : styles.bannerOnline,
        { transform: [{ translateY: animY }] },
      ]}
    >
      <View style={styles.contenido}>
        {esOffline ? (
          <WifiOff size={16} color="#FFFFFF" strokeWidth={2.5} />
        ) : esSincronizado ? (
          <CheckCircle2 size={16} color="#FFFFFF" strokeWidth={2.5} />
        ) : (
          <Wifi size={16} color="#FFFFFF" strokeWidth={2.5} />
        )}
        <Text style={styles.texto} numberOfLines={1}>
          {estadoBanner.mensaje}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    elevation: 10,
  },
  bannerOffline: {
    backgroundColor: "#DC2626",
  },
  bannerOnline: {
    backgroundColor: "#16A34A",
  },
  bannerSincronizado: {
    backgroundColor: "#0284C7",
  },
  contenido: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  texto: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
