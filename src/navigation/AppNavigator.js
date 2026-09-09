// src/navigation/AppNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavigator from "./TabNavigator";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Pestañas principales de la app */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      {/* Aquí entrarán las pantallas de Login / Registro de Auth */}
    </Stack.Navigator>
  );
}
