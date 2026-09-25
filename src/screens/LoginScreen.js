// src/screens/LoginScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import {
  LogIn,
  FileText,
  Lock,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import CustomModalAlert from "../components/CustomModalAlert";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

const EXPEDICIONES = [
  { sigla: "CB", nombre: "Cochabamba" },
  { sigla: "LP", nombre: "La Paz" },
  { sigla: "SC", nombre: "Santa Cruz" },
  { sigla: "OR", nombre: "Oruro" },
  { sigla: "PT", nombre: "Potosí" },
  { sigla: "CH", nombre: "Chuquisaca" },
  { sigla: "TJ", nombre: "Tarija" },
  { sigla: "BE", nombre: "Beni" },
  { sigla: "PA", nombre: "Pando" },
];

export default function LoginScreen({ navigation }) {
  const { login, cargando } = useAuth();
  const [ciNumero, setCiNumero] = useState("");
  const [expedicion, setExpedicion] = useState("CB");
  const [menuExpedicionAbierto, setMenuExpedicionAbierto] = useState(false);
  const [password, setPassword] = useState("");

  const [alerta, setAlerta] = useState({
    visible: false,
    tipo: "error",
    titulo: "",
    mensaje: "",
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleBtn = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  }, []);

  const handleCiChange = (texto) => {
    const soloNumeros = texto.replace(/[^0-9]/g, "").slice(0, 8);
    setCiNumero(soloNumeros);
  };

  const handlePressIn = () => {
    Animated.spring(scaleBtn, {
      toValue: 0.96,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleBtn, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  const handleLogin = async () => {
    if (!ciNumero.trim() || !password.trim()) {
      setAlerta({
        visible: true,
        tipo: "error",
        titulo: "Campos Requeridos",
        mensaje:
          "Por favor ingresa tu número de cédula de identidad y tu contraseña de acceso.",
      });
      return;
    }

    const ciCompleto = `${ciNumero.trim()} ${expedicion}`;

    try {
      await login(ciCompleto, password);
    } catch (err) {
      setAlerta({
        visible: true,
        tipo: "error",
        titulo: "Acceso Denegado",
        mensaje:
          err.message || "Credenciales incorrectas o cuenta inhabilitada.",
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.cardWrapper,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Logo Principal de la Aplicación */}
          <View style={styles.brandContainer}>
            <Image
              source={require("../../assets/logo-reportaya.png")}
              style={styles.mainAppLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandTitle}>Reporta YA!</Text>
            <Text style={styles.brandSubtitle}>
              GESTIÓN CIUDADANA · DISTRITO 12
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Ingreso Ciudadano</Text>
            <Text style={styles.formDesc}>
              Accede con tu Cédula de Identidad para gestionar o reportar
              incidentes
            </Text>

            {/* Input compuesto de Cédula de Identidad con Selector */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Cédula de Identidad (CI)</Text>
                <Text style={styles.previewCiText}>
                  Ingresará como: {ciNumero || "••••••"} {expedicion}
                </Text>
              </View>

              <View style={styles.ciCompositeRow}>
                <View style={[styles.inputWrapper, styles.ciInputWrapper]}>
                  <FileText
                    size={16}
                    color={COLORS.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Número (ej: 9316163)"
                    placeholderTextColor={COLORS.textSubtle}
                    value={ciNumero}
                    onChangeText={handleCiChange}
                    keyboardType="numeric"
                    maxLength={8}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.expedicionTrigger,
                    menuExpedicionAbierto && styles.expedicionTriggerActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setMenuExpedicionAbierto((prev) => !prev)}
                >
                  <Text style={styles.expedicionTriggerText}>{expedicion}</Text>
                  {menuExpedicionAbierto ? (
                    <ChevronUp
                      size={14}
                      color={COLORS.primary}
                      strokeWidth={2.4}
                    />
                  ) : (
                    <ChevronDown
                      size={14}
                      color={COLORS.textDark}
                      strokeWidth={2.4}
                    />
                  )}
                </TouchableOpacity>
              </View>

              {/* Menú selector de departamentos emisores */}
              {menuExpedicionAbierto && (
                <View style={styles.dropdownDepartamentos}>
                  <Text style={styles.dropdownTitle}>Lugar de Expedición:</Text>
                  <View style={styles.gridExpediciones}>
                    {EXPEDICIONES.map((item) => {
                      const esSeleccionado = expedicion === item.sigla;
                      return (
                        <TouchableOpacity
                          key={item.sigla}
                          style={[
                            styles.chipExpedicion,
                            esSeleccionado && styles.chipExpedicionActive,
                          ]}
                          activeOpacity={0.7}
                          onPress={() => {
                            setExpedicion(item.sigla);
                            setMenuExpedicionAbierto(false);
                          }}
                        >
                          {esSeleccionado && (
                            <Check size={11} color="#FFFFFF" strokeWidth={3} />
                          )}
                          <Text
                            style={[
                              styles.chipExpedicionText,
                              esSeleccionado && styles.chipExpedicionTextActive,
                            ]}
                          >
                            {item.sigla} ({item.nombre})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Input de Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <View style={styles.inputWrapper}>
                <Lock
                  size={16}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textSubtle}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            {/* Botón de Ingreso */}
            <Animated.View style={{ transform: [{ scale: scaleBtn }] }}>
              <TouchableOpacity
                style={[styles.btnSubmit, cargando && styles.btnDisabled]}
                activeOpacity={0.9}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleLogin}
                disabled={cargando}
              >
                {cargando ? (
                  <ActivityIndicator color={COLORS.textWhite} />
                ) : (
                  <View style={styles.btnContent}>
                    <LogIn
                      size={16}
                      color={COLORS.textWhite}
                      strokeWidth={2.4}
                    />
                    <Text style={styles.btnSubmitText}>Ingresar al Portal</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.linkWrapper}
              onPress={() => navigation.navigate("Registro")}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>
                ¿No tienes cuenta?{" "}
                <Text style={styles.linkBold}>Regístrate aquí</Text>
              </Text>
            </TouchableOpacity>

            {/* Sello Institucional */}
            <View style={styles.cochaFooter}>
              <Image
                source={require("../../assets/logo-alcaldia.png")}
                style={styles.footerAlcaldiaImg}
                resizeMode="contain"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.footerAlcaldiaTitle}>
                  GOBIERNO AUTÓNOMO MUNICIPAL DE COCHABAMBA
                </Text>
                <Text style={styles.footerAlcaldiaSub}>
                  En coordinación con la Subalcaldía Cala Cala
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <CustomModalAlert
        visible={alerta.visible}
        tipo={alerta.tipo}
        titulo={alerta.titulo}
        mensaje={alerta.mensaje}
        onConfirmar={() => setAlerta((prev) => ({ ...prev, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.lg,
    paddingVertical: 30,
  },
  cardWrapper: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    elevation: 4,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  brandContainer: { alignItems: "center", marginBottom: SPACING.md },
  mainAppLogo: {
    width: 72,
    height: 72,
    marginBottom: 8,
  },
  brandTitle: { fontSize: 24, fontWeight: "900", color: COLORS.textDark },
  brandSubtitle: {
    fontSize: 9.5,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 1,
    marginTop: 2,
  },
  formContainer: { marginTop: SPACING.xs },
  formTitle: { fontSize: 17, fontWeight: "800", color: COLORS.textDark },
  formDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
    marginTop: 2,
    lineHeight: 17,
  },
  inputGroup: { marginBottom: SPACING.md },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  previewCiText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
  },
  ciCompositeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ciInputWrapper: {
    flex: 1,
  },
  expedicionTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 42,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: "#F8FAFC",
  },
  expedicionTriggerActive: {
    borderColor: COLORS.primary,
    backgroundColor: "#F0F9FF",
  },
  expedicionTriggerText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  dropdownDepartamentos: {
    marginTop: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
  },
  dropdownTitle: {
    fontSize: 9.5,
    fontWeight: "800",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  gridExpediciones: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chipExpedicion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  chipExpedicionActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  chipExpedicionText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textDark,
  },
  chipExpedicionTextActive: {
    color: "#FFFFFF",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: SPACING.sm,
  },
  inputIcon: { marginRight: 6 },
  input: { flex: 1, paddingVertical: 10, fontSize: 13, color: COLORS.textDark },
  btnSubmit: {
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnSubmitText: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  linkWrapper: { marginTop: SPACING.md, alignItems: "center" },
  linkText: { fontSize: 12, color: COLORS.textMuted },
  linkBold: {
    fontWeight: "800",
    color: COLORS.primary,
    textDecorationLine: "underline",
  },
  cochaFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  footerAlcaldiaImg: {
    width: 60,
    height: 26,
  },
  footerAlcaldiaTitle: {
    fontSize: 8.5,
    fontWeight: "900",
    color: COLORS.textDark,
    letterSpacing: 0.3,
  },
  footerAlcaldiaSub: {
    fontSize: 8,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
});
