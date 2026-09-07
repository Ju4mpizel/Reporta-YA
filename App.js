// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import NuevoReporteScreen from "./src/screens/NuevoReporteScreen";
import MapaScreen from "./src/screens/MapaScreen";
import ReportesScreen from "./src/screens/ReportesScreen";
import PerfilScreen from "./src/screens/PerfilScreen";
import CustomTabBar from "./src/components/CustomTabBar";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Tab.Navigator
          initialRouteName="Reportes"
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tab.Screen name="Reportar" component={NuevoReporteScreen} />
          <Tab.Screen name="Mapa" component={MapaScreen} />
          <Tab.Screen name="Reportes" component={ReportesScreen} />
          <Tab.Screen name="Perfil" component={PerfilScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
