// src/styles/nuevoIncidente.styles.js
import { StyleSheet } from "react-native";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

export const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.bottomInset || 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  accordionContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
    overflow: "hidden",
    elevation: 1,
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  accordionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  accordionStep: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  accordionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textDark,
    marginTop: 2,
  },
  accordionBody: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    padding: SPACING.xs,
    backgroundColor: "#F8FAFC",
  },
  optionItem: {
    paddingVertical: 10,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  optionItemActive: {
    backgroundColor: COLORS.primaryDark,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  optionText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  optionTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  emptyContainer: {
    padding: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: "italic",
    textAlign: "center",
  },
  btnRetrySmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  btnRetrySmallText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  loadingBoxSmall: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  loadingTextSmall: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  containerDisabled: {
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  headerDisabled: {
    backgroundColor: "#F8FAFC",
  },
  textDisabled: {
    color: "#94A3B8",
  },
  sectionDisabled: {
    opacity: 0.65,
  },
  inputDisabled: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    color: "#94A3B8",
  },
  formSection: {
    marginTop: SPACING.xs,
  },
  formSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: SPACING.xs,
  },
  formSectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textDark,
  },
  textarea: {
    height: 85,
  },
  btnSelectImage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F0F9FF",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#BAE6FD",
    borderRadius: RADIUS.md,
    paddingVertical: 14,
  },
  btnSelectImageText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  previewContainer: {
    position: "relative",
    width: "100%",
    height: 160,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  btnRemoveImage: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSubmit: {
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  btnDisabled: {
    backgroundColor: "#94A3B8",
    opacity: 0.7,
  },
  btnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btnSubmitText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
