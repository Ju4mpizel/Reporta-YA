// src/components/ModalNuevaCalle.js
import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import { X } from "lucide-react-native";
import { COLORS, RADIUS } from "../../constants/theme";

export default function ModalNuevaCalle({
  visible,
  onClose,
  coordenadaMarcada,
  zonas,
  zonaSeleccionada,
  onSelectZona,
  nombreNuevaCalle,
  onChangeNombre,
  tipoNuevaCalle,
  onSelectTipo,
  onGuardar,
  guardando,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Registrar Nueva Calle</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalLabel}>Coordenadas marcadas:</Text>
          <View style={styles.modalCoordBox}>
            <Text style={styles.modalCoordText}>
              {coordenadaMarcada?.lat}, {coordenadaMarcada?.lng}
            </Text>
          </View>

          <Text style={styles.modalLabel}>Zona Municipal:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 4 }}
          >
            <View style={{ flexDirection: "row", gap: 6 }}>
              {zonas.map((z) => (
                <TouchableOpacity
                  key={z.id}
                  style={[
                    styles.chipZona,
                    zonaSeleccionada === z.id && styles.chipZonaActiva,
                  ]}
                  onPress={() => onSelectZona(z.id)}
                >
                  <Text
                    style={[
                      styles.chipZonaText,
                      zonaSeleccionada === z.id && styles.chipZonaTextActiva,
                    ]}
                  >
                    {z.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.modalLabel}>Nombre oficial de la vía:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Av. América (esq. Adela Zamudio)"
            value={nombreNuevaCalle}
            onChangeText={onChangeNombre}
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.modalLabel}>Tipo de vía:</Text>
          <View style={styles.tipoRow}>
            {["avenida", "calle", "pasaje", "plaza"].map((tipo) => (
              <TouchableOpacity
                key={tipo}
                style={[
                  styles.tipoBtn,
                  tipoNuevaCalle === tipo && styles.tipoBtnActive,
                ]}
                onPress={() => onSelectTipo(tipo)}
              >
                <Text
                  style={[
                    styles.tipoBtnText,
                    tipoNuevaCalle === tipo && styles.tipoBtnTextActive,
                  ]}
                >
                  {tipo.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.btnGuardarFinal}
            activeOpacity={0.8}
            onPress={onGuardar}
            disabled={guardando}
          >
            {guardando ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.btnGuardarFinalText}>
                Guardar Vía en Base de Datos
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    maxWidth: 440,
    borderRadius: RADIUS.md,
    padding: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 15, fontWeight: "800", color: COLORS.textDark },
  modalLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginTop: 10,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  modalCoordBox: {
    backgroundColor: "#F1F5F9",
    padding: 8,
    borderRadius: RADIUS.sm,
  },
  modalCoordText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: "700",
  },
  chipZona: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm || 6,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  chipZonaActiva: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipZonaText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
  },
  chipZonaTextActiva: { color: "#FFFFFF" },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.textDark,
    backgroundColor: "#FFFFFF",
  },
  tipoRow: { flexDirection: "row", gap: 6, marginVertical: 6 },
  tipoBtn: {
    flex: 1,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  tipoBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tipoBtnText: { fontSize: 10, fontWeight: "800", color: COLORS.textMuted },
  tipoBtnTextActive: { color: "#FFFFFF" },
  btnGuardarFinal: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    marginTop: 16,
  },
  btnGuardarFinalText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
});
