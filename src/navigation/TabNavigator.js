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

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { esAdmin } = useAuth();

  return (
    <Tab.Navigator
      initialRouteName="Incidentes"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Reportar" component={NuevoIncidenteScreen} />
      <Tab.Screen name="Mapa" component={MapaScreen} />
      <Tab.Screen name="Incidentes" component={IncidenteScreen} />
      {/* Si el usuario es Administrador (Ing. Carlos Mendoza), se agrega la 5ta pestaña */}
      {esAdmin && <Tab.Screen name="Panel" component={AdminPanelScreen} />}
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}
