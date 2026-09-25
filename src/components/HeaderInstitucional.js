// src/components/HeaderInstitucional.js
import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { ArrowLeft, ShieldCheck } from "lucide-react-native";
import { RADIUS, SPACING } from "../constants/theme";

export default function HeaderInstitucional({
  titulo,
  subtitulo = "SUBALCALDÍA CALA CALA · D-12",
  onBack,
  backText = "Volver",
}) {
  return (
    <View style={styles.headerDark}>
      {onBack && (
        <TouchableOpacity
          style={styles.btnBack}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={16} color="#38BDF8" strokeWidth={2.4} />
          <Text style={styles.btnBackText}>{backText}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.brandRow}>
        <Image
          source={require("../../assets/logo-reportaya.png")}
          style={styles.appLogo}
          resizeMode="contain"
        />
        <View style={styles.textContainer}>
          <View style={styles.subRow}>
            <ShieldCheck size={12} color="#38BDF8" strokeWidth={2.4} />
            <Text style={styles.headerSub}>{subtitulo}</Text>
          </View>
          <Text style={styles.headerTitle} numberOfLines={2}>
            {titulo}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerDark: {
    backgroundColor: "#0F172A",
    paddingHorizontal: SPACING.lg,
    paddingTop: 50,
    paddingBottom: SPACING.md,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  btnBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  btnBackText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#38BDF8",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  appLogo: {
    width: 44,
    height: 44,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#38BDF8",
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 25,
  },
});
