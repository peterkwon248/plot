import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Item, CreateItemInput, ItemStatus } from "@/types";
import { generateId, extractPlainText } from "@/lib/utils";

interface ItemState {
  items: Item[];
  loading: boolean;

  // CRUD
  setItems: (items: Item[]) => void;
  addItem: (input: CreateItemInput) => Item;
  updateItem: (id: string, updates: Partial<Item>) => void;
  removeItem: (id: string) => void;
  softDeleteItem: (id: string) => void;

  // Reorder
  reorderItem: (itemId: string, newIndex: number, sortedItems: Item[]) => void;

  // Maintenance
  purgeDeleted: () => void;

  // Filters
  getByStatus: (status: ItemStatus | "active" | "all") => Item[];
  getByHub: (hubId: string) => Item[];

  // Hub assignment
  assignToHub: (itemId: string, hubId: string | null) => void;

  // Sort
  getNextSortOrder: () => number;
}

export const useItemStore = create<ItemState>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,

      setItems: (items) => set({ items }),

      addItem: (input) => {
        const now = new Date().toISOString();
        const sortOrder = get().getNextSortOrder();
        const bodyPlain = input.body
          ? extractPlainText(input.body as Record<string, unknown>)
          : "";

        const newItem: Item = {
          id: generateId(),
          user_id: "local",
          title: input.title,
          body: input.body || {},
          body_plain: bodyPlain,
          status: input.status || "inbox",
          priority: input.priority || "none",
          item_type: input.item_type || "auto",
          tags: input.tags || [],
          sort_order: sortOrder,
          created_at: now,
          updated_at: now,
          completed_at: null,
          deleted_at: null,
          hub_id: null,
        };

        set((state) => ({ items: [newItem, ...state.items] }));

        // Track creation
        try {
          const { useActivityStore } = require("@/stores/activityStore");
          useActivityStore.getState().addEntry(newItem.id, "created");
        } catch {}

        return newItem;
      },

      updateItem: (id, updates) => {
        const oldItem = get().items.find(i => i.id === id);

        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item;
            const updated = {
              ...item,
              ...updates,
              updated_at: new Date().toISOString(),
            };
            // Auto-set completed_at
            if (updates.status === "done" && item.status !== "done") {
              updated.completed_at = new Date().toISOString();
            } else if (updates.status && updates.status !== "done") {
              updated.completed_at = null;
            }
            // Auto-extract body_plain
            if (updates.body) {
              updated.body_plain = extractPlainText(
                updates.body as Record<string, unknown>
              );
            }
            return updated;
          }),
        }));

        // Track activity (lazy import to avoid circular deps)
        if (oldItem) {
          try {
            const { useActivityStore } = require("@/stores/activityStore");
            const addEntry = useActivityStore.getState().addEntry;

            if (updates.status && updates.status !== oldItem.status) {
              addEntry(id, "status_changed", oldItem.status, updates.status);
            }
            if (updates.priority && updates.priority !== oldItem.priority) {
              addEntry(id, "priority_changed", oldItem.priority, updates.priority);
            }
            if (updates.hub_id !== undefined && updates.hub_id !== oldItem.hub_id) {
              if (updates.hub_id) {
                addEntry(id, "hub_assigned", oldItem.hub_id || undefined, updates.hub_id);
              } else {
                addEntry(id, "hub_removed", oldItem.hub_id || undefined, undefined);
              }
            }
            if (updates.title && updates.title !== oldItem.title) {
              addEntry(id, "title_changed", oldItem.title, updates.title);
            }
          } catch {}
        }
      },

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      softDeleteItem: (id) => {
        get().updateItem(id, { deleted_at: new Date().toISOString() });
      },

      // 드래그 앤 드롭으로 아이템 순서 변경
      // sortedItems: 현재 뷰에서 정렬된 아이템 배열, newIndex: 이동할 위치
      reorderItem: (itemId, newIndex, sortedItems) => {
        let newSortOrder: number;

        if (sortedItems.length <= 1) return;

        if (newIndex === 0) {
          // 맨 앞으로: 첫 번째 아이템보다 1000 작게
          newSortOrder = sortedItems[0].sort_order - 1000;
        } else if (newIndex >= sortedItems.length - 1) {
          // 맨 뒤로: 마지막 아이템보다 1000 크게
          newSortOrder = sortedItems[sortedItems.length - 1].sort_order + 1000;
        } else {
          // 중간: 양 옆 아이템의 평균
          const before = sortedItems[newIndex - 1].sort_order;
          const after = sortedItems[newIndex].sort_order;
          newSortOrder = (before + after) / 2;
        }

        get().updateItem(itemId, { sort_order: newSortOrder });
      },

      // 7일 이상 soft-delete된 아이템 영구 제거 (localStorage 비대화 방지)
      purgeDeleted: () => {
        const PURGE_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // 7일
        const now = Date.now();
        set((state) => ({
          items: state.items.filter((item) => {
            if (!item.deleted_at) return true;
            return now - new Date(item.deleted_at).getTime() < PURGE_AFTER_MS;
          }),
        }));
      },

      getByStatus: (filter) => {
        const items = get().items.filter((item) => !item.deleted_at);
        switch (filter) {
          case "inbox":
            return items
              .filter((i) => i.status === "inbox")
              .sort((a, b) => a.sort_order - b.sort_order);
          case "active":
            return items
              .filter(
                (i) => i.status === "todo" || i.status === "in_progress"
              )
              .sort((a, b) => a.sort_order - b.sort_order);
          case "done":
            return items
              .filter((i) => i.status === "done")
              .sort(
                (a, b) =>
                  new Date(b.completed_at || 0).getTime() -
                  new Date(a.completed_at || 0).getTime()
              );
          case "all":
          default:
            return items.sort((a, b) => a.sort_order - b.sort_order);
        }
      },

      getByHub: (hubId) => {
        return get()
          .items.filter((item) => !item.deleted_at && item.hub_id === hubId)
          .sort((a, b) => a.sort_order - b.sort_order);
      },

      assignToHub: (itemId, hubId) => {
        get().updateItem(itemId, { hub_id: hubId });
      },

      getNextSortOrder: () => {
        const items = get().items.filter((item) => !item.deleted_at);
        if (items.length === 0) return 0;
        // reduce로 최솟값 계산 (Math.min spread는 대량 아이템 시 스택 오버플로우)
        const minOrder = items.reduce(
          (min, i) => (i.sort_order < min ? i.sort_order : min),
          items[0].sort_order
        );
        return minOrder - 1000;
      },
    }),
    {
      name: "plot-items",
      version: 1,
      migrate: (persistedState: unknown) => {
        const state = persistedState as { items?: Item[] };
        if (state?.items) {
          state.items = state.items.map((item) => ({
            ...item,
            hub_id: item.hub_id ?? null,
          }));
        }
        return state as ItemState;
      },
    }
  )
);
