import type {
  AdminConfirmationType,
  AdminRiskLevel,
} from "@/lib/admin/adminTypes";

export const adminRiskLabels: Record<AdminRiskLevel, string> = {
  info: "Info",
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
  critical: "Critical risk",
};

export const adminRiskDescriptions: Record<AdminRiskLevel, string> = {
  info: "Read-only or diagnostic information.",
  low: "Low operational risk. Still review before signing.",
  medium: "Changes live contract behavior. Review current and new values.",
  high: "High impact action. Requires clear operational intent.",
  critical: "Critical or irreversible action. Use only after final review.",
};

export function getDefaultConfirmationForRisk(
  risk: AdminRiskLevel,
): AdminConfirmationType {
  if (risk === "info" || risk === "low") {
    return "none";
  }

  if (risk === "medium" || risk === "high") {
    return "confirm";
  }

  return "typed-confirmation";
}
