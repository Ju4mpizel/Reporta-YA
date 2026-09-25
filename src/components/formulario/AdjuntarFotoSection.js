// src/components/formulario/AdjuntarFotoSection.js
import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Camera, X } from "lucide-react-native";
import { COLORS } from "../../constants/theme";
import { styles } from "../../styles/nuevoIncidente.styles";

export default function AdjuntarFotoSection({
  imagenUri,
  onAbrirModal,
  onRemoverFoto,
  deshabilitado,
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, deshabilitado && styles.textDisabled]}>
        Fotografía Evidencial (Opcional)
      </Text>

      {imagenUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imagenUri }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.btnRemoveImage}
            onPress={onRemoverFoto}
            activeOpacity={0.8}
          >
            <X size={14} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.btnSelectImage, deshabilitado && styles.inputDisabled]}
          onPress={onAbrirModal}
          disabled={deshabilitado}
          activeOpacity={0.7}
        >
          <Camera size={18} color={COLORS.primary} strokeWidth={2.2} />
          <Text style={styles.btnSelectImageText}>
            Adjuntar foto (Cámara o Galería)
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
