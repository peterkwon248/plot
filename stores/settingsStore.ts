import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ItemStatus, ItemPriority } from "@/types";

interface SettingsState {
  density: "comfortable" | "compact";
  showCompletedItems: boolean;
  defaultStatus: ItemStatus;
  defaultPriority: ItemPriority;
  confirmDelete: boolean;

  updateSettings: (updates: Partial<Omit<SettingsState, "updateSettings">>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      density: "comfortable",
      showCompletedItems: true,
      defaultStatus: "inbox",
      defaultPriority: "none",
      confirmDelete: true,

      updateSettings: (updates) =>
        set((state) => ({ ...state, ...updates })),
    }),
    {
      name: "plot-settings",
    }
  )
);
