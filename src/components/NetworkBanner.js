// src/components/NetworkBanner.js
import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, View, Animated, Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { WifiOff, Wifi, CheckCircle2 } from "lucide-react-native";
import { commandQueueService } from "../services/CommandQueueService";

export default function NetworkBanner() {
  const [estadoRed, setEstadoRed] = useState({
    conectado: true,
    mensaje: "",
    tipo: "ok", // 'offline' | 'online' | 'sincronizado'
    visible: false,
  });

  const animTranslateY = useRef(new Animated.Value(-60)).current;
  const timeoutOcultar = useRef(null);

  const mostrarBanner = (tipo, mensaje, autoOcultar = true) => {
    if (timeoutOcultar.current) clearTimeout(timeoutOcultar.current);

    setEstadoRed({
      conectado: tipo !== "offline",
      mensaje,
      tipo,
      visible: true,
    });

    Animated.timing(animTranslateY, {
      toValue: 0,
      duration: 250,
      useNativeDriver: Platform.OS !== "web",
    }).start();

    if (autoOcultar) {
      timeoutOcultar.current = setTimeout(() => {
        Animated.timing(animTranslateY, {
          toValue: -60,
          duration: 250,
          useNativeDriver: Platform.OS !== "web",
        }).start(() => {
          setEstadoRed((prev) => ({ ...prev, visible: false }));
        });
      }, 3500);
    }
  };

  useEffect(() => {
    let primeraCarga = true;

    // 1. Escuchar cambios de conectividad
    const unsubscribeNet = NetInfo.addEventListener((state) => {
      const conectado = Boolean(
        state.isConnected && state.isInternetReachable !== false,
      );

      if (!conectado) {
        mostrarBanner(
          "offline",
          "Sin conexión a internet. Los reportes se guardarán en cola.",
          false,
        );
      } else if (!primeraCarga && conectado) {
        mostrarBanner("online", "Se recuperó la conexión a internet.");
        // Si recupera conexión, ejecuta la cola de comandos
        commandQueueService.procesarCola();
      }

      primeraCarga = false;
    });

    // 2. Escuchar cuando un comando pendiente se ejecuta con éxito
    const unsubscribeQueue = commandQueueService.suscribir((evento, data) => {
      if (evento === "COMANDO_EJECUTADO") {
        mostrarBanner(
          "sincronizado",
          `Se envió el reporte pendiente: "${data.titulo}"`,
        );
      }
    });

    return () => {
      unsubscribeNet();
      unsubscribeQueue();
      if (timeoutOcultar.current) clearTimeout(timeoutOcultar.current);
    };
  }, []);

  if (!estadoRed.visible) return null;

  const estiloFondo =
    estadoRed.tipo === "offline"
      ? styles.bgOffline
      : estadoRed.tipo === "online"
        ? styles.bgOnline
        : styles.bgSincronizado;

  return (
    <Animated.View
      style={[
        styles.bannerContainer,
        estiloFondo,
        { transform: [{ translateY: animTranslateY }] },
      ]}
    >
      <View style={styles.contentRow}>
        {estadoRed.tipo === "offline" ? (
          <WifiOff size={15} color="#FFFFFF" strokeWidth={2.4} />
        ) : estadoRed.tipo === "online" ? (
          <Wifi size={15} color="#FFFFFF" strokeWidth={2.4} />
        ) : (
          <CheckCircle2 size={15} color="#FFFFFF" strokeWidth={2.4} />
        )}
        <Text style={styles.bannerText} numberOfLines={2}>
          {estadoRed.mensaje}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: Platform.OS === "ios" ? 44 : 26,
    paddingBottom: 8,
    paddingHorizontal: 16,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  bgOffline: { backgroundColor: "#DC2626" },
  bgOnline: { backgroundColor: "#16A34A" },
  bgSincronizado: { backgroundColor: "#0284C7" },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  bannerText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "700",
  },
});
