// src/styles/adminPanel.styles.js
import { StyleSheet } from "react-native";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  statsContainer: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    alignItems: "center",
    elevation: 1,
  },
  statBoxAmber: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  statBoxBlue: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  statBoxGreen: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  statNum: {
    fontSize: 20,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    color: COLORS.textMuted,
    marginTop: 2,
    textTransform: "uppercase",
  },
  listHeaderRow: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 9.5,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.bottomInset || 20,
  },
});
