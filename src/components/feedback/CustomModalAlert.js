// src/components/CustomModalAlert.js
import React from "react";
import { StyleSheet, Text, View, Modal, TouchableOpacity } from "react-native";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  HelpCircle,
} from "lucide-react-native";
import { COLORS, RADIUS } from "../../constants/theme";

export default function CustomModalAlert({
  visible,
  tipo = "exito", // "exito" | "error" | "info" | "confirmar"
  titulo = "Atención",
  mensaje = "",
  textoBotonConfirmar = "Entendido",
  textoBotonCancelar = "Cancelar",
  onConfirmar,
  onCancelar,
}) {
  if (!visible) return null;

  const obtenerIcono = () => {
    switch (tipo) {
      case "exito":
        return <CheckCircle2 size={40} color="#16A34A" strokeWidth={2.2} />;
      case "error":
        return <AlertCircle size={40} color="#DC2626" strokeWidth={2.2} />;
      case "confirmar":
        return (
          <HelpCircle size={40} color={COLORS.primary} strokeWidth={2.2} />
        );
      default:
        return <Info size={40} color={COLORS.primary} strokeWidth={2.2} />;
    }
  };

  const obtenerColorBoton = () => {
    switch (tipo) {
      case "exito":
        return "#16A34A";
      case "error":
        return "#DC2626";
      default:
        return COLORS.primary;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconoBox}>{obtenerIcono()}</View>

          <Text style={styles.titulo}>{titulo}</Text>
          <Text style={styles.mensaje}>{mensaje}</Text>

          <View style={styles.botonesRow}>
            {tipo === "confirmar" && (
              <TouchableOpacity
                style={[styles.btn, styles.btnCancelar]}
                activeOpacity={0.8}
                onPress={onCancelar}
              >
                <Text style={styles.btnCancelarText}>{textoBotonCancelar}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.btn,
                {
                  backgroundColor: obtenerColorBoton(),
                  flex: tipo === "confirmar" ? 1 : undefined,
                  width: tipo === "confirmar" ? undefined : "100%",
                },
              ]}
              activeOpacity={0.8}
              onPress={onConfirmar}
            >
              <Text style={styles.btnConfirmarText}>{textoBotonConfirmar}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 9999,
  },
  card: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    maxWidth: 380,
    borderRadius: RADIUS.md || 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    elevation: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  iconoBox: {
    marginBottom: 12,
  },
  titulo: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  mensaje: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  botonesRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.sm || 8,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancelar: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  btnCancelarText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
  },
  btnConfirmarText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
});
