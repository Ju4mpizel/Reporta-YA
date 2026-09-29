// App.js
import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import * as SplashScreen from "expo-splash-screen";

import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import NetworkBanner from "./src/components/feedback/NetworkBanner";
import { commandQueueService } from "./src/services/CommandQueueService";
import { catalogoService } from "./src/services/catalogoService";

// Evita que el splash screen se oculte automáticamente al iniciar
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [appLista, setAppLista] = useState(false);

  useEffect(() => {
    async function inicializarApp() {
      try {
        // 1. Precarga catálogo en local y vacía la cola de reportes offline
        await catalogoService.precargarCatalogoCompleto();
        await commandQueueService.procesarCola();

        // 2. Retardo de 1.5 segundos para mostrar el logo institucional en el splash
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (e) {
        console.warn("Aviso durante inicialización:", e);
      } finally {
        setAppLista(true);
      }
    }

    inicializarApp();

    // 2. Listener global de reconexión física de red
    const desuscribirNet = NetInfo.addEventListener((state) => {
      const hayInternet = Boolean(
        state.isConnected && state.isInternetReachable !== false,
      );

      if (hayInternet) {
        catalogoService.precargarCatalogoCompleto();
        commandQueueService.procesarCola();
      }
    });

    return () => desuscribirNet();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appLista) {
      // Oculta el splash screen de manera fluida una vez que la vista raíz monta
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [appLista]);

  if (!appLista) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <View style={styles.container}>
            {/* Banner global de estado de red y comandos ejecutados */}
            <NetworkBanner />
            <AppNavigator />
          </View>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
