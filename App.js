// App.js
import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import NetworkBanner from "./src/components/NetworkBanner";
import { commandQueueService } from "./src/services/CommandQueueService";

export default function App() {
  useEffect(() => {
    // Al abrir la app, si hay red, intentamos vaciar la cola por si quedaron reportes previos
    commandQueueService.procesarCola();

    // Listener global de reconexión
    const desuscribirNet = NetInfo.addEventListener((state) => {
      const hayInternet = Boolean(
        state.isConnected && state.isInternetReachable !== false,
      );

      if (hayInternet) {
        // En cuanto detecta internet, despacha los comandos pendientes en segundo plano
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
