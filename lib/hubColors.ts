import type { HubColor } from "@/types";

export const HUB_COLORS: { value: HubColor; hex: string }[] = [
  { value: "purple", hex: "#8B5CF6" },
  { value: "blue", hex: "#3B82F6" },
  { value: "green", hex: "#10B981" },
  { value: "yellow", hex: "#F59E0B" },
  { value: "orange", hex: "#F97316" },
  { value: "red", hex: "#EF4444" },
  { value: "pink", hex: "#EC4899" },
  { value: "gray", hex: "#6B7280" },
];

export function getHubColorHex(color: HubColor): string {
  return HUB_COLORS.find((c) => c.value === color)?.hex ?? "#6B7280";
}
