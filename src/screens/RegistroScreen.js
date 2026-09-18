// src/screens/RegistroScreen.js
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
import {
  UserPlus,
  User,
  FileText,
  Phone,
  Lock,
  ArrowLeft,
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

export default function RegistroScreen({ navigation }) {
  const { registrar, cargando } = useAuth();

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [ci, setCi] = useState("");
  const [telefono, setTelefono] = useState("");
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

  const handleRegistro = async () => {
    if (
      !nombreCompleto.trim() ||
      !ci.trim() ||
      !telefono.trim() ||
      !password.trim()
    ) {
      Alert.alert(
        "Campos incompletos",
        "Por favor completa todos los campos del formulario.",
      );
      return;
    }

    try {
      await registrar({
        ci,
        nombreCompleto,
        telefono,
        password,
      });

      Alert.alert("¡Registro Exitoso!", "Bienvenido a Reporta YA!");
    } catch (err) {
      Alert.alert("Error al registrar", err.message);
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
          <TouchableOpacity
            style={styles.btnBack}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color={COLORS.textDark} />
            <Text style={styles.btnBackText}>Volver</Text>
          </TouchableOpacity>

          <Text style={styles.formTitle}>Registro de Vecino</Text>
          <Text style={styles.formDesc}>
            Completa tus datos para crear tu cuenta en Cala Cala
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre Completo</Text>
            <View style={styles.inputWrapper}>
              <User
                size={16}
                color={COLORS.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Ej: Marcelo Quiroga"
                placeholderTextColor={COLORS.textSubtle}
                value={nombreCompleto}
                onChangeText={setNombreCompleto}
              />
            </View>
          </View>

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
            <Text style={styles.inputLabel}>Teléfono / Celular</Text>
            <View style={styles.inputWrapper}>
              <Phone
                size={16}
                color={COLORS.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Ej: 70712345"
                placeholderTextColor={COLORS.textSubtle}
                keyboardType="phone-pad"
                value={telefono}
                onChangeText={setTelefono}
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
                placeholder="Crea una contraseña"
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
              onPress={handleRegistro}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color={COLORS.textWhite} />
              ) : (
                <View style={styles.btnContent}>
                  <UserPlus
                    size={16}
                    color={COLORS.textWhite}
                    strokeWidth={2.4}
                  />
                  <Text style={styles.btnSubmitText}>Registrar Cuenta</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
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
  btnBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: SPACING.md,
    alignSelf: "flex-start",
  },
  btnBackText: { fontSize: 12, fontWeight: "700", color: COLORS.textDark },
  formTitle: { fontSize: 20, fontWeight: "900", color: COLORS.textDark },
  formDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
    marginTop: 2,
  },
  inputGroup: { marginBottom: SPACING.sm },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 3,
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
  input: { flex: 1, paddingVertical: 9, fontSize: 13, color: COLORS.textDark },
  btnSubmit: {
    backgroundColor: COLORS.textDark,
    paddingVertical: 13,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    marginTop: SPACING.md,
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
});
