"use client";

import { useState, useMemo } from "react";
import { useItemStore } from "@/stores/itemStore";
import { useChainStore } from "@/stores/chainStore";
import type { ChainRelation } from "@/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

const RELATION_OPTIONS: { value: ChainRelation; label: string }[] = [
  { value: "related", label: "관련" },
  { value: "parent", label: "상위" },
  { value: "child", label: "하위" },
  { value: "blocks", label: "차단" },
  { value: "blocked_by", label: "차단됨" },
];

interface ChainLinkPickerProps {
  itemId: string;
  onClose: () => void;
}

export function ChainLinkPicker({ itemId, onClose }: ChainLinkPickerProps) {
  const [query, setQuery] = useState("");
  const [selectedRelation, setSelectedRelation] = useState<ChainRelation>("related");
  const { items } = useItemStore();
  const { addChain, getChainsForItem } = useChainStore();

  const existingLinks = useMemo(() => {
    return new Set(
      getChainsForItem(itemId).map((c) =>
        c.source_id === itemId ? c.target_id : c.source_id
      )
    );
  }, [itemId, getChainsForItem]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter(
        (i) => !i.deleted_at && i.id !== itemId && !existingLinks.has(i.id)
      )
      .filter(
        (i) =>
          !q ||
          i.title.toLowerCase().includes(q) ||
          (i.body_plain && i.body_plain.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [query, items, itemId, existingLinks]);

  const handleSelect = (targetId: string) => {
    addChain(itemId, targetId, selectedRelation);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="overflow-hidden p-0 max-w-[480px] top-[25%] translate-y-0 gap-0">
        {/* Relation selector */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-2">
          {RELATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedRelation(opt.value)}
              className={`text-[11px] leading-[16px] px-2 py-1 rounded-md transition-colors ${
                selectedRelation === opt.value
                  ? "bg-accent-muted text-accent"
                  : "text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Command shouldFilter={false}>
          <div className="flex items-center gap-3 px-4 h-11 border-b border-border-subtle">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-text-tertiary shrink-0">
              <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
              <line x1="9" y1="9" x2="12.5" y2="12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="연결할 항목 검색..."
              className="flex-1 bg-transparent text-[13px] leading-[20px] text-text-primary placeholder:text-text-tertiary outline-none border-none h-11 p-0 ring-0 focus:ring-0"
            />
            <kbd className="text-[11px] leading-[16px] text-text-tertiary bg-bg-elevated px-1.5 py-0.5 rounded border border-border-subtle">
              ESC
            </kbd>
          </div>
          <CommandList className="max-h-64 overflow-y-auto">
            <CommandEmpty className="px-4 py-6 text-center text-text-tertiary text-[13px] leading-[20px]">
              {query ? "결과 없음" : "연결할 항목이 없습니다"}
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect(item.id)}
                  className="flex items-center gap-3 px-4 py-2 text-left rounded-none"
                >
                  <span className="text-[11px] text-text-tertiary font-mono shrink-0">
                    {item.id.slice(0, 6)}
                  </span>
                  <span className="text-[13px] leading-[20px] truncate">
                    {item.title}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
