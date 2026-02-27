import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Hub, CreateHubInput } from "@/types";
import { generateId } from "@/lib/utils";

interface HubState {
  hubs: Hub[];
  loading: boolean;

  setHubs: (hubs: Hub[]) => void;
  addHub: (input: CreateHubInput) => Hub;
  updateHub: (id: string, updates: Partial<Hub>) => void;
  archiveHub: (id: string) => void;
  removeHub: (id: string) => void;
  getActiveHubs: () => Hub[];
  getHubById: (id: string) => Hub | undefined;
  getNextSortOrder: () => number;
}

export const useHubStore = create<HubState>()(
  persist(
    (set, get) => ({
      hubs: [],
      loading: false,

      setHubs: (hubs) => set({ hubs }),

      addHub: (input) => {
        const now = new Date().toISOString();
        const sortOrder = get().getNextSortOrder();
        const newHub: Hub = {
          id: generateId(),
          user_id: "local",
          name: input.name,
          description: input.description || "",
          color: input.color || "purple",
          icon: null,
          sort_order: sortOrder,
          created_at: now,
          updated_at: now,
          archived_at: null,
        };
        set((state) => ({ hubs: [...state.hubs, newHub] }));
        return newHub;
      },

      updateHub: (id, updates) =>
        set((state) => ({
          hubs: state.hubs.map((hub) =>
            hub.id === id
              ? { ...hub, ...updates, updated_at: new Date().toISOString() }
              : hub
          ),
        })),

      archiveHub: (id) => {
        get().updateHub(id, { archived_at: new Date().toISOString() });
      },

      removeHub: (id) =>
        set((state) => ({ hubs: state.hubs.filter((h) => h.id !== id) })),

      getActiveHubs: () =>
        get()
          .hubs.filter((h) => !h.archived_at)
          .sort((a, b) => a.sort_order - b.sort_order),

      getHubById: (id) => get().hubs.find((h) => h.id === id),

      getNextSortOrder: () => {
        const hubs = get().hubs.filter((h) => !h.archived_at);
        if (hubs.length === 0) return 0;
        const maxOrder = hubs.reduce(
          (max, h) => (h.sort_order > max ? h.sort_order : max),
          hubs[0].sort_order
        );
        return maxOrder + 1000;
      },
    }),
    { name: "plot-hubs" }
  )
);
