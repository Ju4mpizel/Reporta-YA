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
  Alert,
} from "react-native";
import { LogIn, FileText, Lock, ShieldCheck } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

export default function LoginScreen({ navigation }) {
  const { login, cargando } = useAuth();
  const [ci, setCi] = useState("");
  const [password, setPassword] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleBtn = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleBtn, { toValue: 0.96, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleBtn, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleLogin = async () => {
    if (!ci.trim() || !password.trim()) {
      Alert.alert("Campos requeridos", "Ingresa tu CI y contraseña.");
      return;
    }

    try {
      await login(ci, password);
    } catch (err) {
      Alert.alert("Acceso denegado", err.message);
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
          <View style={styles.brandContainer}>
            <View style={styles.iconCircle}>
              <ShieldCheck size={36} color={COLORS.primary} strokeWidth={2.4} />
            </View>
            <Text style={styles.brandTitle}>Reporta YA!</Text>
            <Text style={styles.brandSubtitle}>Cala Cala · Cochabamba</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Ingreso al Sistema</Text>
            <Text style={styles.formDesc}>
              Accede con tu documento de identidad y contraseña
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cédula de Identidad (CI)</Text>
              <View style={styles.inputWrapper}>
                <FileText
                  size={16}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 7894561 CB"
                  placeholderTextColor={COLORS.textSubtle}
                  value={ci}
                  onChangeText={setCi}
                  autoCapitalize="none"
                />
              </View>
            </View>

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
                    <Text style={styles.btnSubmitText}>Iniciar Sesión</Text>
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
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.lg,
    paddingVertical: 40,
  },
  cardWrapper: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.textDark,
    padding: SPACING.xl,
    elevation: 4,
  },
  brandContainer: { alignItems: "center", marginBottom: SPACING.lg },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
  },
  brandTitle: { fontSize: 22, fontWeight: "900", color: COLORS.textDark },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 1,
  },
  formContainer: { marginTop: SPACING.xs },
  formTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textDark },
  formDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
    marginTop: 2,
  },
  inputGroup: { marginBottom: SPACING.md },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.textDark,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
  },
  inputIcon: { marginRight: 6 },
  input: { flex: 1, paddingVertical: 10, fontSize: 13, color: COLORS.textDark },
  btnSubmit: {
    backgroundColor: COLORS.textDark,
    paddingVertical: 13,
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
  linkWrapper: { marginTop: SPACING.lg, alignItems: "center" },
  linkText: { fontSize: 12, color: COLORS.textMuted },
  linkBold: {
    fontWeight: "800",
    color: COLORS.textDark,
    textDecorationLine: "underline",
  },
});
