// src/navigation/TabNavigator.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import NuevoIncidenteScreen from "../screens/NuevoIncidenteScreen";
import MapaScreen from "../screens/MapaScreen";
import IncidenteScreen from "../screens/IncidenteScreen";
import PerfilScreen from "../screens/PerfilScreen";
import CustomTabBar from "../components/CustomTabBar";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
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
  );
}
