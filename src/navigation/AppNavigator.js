// src/navigation/AppNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import TabNavigator from "./TabNavigator";
import LoginScreen from "../screens/LoginScreen";
import RegistroScreen from "../screens/RegistroScreen";
import GestionIncidenteScreen from "../screens/GestionIncidenteScreen";
import { COLORS } from "../constants/theme";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { estaAutenticado, cargando } = useAuth();

  if (cargando) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {estaAutenticado ? (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          {/* Pantalla 2 de gestión para el administrador */}
          <Stack.Screen
            name="GestionIncidente"
            component={GestionIncidenteScreen}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Registro" component={RegistroScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
