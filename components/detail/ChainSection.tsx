"use client";

import { useState, useMemo } from "react";
import { useChainStore } from "@/stores/chainStore";
import { useItemStore } from "@/stores/itemStore";
import { useViewStore } from "@/stores/viewStore";
import { ChainLinkPicker } from "./ChainLinkPicker";
import type { ChainRelation } from "@/types";

const RELATION_LABELS: Record<ChainRelation, string> = {
  related: "관련",
  parent: "상위",
  child: "하위",
  blocks: "차단",
  blocked_by: "차단됨",
};

const RELATION_ICONS: Record<ChainRelation, string> = {
  related: "\u2194",
  parent: "\u2191",
  child: "\u2193",
  blocks: "\u2298",
  blocked_by: "\u2297",
};

interface ChainSectionProps {
  itemId: string;
}

export function ChainSection({ itemId }: ChainSectionProps) {
  const [showPicker, setShowPicker] = useState(false);
  const { getLinkedItems, removeChain } = useChainStore();
  const { items } = useItemStore();
  const { selectItem } = useViewStore();

  const linkedItems = useMemo(() => {
    const links = getLinkedItems(itemId);
    return links
      .map(({ chain, linkedItemId }) => {
        const item = items.find((i) => i.id === linkedItemId && !i.deleted_at);
        // Determine display relation (flip if current item is target)
        let displayRelation: ChainRelation = chain.relation;
        if (chain.target_id === itemId) {
          // Flip perspective
          if (chain.relation === "parent") displayRelation = "child";
          else if (chain.relation === "child") displayRelation = "parent";
          else if (chain.relation === "blocks") displayRelation = "blocked_by";
          else if (chain.relation === "blocked_by") displayRelation = "blocks";
        }
        return { chain, item, displayRelation };
      })
      .filter((l) => l.item !== undefined);
  }, [itemId, getLinkedItems, items]);

  return (
    <>
      <div className="mt-6">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium">
            체인
          </span>
          <button
            onClick={() => setShowPicker(true)}
            className="text-[11px] leading-[16px] text-text-tertiary hover:text-accent transition-colors"
          >
            + 연결
          </button>
        </div>

        {/* Linked items list */}
        {linkedItems.length === 0 ? (
          <div className="text-[12px] leading-[16px] text-text-tertiary py-2">
            연결된 항목이 없습니다
          </div>
        ) : (
          <div className="space-y-0.5">
            {linkedItems.map(({ chain, item, displayRelation }) => (
              <div
                key={chain.id}
                className="group flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-md hover:bg-bg-elevated transition-colors cursor-pointer"
                onClick={() => selectItem(item!.id)}
              >
                {/* Relation icon */}
                <span
                  className="text-[11px] text-text-tertiary shrink-0 w-4 text-center"
                  title={RELATION_LABELS[displayRelation]}
                >
                  {RELATION_ICONS[displayRelation]}
                </span>

                {/* Item title */}
                <span className="text-[12px] leading-[16px] text-text-secondary truncate flex-1">
                  {item!.title}
                </span>

                {/* ID badge */}
                <span className="text-[10px] font-mono text-text-tertiary shrink-0">
                  {item!.id.slice(0, 4)}
                </span>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeChain(chain.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-priority-urgent transition-all shrink-0"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <line x1="3" y1="3" x2="9" y2="9" />
                    <line x1="9" y1="3" x2="3" y2="9" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chain Link Picker Modal */}
      {showPicker && (
        <ChainLinkPicker
          itemId={itemId}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
