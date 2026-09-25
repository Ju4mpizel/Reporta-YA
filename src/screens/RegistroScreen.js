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
} from "react-native";
import {
  UserPlus,
  User,
  FileText,
  Phone,
  Lock,
  ArrowLeft,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react-native";
import { supabase } from "../services/supabase";
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

export default function RegistroScreen({ navigation }) {
  const { registrar, cargando } = useAuth();

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [ciNumero, setCiNumero] = useState("");
  const [expedicion, setExpedicion] = useState("CB");
  const [menuExpedicionAbierto, setMenuExpedicionAbierto] = useState(false);
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");

  const [errores, setErrores] = useState({});
  const [verificandoCI, setVerificandoCI] = useState(false);

  // Alerta Institucional
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
      const { data, error } = await supabase
        .from("perfiles")
        .select("id")
        .eq("ci", ciCompleto.trim())
        .maybeSingle();

      if (error) throw error;
      return Boolean(data);
    } catch (err) {
      console.warn("Fallo comprobación de CI:", err.message);
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
        onConfirmar: null,
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
        mensaje: `El documento ${ciCompleto} ya cuenta con una cuenta activa en el sistema.`,
        onConfirmar: null,
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
        mensaje: `Tu cuenta con CI ${ciCompleto} ha sido empadronada correctamente en el Distrito 12. Ya puedes ingresar al portal ciudadano.`,
        onConfirmar: () => navigation.navigate("Login"),
      });
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("CARNET_DUPLICADO")) {
        setAlerta({
          visible: true,
          tipo: "error",
          titulo: "Carnet ya Empadronado",
          mensaje: `El documento ${ciCompleto} ya se encuentra registrado en el sistema.`,
          onConfirmar: null,
        });
      } else {
        setAlerta({
          visible: true,
          tipo: "error",
          titulo: "Error en el Registro",
          mensaje: msg || "Ocurrió un error al procesar el empadronamiento.",
          onConfirmar: null,
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
            {errores.nombre ? (
              <View style={styles.errorRow}>
                <AlertCircle size={11} color="#DC2626" />
                <Text style={styles.errorText}>{errores.nombre}</Text>
              </View>
            ) : null}
          </View>

          {/* CI con Expedición */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Cédula de Identidad (CI)</Text>
              <Text style={styles.previewCiText}>
                Registrará: {ciNumero || "••••••"} {expedicion}
              </Text>
            </View>

            <View style={styles.ciCompositeRow}>
              <View
                style={[
                  styles.inputWrapper,
                  styles.ciInputWrapper,
                  errores.ci && styles.inputWrapperError,
                ]}
              >
                <FileText
                  size={16}
                  color={errores.ci ? "#DC2626" : COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Número (ej: 7894561)"
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

            {errores.ci ? (
              <View style={styles.errorRow}>
                <AlertCircle size={11} color="#DC2626" />
                <Text style={styles.errorText}>{errores.ci}</Text>
              </View>
            ) : (
              <Text style={styles.helperText}>
                Ingresa tus dígitos y selecciona el departamento emisor de tu
                CI.
              </Text>
            )}
          </View>

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
            {errores.telefono ? (
              <View style={styles.errorRow}>
                <AlertCircle size={11} color="#DC2626" />
                <Text style={styles.errorText}>{errores.telefono}</Text>
              </View>
            ) : null}
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
            {errores.password ? (
              <View style={styles.errorRow}>
                <AlertCircle size={11} color="#DC2626" />
                <Text style={styles.errorText}>{errores.password}</Text>
              </View>
            ) : null}
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

      {/* Alerta Institucional */}
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
  btnBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: SPACING.md,
    alignSelf: "flex-start",
  },
  btnBackText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  formTitle: { fontSize: 20, fontWeight: "900", color: COLORS.textDark },
  formDesc: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    marginTop: 2,
  },
  inputGroup: { marginBottom: SPACING.sm },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 3,
  },
  previewCiText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: COLORS.primary,
  },
  counterText: {
    fontSize: 10,
    color: COLORS.textSubtle,
    fontWeight: "600",
  },

  ciCompositeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ciInputWrapper: {
    flex: 1,
    marginBottom: 0,
  },
  expedicionTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 40,
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
  inputWrapperError: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  inputIcon: { marginRight: 6 },
  input: { flex: 1, paddingVertical: 9, fontSize: 13, color: COLORS.textDark },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    marginLeft: 2,
  },
  errorText: {
    fontSize: 10.5,
    color: "#DC2626",
    fontWeight: "600",
  },
  helperText: {
    fontSize: 10,
    color: COLORS.textSubtle,
    marginTop: 3,
    marginLeft: 2,
  },
  btnSubmit: {
    backgroundColor: COLORS.primaryDark,
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
