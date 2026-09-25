// src/screens/RegistroScreen.js
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
} from "react-native";
import {
  UserPlus,
  User,
  Phone,
  Lock,
  ArrowLeft,
  AlertCircle,
} from "lucide-react-native";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import CustomModalAlert from "../components/feedback/CustomModalAlert";
import CiInputGroup from "../components/auth/CiInputGroup";
import { styles } from "../styles/auth.styles";
import { COLORS } from "../constants/theme";

export default function RegistroScreen({ navigation }) {
  const { registrar, cargando } = useAuth();

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [ciNumero, setCiNumero] = useState("");
  const [expedicion, setExpedicion] = useState("CB");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");

  const [errores, setErrores] = useState({});
  const [verificandoCI, setVerificandoCI] = useState(false);

  const [alerta, setAlerta] = useState({
    visible: false,
    tipo: "error",
    titulo: "",
    mensaje: "",
    onConfirmar: null,
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

  const handleNombreChange = (texto) => {
    const filtrado = texto.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
    setNombreCompleto(filtrado);
    if (errores.nombre) setErrores((prev) => ({ ...prev, nombre: null }));
  };

  const handleCiChange = (texto) => {
    const soloNumeros = texto.replace(/[^0-9]/g, "").slice(0, 8);
    setCiNumero(soloNumeros);
    if (errores.ci) setErrores((prev) => ({ ...prev, ci: null }));
  };

  const handleTelefonoChange = (texto) => {
    const soloNumeros = texto.replace(/[^0-9]/g, "").slice(0, 8);
    setTelefono(soloNumeros);
    if (errores.telefono) setErrores((prev) => ({ ...prev, telefono: null }));
  };

  const handlePasswordChange = (texto) => {
    setPassword(texto);
    if (errores.password) setErrores((prev) => ({ ...prev, password: null }));
  };

  const validarFormulario = () => {
    const nuevosErrores = {};
    const nombreLimpio = nombreCompleto.trim();

    if (!nombreLimpio) {
      nuevosErrores.nombre = "El nombre es obligatorio.";
    } else if (nombreLimpio.split(/\s+/).length < 2) {
      nuevosErrores.nombre = "Ingresa tu nombre y al menos un apellido.";
    } else if (nombreLimpio.length < 5) {
      nuevosErrores.nombre = "El nombre es demasiado corto.";
    }

    if (!ciNumero) {
      nuevosErrores.ci = "El número de CI es obligatorio.";
    } else if (ciNumero.length < 5 || ciNumero.length > 8) {
      nuevosErrores.ci = "El número debe contener entre 5 y 8 dígitos.";
    }

    if (!telefono) {
      nuevosErrores.telefono = "El número telefónico es obligatorio.";
    } else if (telefono.length !== 8) {
      nuevosErrores.telefono = "Debe tener 8 dígitos exactos.";
    } else if (!["6", "7"].includes(telefono[0])) {
      nuevosErrores.telefono = "Debe iniciar con 6 o 7 (número móvil válido).";
    }

    if (!password) {
      nuevosErrores.password = "La contraseña es obligatoria.";
    } else if (password.length < 6) {
      nuevosErrores.password =
        "La contraseña debe tener al menos 6 caracteres.";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const verificarCiExistente = async (ciCompleto) => {
    try {
      setVerificandoCI(true);
      const { data, error } = await supabase.rpc("verificar_ci_existe", {
        p_ci: ciCompleto.trim(),
      });
      if (error) throw error;
      return Boolean(data);
    } catch {
      return false;
    } finally {
      setVerificandoCI(false);
    }
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

  const handleRegistro = async () => {
    if (!validarFormulario()) {
      setAlerta({
        visible: true,
        tipo: "error",
        titulo: "Formulario Incompleto",
        mensaje: "Revisa los campos señalados en rojo antes de continuar.",
      });
      return;
    }

    const ciCompleto = `${ciNumero.trim()} ${expedicion}`;

    const yaExiste = await verificarCiExistente(ciCompleto);
    if (yaExiste) {
      setErrores((prev) => ({
        ...prev,
        ci: "Este carnet de identidad ya se encuentra registrado.",
      }));
      setAlerta({
        visible: true,
        tipo: "error",
        titulo: "Carnet ya Empadronado",
        mensaje: `El documento ${ciCompleto} ya cuenta con una cuenta activa.`,
      });
      return;
    }

    try {
      await registrar({
        ci: ciCompleto,
        nombreCompleto: nombreCompleto.trim().replace(/\s+/g, " "),
        telefono: telefono.trim(),
        password,
      });

      setAlerta({
        visible: true,
        tipo: "exito",
        titulo: "¡Registro Exitoso!",
        mensaje: `Tu cuenta con CI ${ciCompleto} ha sido empadronada correctamente en el Distrito 12.`,
        onConfirmar: () => navigation.navigate("Login"),
      });
    } catch (err) {
      setAlerta({
        visible: true,
        tipo: "error",
        titulo: "Error en el Registro",
        mensaje:
          err.message || "Ocurrió un error al procesar el empadronamiento.",
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
          <TouchableOpacity
            style={styles.btnBack}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color={COLORS.primary} />
            <Text style={styles.btnBackText}>Volver al Acceso</Text>
          </TouchableOpacity>

          <Text style={styles.formTitle}>Registro Ciudadano</Text>
          <Text style={styles.formDesc}>
            Empadronamiento digital para el Distrito 12 (Cala Cala)
          </Text>

          {/* Nombre Completo */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre Completo</Text>
            <View
              style={[
                styles.inputWrapper,
                errores.nombre && styles.inputWrapperError,
              ]}
            >
              <User
                size={16}
                color={errores.nombre ? "#DC2626" : COLORS.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Ej: Marcelo Quiroga Santa Cruz"
                placeholderTextColor={COLORS.textSubtle}
                value={nombreCompleto}
                onChangeText={handleNombreChange}
                maxLength={70}
                autoCapitalize="words"
              />
            </View>
            {errores.nombre && (
              <View style={styles.errorRow}>
                <AlertCircle size={11} color="#DC2626" />
                <Text style={styles.errorText}>{errores.nombre}</Text>
              </View>
            )}
          </View>

          {/* Cédula modular */}
          <CiInputGroup
            ciNumero={ciNumero}
            onChangeCi={handleCiChange}
            expedicion={expedicion}
            onChangeExpedicion={setExpedicion}
            error={errores.ci}
            helperText="Ingresa tus dígitos y selecciona el departamento emisor."
            etiquetaPrevia="Registrará"
          />

          {/* Teléfono */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Teléfono Celular</Text>
              <Text style={styles.counterText}>
                {telefono.length}/8 dígitos
              </Text>
            </View>
            <View
              style={[
                styles.inputWrapper,
                errores.telefono && styles.inputWrapperError,
              ]}
            >
              <Phone
                size={16}
                color={errores.telefono ? "#DC2626" : COLORS.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Ej: 70712345"
                placeholderTextColor={COLORS.textSubtle}
                keyboardType="numeric"
                value={telefono}
                onChangeText={handleTelefonoChange}
                maxLength={8}
              />
            </View>
            {errores.telefono && (
              <View style={styles.errorRow}>
                <AlertCircle size={11} color="#DC2626" />
                <Text style={styles.errorText}>{errores.telefono}</Text>
              </View>
            )}
          </View>

          {/* Contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contraseña de Acceso</Text>
            <View
              style={[
                styles.inputWrapper,
                errores.password && styles.inputWrapperError,
              ]}
            >
              <Lock
                size={16}
                color={errores.password ? "#DC2626" : COLORS.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={COLORS.textSubtle}
                secureTextEntry
                value={password}
                onChangeText={handlePasswordChange}
              />
            </View>
            {errores.password && (
              <View style={styles.errorRow}>
                <AlertCircle size={11} color="#DC2626" />
                <Text style={styles.errorText}>{errores.password}</Text>
              </View>
            )}
          </View>

          {/* Botón Principal */}
          <Animated.View style={{ transform: [{ scale: scaleBtn }] }}>
            <TouchableOpacity
              style={[
                styles.btnSubmit,
                (cargando || verificandoCI) && styles.btnDisabled,
              ]}
              activeOpacity={0.9}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handleRegistro}
              disabled={cargando || verificandoCI}
            >
              {cargando || verificandoCI ? (
                <View style={styles.btnContent}>
                  <ActivityIndicator color={COLORS.textWhite} size="small" />
                  <Text style={styles.btnSubmitText}>
                    {verificandoCI
                      ? "Validando documento..."
                      : "Registrando..."}
                  </Text>
                </View>
              ) : (
                <View style={styles.btnContent}>
                  <UserPlus
                    size={16}
                    color={COLORS.textWhite}
                    strokeWidth={2.4}
                  />
                  <Text style={styles.btnSubmitText}>Crear mi Cuenta</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>

      <CustomModalAlert
        visible={alerta.visible}
        tipo={alerta.tipo}
        titulo={alerta.titulo}
        mensaje={alerta.mensaje}
        onConfirmar={() => {
          const accion = alerta.onConfirmar;
          setAlerta((prev) => ({ ...prev, visible: false }));
          if (accion) accion();
        }}
      />
    </KeyboardAvoidingView>
  );
}
