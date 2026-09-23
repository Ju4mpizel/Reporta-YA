// src/utils/statusBadges.js
import { Clock, Wrench, CheckCircle2, AlertCircle } from "lucide-react-native";
import { COLORS } from "../constants/theme";

export const getBadgeConfig = (estado) => {
  switch (estado) {
    case "en_revision":
      return {
        label: "En Revisión",
        bg: "#FEF3C7",
        text: "#B45309",
        Icon: Clock,
      };
    case "realizando_trabajos":
      return {
        label: "En Trabajos",
        bg: "#DBEAFE",
        text: "#1D4ED8",
        Icon: Wrench,
      };
    case "hecho":
      return {
        label: "Resuelto",
        bg: "#DCFCE7",
        text: "#15803D",
        Icon: CheckCircle2,
      };
    case "rechazado":
      return {
        label: "Rechazado",
        bg: "#FEE2E2",
        text: "#DC2626",
        Icon: AlertCircle,
      };
    default:
      return {
        label: estado || "General",
        bg: "#F1F5F9",
        text: COLORS.textMuted,
        Icon: AlertCircle,
      };
  }
};
