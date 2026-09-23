import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { ShieldCheck, ArrowLeft } from "lucide-react-native";
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
      <View style={styles.headerTopLine}>
        <ShieldCheck size={13} color="#38BDF8" strokeWidth={2.4} />
        <Text style={styles.headerSub}>{subtitulo}</Text>
      </View>
      <Text style={styles.headerTitle}>{titulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerDark: {
    backgroundColor: "#0F172A",
    paddingHorizontal: SPACING.lg,
    paddingTop: 52,
    paddingBottom: SPACING.md,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
    elevation: 3,
  },
  btnBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  btnBackText: { fontSize: 12, fontWeight: "700", color: "#38BDF8" },
  headerTopLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: "800",
    color: "#38BDF8",
    letterSpacing: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#FFFFFF" },
});
