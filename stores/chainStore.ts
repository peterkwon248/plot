import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Chain, ChainRelation } from "@/types";
import { generateId } from "@/lib/utils";

interface ChainState {
  chains: Chain[];

  // CRUD
  addChain: (sourceId: string, targetId: string, relation: ChainRelation) => Chain;
  removeChain: (chainId: string) => void;

  // Queries
  getChainsForItem: (itemId: string) => Chain[];
  getLinkedItems: (itemId: string) => { chain: Chain; linkedItemId: string }[];
  hasChain: (sourceId: string, targetId: string) => boolean;

  // Cleanup
  removeOrphanChains: (existingItemIds: string[]) => void;
}

export const useChainStore = create<ChainState>()(
  persist(
    (set, get) => ({
      chains: [],

      addChain: (sourceId, targetId, relation) => {
        // 중복 방지
        if (get().hasChain(sourceId, targetId)) {
          return get().chains.find(
            (c) =>
              (c.source_id === sourceId && c.target_id === targetId) ||
              (c.source_id === targetId && c.target_id === sourceId)
          )!;
        }

        const newChain: Chain = {
          id: generateId(),
          source_id: sourceId,
          target_id: targetId,
          relation,
          created_at: new Date().toISOString(),
        };

        set((state) => ({ chains: [...state.chains, newChain] }));
        return newChain;
      },

      removeChain: (chainId) =>
        set((state) => ({
          chains: state.chains.filter((c) => c.id !== chainId),
        })),

      getChainsForItem: (itemId) =>
        get().chains.filter(
          (c) => c.source_id === itemId || c.target_id === itemId
        ),

      getLinkedItems: (itemId) =>
        get()
          .chains.filter(
            (c) => c.source_id === itemId || c.target_id === itemId
          )
          .map((chain) => ({
            chain,
            linkedItemId:
              chain.source_id === itemId ? chain.target_id : chain.source_id,
          })),

      hasChain: (sourceId, targetId) =>
        get().chains.some(
          (c) =>
            (c.source_id === sourceId && c.target_id === targetId) ||
            (c.source_id === targetId && c.target_id === sourceId)
        ),

      removeOrphanChains: (existingItemIds) => {
        const idSet = new Set(existingItemIds);
        set((state) => ({
          chains: state.chains.filter(
            (c) => idSet.has(c.source_id) && idSet.has(c.target_id)
          ),
        }));
      },
    }),
    { name: "plot-chains" }
  )
);
