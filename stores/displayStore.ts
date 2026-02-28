import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DisplaySettings, GroupByOption, SortByOption, SortDirection, LayoutMode } from "@/types";

const DEFAULT_DISPLAY: DisplaySettings = {
  groupBy: "none",
  sortBy: "manual",
  sortDir: "desc",
  showProperties: {
    priority: true,
    hub: true,
    date: true,
    id: true,
    preview: true,
  },
  layout: "list",
};

interface DisplayState {
  settings: DisplaySettings;
  updateSettings: (updates: Partial<DisplaySettings>) => void;
  updateShowProperties: (updates: Partial<DisplaySettings["showProperties"]>) => void;
  resetSettings: () => void;
}

export const useDisplayStore = create<DisplayState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_DISPLAY,

      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),

      updateShowProperties: (updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            showProperties: { ...state.settings.showProperties, ...updates },
          },
        })),

      resetSettings: () => set({ settings: DEFAULT_DISPLAY }),
    }),
    {
      name: "plot-display",
    }
  )
);
