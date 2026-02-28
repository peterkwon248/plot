import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ActivityEntry, ActivityAction } from "@/types";
import { generateId } from "@/lib/utils";

interface ActivityState {
  entries: ActivityEntry[];

  addEntry: (itemId: string, action: ActivityAction, fromValue?: string, toValue?: string) => void;
  getEntriesForItem: (itemId: string) => ActivityEntry[];
  clearForItem: (itemId: string) => void;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (itemId, action, fromValue, toValue) => {
        const entry: ActivityEntry = {
          id: generateId(),
          item_id: itemId,
          action,
          from_value: fromValue,
          to_value: toValue,
          created_at: new Date().toISOString(),
        };
        set((state) => ({
          entries: [entry, ...state.entries].slice(0, 500), // Keep max 500
        }));
      },

      getEntriesForItem: (itemId) =>
        get().entries.filter(e => e.item_id === itemId),

      clearForItem: (itemId) =>
        set((state) => ({
          entries: state.entries.filter(e => e.item_id !== itemId),
        })),
    }),
    { name: "plot-activities" }
  )
);
