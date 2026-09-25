// src/screens/LoginScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
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
import { LogIn, Lock } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import CustomModalAlert from "../components/feedback/CustomModalAlert";
import CiInputGroup from "../components/auth/CiInputGroup";
import { styles } from "../styles/auth.styles";
import { COLORS } from "../constants/theme";

export default function LoginScreen({ navigation }) {
  const { login, cargando } = useAuth();
  const [ciNumero, setCiNumero] = useState("");
  const [expedicion, setExpedicion] = useState("CB");
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
    if (!ciNumero.trim()) {
      setAlerta({
        visible: true,
        tipo: "error",
        titulo: "Cédula Requerida",
        mensaje: "Por favor ingresa tu número de cédula de identidad.",
      });
      return;
    }

    if (!password.trim()) {
      setAlerta({
        visible: true,
        tipo: "error",
        titulo: "Contraseña Requerida",
        mensaje: "Por favor ingresa tu contraseña de acceso.",
      });
      return;
    }

    const ciCompleto = `${ciNumero.trim()} ${expedicion}`;

    try {
      await login(ciCompleto, password);
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("CI_NO_ENCONTRADO")) {
        setAlerta({
          visible: true,
          tipo: "error",
          titulo: "Cédula no Registrada",
          mensaje: `El documento ${ciCompleto} no se encuentra registrado en el sistema.`,
        });
      } else if (msg.includes("PASSWORD_INCORRECTO")) {
        setAlerta({
          visible: true,
          tipo: "error",
          titulo: "Contraseña Incorrecta",
          mensaje:
            "La contraseña ingresada no coincide con el registro de este carnet.",
        });
      } else if (msg.includes("CUENTA_INHABILITADA")) {
        setAlerta({
          visible: true,
          tipo: "error",
          titulo: "Cuenta Inhabilitada",
          mensaje:
            "Tu cuenta ha sido temporalmente inhabilitada por la administración.",
        });
      } else {
        setAlerta({
          visible: true,
          tipo: "error",
          titulo: "Acceso Denegado",
          mensaje: msg || "No fue posible verificar tus credenciales.",
        });
      }
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
          {/* Logo Principal */}
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

            {/* Input compuesto modular de CI */}
            <CiInputGroup
              ciNumero={ciNumero}
              onChangeCi={handleCiChange}
              expedicion={expedicion}
              onChangeExpedicion={setExpedicion}
              etiquetaPrevia="Ingresará como"
            />

            {/* Contraseña */}
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
