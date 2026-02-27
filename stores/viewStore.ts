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

  setView: (view: ViewType) => void;
  selectItem: (id: string | null) => void;
  setFocusedIndex: (index: number) => void;
  toggleDetail: (open?: boolean) => void;
  toggleCommandBar: (open?: boolean) => void;
  setActiveHub: (id: string | null) => void;
  toggleHubAssign: (open?: boolean) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  currentView: "inbox",
  selectedItemId: null,
  focusedIndex: 0,
  isDetailOpen: false,
  isCommandBarOpen: false,
  activeHubId: null,
  isHubAssignOpen: false,

  setView: (view) =>
    set((state) => ({
      currentView: view,
      focusedIndex: 0,
      // Clear activeHubId when navigating to non-hub views
      ...(view !== "hub" ? { activeHubId: null } : {}),
    })),

  selectItem: (id) =>
    set({ selectedItemId: id, isDetailOpen: id !== null }),

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
}));
