import { create } from "zustand";
import type { ViewType } from "@/types";

interface ViewState {
  currentView: ViewType;
  selectedItemId: string | null;
  focusedIndex: number;
  isDetailOpen: boolean;
  isCommandBarOpen: boolean;
  activeHubId: string | null;
  isHubAssignOpen: boolean;
  isChainPickerOpen: boolean;
  recentItems: string[];
  activeCustomViewId: string | null;

  setView: (view: ViewType) => void;
  selectItem: (id: string | null) => void;
  setFocusedIndex: (index: number) => void;
  toggleDetail: (open?: boolean) => void;
  toggleCommandBar: (open?: boolean) => void;
  setActiveHub: (id: string | null) => void;
  toggleHubAssign: (open?: boolean) => void;
  toggleChainPicker: (open?: boolean) => void;
  addRecentItem: (id: string) => void;
  setCustomView: (id: string | null) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  currentView: "inbox",
  selectedItemId: null,
  focusedIndex: 0,
  isDetailOpen: false,
  isCommandBarOpen: false,
  activeHubId: null,
  isHubAssignOpen: false,
  isChainPickerOpen: false,
  activeCustomViewId: null,
  recentItems: (() => {
    try {
      if (typeof window !== "undefined") {
        return JSON.parse(localStorage.getItem("plot-recent-items") || "[]");
      }
    } catch {}
    return [];
  })(),

  setView: (view) =>
    set((state) => ({
      currentView: view,
      focusedIndex: 0,
      activeCustomViewId: null,
      // Clear activeHubId when navigating to non-hub views
      ...(view !== "hub" ? { activeHubId: null } : {}),
    })),

  selectItem: (id) =>
    set((state) => {
      if (id) {
        const recent = [id, ...state.recentItems.filter(r => r !== id)].slice(0, 10);
        if (typeof window !== "undefined") {
          localStorage.setItem("plot-recent-items", JSON.stringify(recent));
        }
        return { selectedItemId: id, isDetailOpen: true, recentItems: recent };
      }
      return { selectedItemId: null, isDetailOpen: false };
    }),

  setFocusedIndex: (index) => set({ focusedIndex: index }),

  toggleDetail: (open) =>
    set((state) => ({
      isDetailOpen: open ?? !state.isDetailOpen,
      selectedItemId: open === false ? null : state.selectedItemId,
    })),

  toggleCommandBar: (open) =>
    set((state) => ({
      isCommandBarOpen: open ?? !state.isCommandBarOpen,
    })),

  setActiveHub: (id) =>
    set({
      activeHubId: id,
      currentView: id ? "hub" : "inbox",
      focusedIndex: 0,
      selectedItemId: null,
      isDetailOpen: false,
    }),

  toggleHubAssign: (open) =>
    set((state) => ({
      isHubAssignOpen: open ?? !state.isHubAssignOpen,
    })),

  toggleChainPicker: (open) =>
    set((state) => ({
      isChainPickerOpen: open ?? !state.isChainPickerOpen,
    })),

  addRecentItem: (id) =>
    set((state) => {
      const recent = [id, ...state.recentItems.filter(r => r !== id)].slice(0, 10);
      if (typeof window !== "undefined") {
        localStorage.setItem("plot-recent-items", JSON.stringify(recent));
      }
      return { recentItems: recent };
    }),

  setCustomView: (id) =>
    set({
      activeCustomViewId: id,
      currentView: id ? "all" : "inbox",
      focusedIndex: 0,
      selectedItemId: null,
      isDetailOpen: false,
    }),
}));
