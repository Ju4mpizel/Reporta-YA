// src/components/formulario/PasoAcordeon.js
import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import {
  ChevronDown,
  ChevronUp,
  Check,
  Lock,
  RefreshCw,
} from "lucide-react-native";
import { COLORS } from "../../constants/theme";
import { styles } from "../../styles/nuevoIncidente.styles";

export default function PasoAcordeon({
  pasoNumero,
  pasoEtiqueta,
  titulo,
  icono: Icono,
  abierto,
  bloqueado,
  cargando,
  items = [],
  itemSeleccionado,
  onToggle,
  onSeleccionarItem,
  onReintentar,
  textoCargando,
  textoVacio,
  getLabel = (item) => item.nombre,
}) {
  return (
    <View
      style={[styles.accordionContainer, bloqueado && styles.containerDisabled]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.accordionHeader, bloqueado && styles.headerDisabled]}
        onPress={() => !bloqueado && onToggle()}
      >
        <View style={styles.accordionHeaderLeft}>
          {bloqueado ? (
            <Lock size={15} color={COLORS.textSubtle} />
          ) : (
            <Icono size={17} color={COLORS.primary} strokeWidth={2.2} />
          )}
          <View>
            <Text
              style={[styles.accordionStep, bloqueado && styles.textDisabled]}
            >
              PASO {pasoNumero} · {pasoEtiqueta}
            </Text>
            <Text
              style={[styles.accordionTitle, bloqueado && styles.textDisabled]}
            >
              {titulo}
            </Text>
          </View>
        </View>
        {!bloqueado &&
          (abierto ? (
            <ChevronUp size={16} color={COLORS.textDark} />
          ) : (
            <ChevronDown size={16} color={COLORS.textDark} />
          ))}
      </TouchableOpacity>

      {abierto && !bloqueado && (
        <View style={styles.accordionBody}>
          {cargando ? (
            <View style={styles.loadingBoxSmall}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingTextSmall}>{textoCargando}</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyNote}>{textoVacio}</Text>
              {onReintentar && (
                <TouchableOpacity
                  style={styles.btnRetrySmall}
                  onPress={onReintentar}
                  activeOpacity={0.7}
                >
                  <RefreshCw size={12} color={COLORS.primary} />
                  <Text style={styles.btnRetrySmallText}>Reintentar</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            items.map((item) => {
              const activo = itemSeleccionado?.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.optionItem, activo && styles.optionItemActive]}
                  onPress={() => onSeleccionarItem(item)}
                >
                  <View style={styles.optionContent}>
                    {activo && (
                      <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                    )}
                    <Text
                      style={[
                        styles.optionText,
                        activo && styles.optionTextActive,
                      ]}
                    >
                      {getLabel(item)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}
