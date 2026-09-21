// src/components/CustomTabBar.js
import React, { useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MapPin,
  ClipboardList,
  Plus,
  User,
  ShieldAlert,
} from "lucide-react-native";
import { COLORS } from "../constants/theme";

export default function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const totalTabs = state.routes.length;

  // Valor animado que interpola la posición horizontal de la pastilla activa
  const animIndex = useRef(new Animated.Value(state.index)).current;

  useEffect(() => {
    Animated.spring(animIndex, {
      toValue: state.index,
      friction: 6,
      tension: 90,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [state.index]);

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: insets.bottom > 0 ? insets.bottom : 10 },
      ]}
    >
      <View style={styles.barContainer}>
        {/* Pastilla indicadora activa deslizante */}
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              width: `${100 / totalTabs}%`,
              transform: [
                {
                  translateX: animIndex.interpolate({
                    inputRange: state.routes.map((_, i) => i),
                    outputRange: state.routes.map(
                      (_, i) => (i * 350) / totalTabs, // Se autoajusta proporcionalmente
                    ),
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.activePillShape} />
        </Animated.View>

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

          let Icon = ClipboardList;
          if (route.name === "Mapa") Icon = MapPin;
          if (route.name === "Incidentes") Icon = ClipboardList;
          if (route.name === "Perfil") Icon = User;
          if (route.name === "Panel" || route.name === "Admin")
            Icon = ShieldAlert;

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.7}
              onPress={onPress}
              style={styles.navSlot}
            >
              <View style={styles.iconContainer}>
                <Icon
                  size={21}
                  color={isFocused ? COLORS.primary : "#94A3B8"}
                  strokeWidth={isFocused ? 2.6 : 1.9}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
  },
  barContainer: {
    position: "relative",
    flexDirection: "row",
    width: "90%",
    maxWidth: 390,
    height: 62,
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
    overflow: "hidden",
  },
  activeIndicator: {
    position: "absolute",
    height: "100%",
    top: 0,
    left: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
  },
  activePillShape: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#E0F2FE",
  },
  navSlot: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  iconContainer: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
});
