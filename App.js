// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import NuevoIncidenteScreen from "./src/screens/NuevoIncidenteScreen";
import MapaScreen from "./src/screens/MapaScreen";
import IncidenteScreen from "./src/screens/IncidenteScreen";
import PerfilScreen from "./src/screens/PerfilScreen";
import CustomTabBar from "./src/components/CustomTabBar";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Tab.Navigator
          initialRouteName="Incidentes"
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tab.Screen name="Reportar" component={NuevoIncidenteScreen} />
          <Tab.Screen name="Mapa" component={MapaScreen} />
          <Tab.Screen name="Incidentes" component={IncidenteScreen} />
          <Tab.Screen name="Perfil" component={PerfilScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
