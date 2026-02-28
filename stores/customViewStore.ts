import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CustomView, CustomViewFilter } from "@/types";
import { generateId } from "@/lib/utils";

interface CustomViewState {
  views: CustomView[];

  addView: (name: string, filter: CustomViewFilter, sortBy?: string, sortDir?: string) => CustomView;
  updateView: (id: string, updates: Partial<Omit<CustomView, "id" | "created_at">>) => void;
  removeView: (id: string) => void;
  getView: (id: string) => CustomView | undefined;
}

const DEFAULT_ICONS = ["◈", "◆", "◇", "▣", "△", "○", "★", "♦"];

export const useCustomViewStore = create<CustomViewState>()(
  persist(
    (set, get) => ({
      views: [],

      addView: (name, filter, sortBy = "manual", sortDir = "desc") => {
        const iconIdx = get().views.length % DEFAULT_ICONS.length;
        const newView: CustomView = {
          id: generateId(),
          name,
          icon: DEFAULT_ICONS[iconIdx],
          filter,
          sort_by: sortBy as CustomView["sort_by"],
          sort_dir: sortDir as CustomView["sort_dir"],
          created_at: new Date().toISOString(),
        };
        set((state) => ({ views: [...state.views, newView] }));
        return newView;
      },

      updateView: (id, updates) =>
        set((state) => ({
          views: state.views.map(v => v.id === id ? { ...v, ...updates } : v),
        })),

      removeView: (id) =>
        set((state) => ({ views: state.views.filter(v => v.id !== id) })),

      getView: (id) => get().views.find(v => v.id === id),
    }),
    { name: "plot-custom-views" }
  )
);
