import { create } from "zustand";
import type { ViewType } from "@/types";

interface ViewState {
  currentView: ViewType;
  selectedItemId: string | null;
  focusedIndex: number;
  isDetailOpen: boolean;
  isCommandBarOpen: boolean;

  setView: (view: ViewType) => void;
  selectItem: (id: string | null) => void;
  setFocusedIndex: (index: number) => void;
  toggleDetail: (open?: boolean) => void;
  toggleCommandBar: (open?: boolean) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  currentView: "inbox",
  selectedItemId: null,
  focusedIndex: 0,
  isDetailOpen: false,
  isCommandBarOpen: false,

  setView: (view) => set({ currentView: view, focusedIndex: 0 }),

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
}));
