// src/components/CustomTabBar.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MapPin,
  ClipboardList,
  Plus,
  User,
  ShieldAlert,
} from "lucide-react-native";
import { COLORS } from "../../constants/theme";

export default function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  // Guardamos las coordenadas X exactas de cada icono
  const [posicionesX, setPosicionesX] = useState({});
  const containerBarraRef = useRef(null);

  // Valor animado horizontal que desliza la pastilla
  const translateXAnim = useRef(new Animated.Value(0)).current;

  // Animar hacia la posición exacta del icono seleccionado
  useEffect(() => {
    const destinoX = posicionesX[state.index];
    if (destinoX !== undefined) {
      Animated.spring(translateXAnim, {
        toValue: destinoX,
        friction: 7,
        tension: 90,
        useNativeDriver: Platform.OS !== "web",
      }).start();
    }
  }, [state.index, posicionesX]);

  // Si se selecciona el botón de acción (+), ocultamos la pastilla
  const esBotonReportar = state.routes[state.index]?.name === "Reportar";

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: insets.bottom > 0 ? insets.bottom : 10 },
      ]}
    >
      <View style={styles.barContainer} ref={containerBarraRef}>
        {/* Pastilla indicadora animada que se desliza concéntricamente */}
        {!esBotonReportar && posicionesX[state.index] !== undefined && (
          <Animated.View
            style={[
              styles.activeIndicator,
              {
                transform: [{ translateX: translateXAnim }],
              },
            ]}
          >
            <View style={styles.activePillShape} />
          </Animated.View>
        )}

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

          let Icon = ClipboardList;
          if (route.name === "Mapa") Icon = MapPin;
          if (route.name === "Incidentes") Icon = ClipboardList;
          if (route.name === "Perfil") Icon = User;
          if (route.name === "Panel" || route.name === "Admin")
            Icon = ShieldAlert;

          return (
            <View key={route.key} style={styles.navSlot}>
              {isAction ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={onPress}
                  style={styles.actionBox}
                >
                  <Plus size={22} color="#FFFFFF" strokeWidth={2.8} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onPress}
                  style={styles.iconContainer}
                  onLayout={(e) => {
                    // Obtenemos las coordenadas directas del botón donde vive el icono
                    if (containerBarraRef.current && e.target) {
                      e.target.measureLayout(
                        containerBarraRef.current,
                        (left) => {
                          setPosicionesX((prev) => ({
                            ...prev,
                            [index]: left,
                          }));
                        },
                        () => {},
                      );
                    }
                  }}
                >
                  <View style={styles.svgWrapper}>
                    <Icon
                      size={22}
                      color={isFocused ? COLORS.primary : "#94A3B8"}
                      strokeWidth={isFocused ? 2.5 : 1.9}
                    />
                  </View>
                </TouchableOpacity>
              )}
            </View>
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
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 44,
    height: "100%",
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
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  // Contenedor estricto para asegurar centrado óptico del SVG
  svgWrapper: {
    width: 24,
    height: 24,
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
