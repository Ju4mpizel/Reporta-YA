// src/components/auth/CiInputGroup.js
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
} from "lucide-react-native";
import { COLORS } from "../../constants/theme";
import { styles } from "../../styles/auth.styles";

export const EXPEDICIONES = [
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

export default function CiInputGroup({
  ciNumero,
  onChangeCi,
  expedicion,
  onChangeExpedicion,
  error = null,
  helperText = null,
  etiquetaPrevia = "Registrará",
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelRow}>
        <Text style={styles.inputLabel}>Cédula de Identidad (CI)</Text>
        <Text style={styles.previewCiText}>
          {etiquetaPrevia}: {ciNumero || "••••••"} {expedicion}
        </Text>
      </View>

      <View style={styles.ciCompositeRow}>
        <View
          style={[
            styles.inputWrapper,
            styles.ciInputWrapper,
            error && styles.inputWrapperError,
          ]}
        >
          <FileText
            size={16}
            color={error ? "#DC2626" : COLORS.textMuted}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Número (ej: 9316163)"
            placeholderTextColor={COLORS.textSubtle}
            value={ciNumero}
            onChangeText={onChangeCi}
            keyboardType="numeric"
            maxLength={8}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.expedicionTrigger,
            menuAbierto && styles.expedicionTriggerActive,
          ]}
          activeOpacity={0.8}
          onPress={() => setMenuAbierto((prev) => !prev)}
        >
          <Text style={styles.expedicionTriggerText}>{expedicion}</Text>
          {menuAbierto ? (
            <ChevronUp size={14} color={COLORS.primary} strokeWidth={2.4} />
          ) : (
            <ChevronDown size={14} color={COLORS.textDark} strokeWidth={2.4} />
          )}
        </TouchableOpacity>
      </View>

      {menuAbierto && (
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
                    onChangeExpedicion(item.sigla);
                    setMenuAbierto(false);
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

      {error ? (
        <View style={styles.errorRow}>
          <AlertCircle size={11} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}
