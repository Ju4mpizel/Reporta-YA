// App.js
import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import NetworkBanner from "./src/components/feedback/NetworkBanner";
import { commandQueueService } from "./src/services/CommandQueueService";
import { catalogoService } from "./src/services/catalogoService";

export default function App() {
  useEffect(() => {
    // 1. Al abrir la app, intentamos precargar el catálogo en local y vaciar reportes en cola
    catalogoService.precargarCatalogoCompleto();
    commandQueueService.procesarCola();

    // 2. Listener global de reconexión
    const desuscribirNet = NetInfo.addEventListener((state) => {
      const hayInternet = Boolean(
        state.isConnected && state.isInternetReachable !== false,
      );

      if (hayInternet) {
        // Al recuperar internet, actualiza la caché local del catastro y despacha la cola
        catalogoService.precargarCatalogoCompleto();
        commandQueueService.procesarCola();
      }
    });

    return () => desuscribirNet();
  }, []);

  return (
    <SafeAreaProvider>
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
