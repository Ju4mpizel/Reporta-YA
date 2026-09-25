// src/navigation/TabNavigator.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import CustomTabBar from "../components/CustomTabBar";
import { useAuth } from "../context/AuthContext";

import NuevoIncidenteScreen from "../screens/NuevoIncidenteScreen";
import MapaScreen from "../screens/MapaScreen";
import IncidenteScreen from "../screens/IncidenteScreen";
import PerfilScreen from "../screens/PerfilScreen";
import AdminPanelScreen from "../screens/AdminPanelScreen";
import { COLORS } from "../constants/theme";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { esAdmin } = useAuth();

  return (
    <Tab.Navigator
      initialRouteName="Mapa"
      tabBar={(props) => <CustomTabBar {...props} />}
      detachInactiveScreens={true}
      screenOptions={{
        headerShown: false,
        animation: "none", // Elimina la superposición translúcida de sombras entre pestañas
        sceneStyle: {
          backgroundColor: COLORS.background || "#F8FAFC", // Evita transparencias fantasma
        },
      }}
    >
      <Tab.Screen name="Reportar" component={NuevoIncidenteScreen} />
      <Tab.Screen name="Mapa" component={MapaScreen} />
      <Tab.Screen name="Incidentes" component={IncidenteScreen} />
      {esAdmin && <Tab.Screen name="Panel" component={AdminPanelScreen} />}
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}
