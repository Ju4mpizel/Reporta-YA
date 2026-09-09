// src/components/CustomTabBar.js
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPin, ClipboardList, Plus, User } from "lucide-react-native";
import { COLORS } from "../constants/theme";

export default function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { paddingBottom: insets.bottom > 0 ? insets.bottom + 6 : 14 },
      ]}
    >
      <View style={styles.barContainer}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const isAction = route.name === "Reportar";

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Botón "+" destacado central para registrar incidente
          if (isAction) {
            return (
              <View key={route.key} style={styles.navSlot}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={onPress}
                  style={styles.actionBox}
                >
                  <Plus size={22} color="#FFFFFF" strokeWidth={2.8} />
                </TouchableOpacity>
              </View>
            );
          }

          // Asignación precisa de iconos según las rutas actuales
          let Icon = ClipboardList;
          if (route.name === "Mapa") Icon = MapPin;
          if (route.name === "Incidentes") Icon = ClipboardList;
          if (route.name === "Perfil") Icon = User;

          return (
            <View key={route.key} style={styles.navSlot}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onPress}
                style={[styles.tabBox, isFocused && styles.tabBoxActive]}
              >
                <Icon
                  size={22}
                  color={isFocused ? COLORS.primary : "#94A3B8"}
                  strokeWidth={isFocused ? 2.4 : 1.9}
                />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  barContainer: {
    flexDirection: "row",
    width: "90%",
    maxWidth: 380,
    height: 64,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  navSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  tabBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  tabBoxActive: {
    backgroundColor: "#E0F2FE",
  },
});
