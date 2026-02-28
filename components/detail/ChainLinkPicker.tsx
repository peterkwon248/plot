"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useItemStore } from "@/stores/itemStore";
import { useChainStore } from "@/stores/chainStore";
import type { ChainRelation } from "@/types";

interface ChainLinkPickerProps {
  itemId: string;
  onClose: () => void;
}

const RELATION_OPTIONS: { value: ChainRelation; label: string }[] = [
  { value: "related", label: "관련" },
  { value: "parent", label: "상위" },
  { value: "child", label: "하위" },
  { value: "blocks", label: "차단" },
  { value: "blocked_by", label: "차단됨" },
];

export function ChainLinkPicker({ itemId, onClose }: ChainLinkPickerProps) {
  const [query, setQuery] = useState("");
  const [selectedRelation, setSelectedRelation] =
    useState<ChainRelation>("related");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { items } = useItemStore();
  const { addChain, getChainsForItem } = useChainStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Exclude current item and already-linked items
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

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (targetId: string) => {
    addChain(itemId, targetId, selectedRelation);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex].id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[25vh]">
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(10, 13, 15, 0.5)",
          backdropFilter: "blur(8px)",
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-[480px] bg-bg-surface border border-border-default rounded-xl shadow-2xl overflow-hidden"
        style={{
          animation:
            "commandBarIn 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
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

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 h-11 border-b border-border-subtle">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="text-text-tertiary shrink-0"
          >
            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
            <line
              x1="9"
              y1="9"
              x2="12.5"
              y2="12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="연결할 항목 검색..."
            className="flex-1 bg-transparent text-[13px] leading-[20px] text-text-primary placeholder:text-text-tertiary outline-none"
          />
          <kbd className="text-[11px] leading-[16px] text-text-tertiary bg-bg-elevated px-1.5 py-0.5 rounded border border-border-subtle">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-64 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-text-tertiary text-[13px] leading-[20px]">
              {query ? "결과 없음" : "연결할 항목이 없습니다"}
            </div>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                data-selected={idx === selectedIndex || undefined}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                  idx === selectedIndex
                    ? "bg-bg-elevated text-text-primary"
                    : "text-text-secondary hover:bg-bg-elevated"
                }`}
              >
                <span className="text-[11px] text-text-tertiary font-mono shrink-0">
                  {item.id.slice(0, 6)}
                </span>
                <span className="text-[13px] leading-[20px] truncate">
                  {item.title}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
