"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useViewStore } from "@/stores/viewStore";
import { useItemStore } from "@/stores/itemStore";
import { useHubStore } from "@/stores/hubStore";
import { getHubColorHex } from "@/lib/hubColors";
import { cn } from "@/lib/utils";

export function HubAssignOverlay() {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { selectedItemId, focusedIndex, currentView, activeHubId, toggleHubAssign } = useViewStore();
  const { items, getByStatus, getByHub, assignToHub } = useItemStore();
  const { getActiveHubs } = useHubStore();

  const hubs = getActiveHubs();

  // Determine which item to assign
  const targetItemId = useMemo(() => {
    if (selectedItemId) return selectedItemId;
    const viewItems = currentView === "hub" && activeHubId
      ? getByHub(activeHubId)
      : getByStatus(currentView as Exclude<typeof currentView, "hub">);
    return viewItems[focusedIndex]?.id ?? null;
  }, [selectedItemId, focusedIndex, currentView, activeHubId, getByStatus, getByHub]);

  // Auto-focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filter hubs by query
  const filteredHubs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hubs;
    return hubs.filter((h) => h.name.toLowerCase().includes(q));
  }, [query, hubs]);

  // Options: "None" + filtered hubs
  const options = useMemo(() => {
    const result: { id: string | null; label: string; color?: string }[] = [
      { id: null, label: "No project" },
    ];
    for (const hub of filteredHubs) {
      result.push({ id: hub.id, label: hub.name, color: getHubColorHex(hub.color) });
    }
    return result;
  }, [filteredHubs]);

  // Clamp index
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const close = () => toggleHubAssign(false);

  const handleSelect = (hubId: string | null) => {
    if (targetItemId) {
      assignToHub(targetItemId, hubId);
    }
    close();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && options[selectedIndex]) {
      e.preventDefault();
      handleSelect(options[selectedIndex].id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={close} />

      {/* Modal */}
      <div
        className="relative w-[320px] bg-bg-surface border border-border-default rounded-xl shadow-2xl overflow-hidden"
        style={{
          animation: "commandBarIn 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 h-10 border-b border-border-subtle">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search projects..."
            className="flex-1 bg-transparent text-[13px] leading-[20px] text-text-primary placeholder:text-text-tertiary outline-none"
          />
          <kbd className="text-[11px] leading-[16px] text-text-tertiary bg-bg-elevated px-1.5 py-0.5 rounded border border-border-subtle">
            ESC
          </kbd>
        </div>

        {/* Options */}
        <div className="max-h-60 overflow-y-auto py-1">
          {options.length === 0 ? (
            <div className="px-4 py-4 text-center text-text-tertiary text-[13px] leading-[20px]">
              No projects found
            </div>
          ) : (
            options.map((opt, idx) => (
              <button
                key={opt.id ?? "none"}
                onClick={() => handleSelect(opt.id)}
                className={cn(
                  "w-full h-8 flex items-center gap-2 px-4 text-[13px] leading-[20px] transition-colors",
                  idx === selectedIndex
                    ? "bg-bg-elevated text-text-primary"
                    : "text-text-secondary hover:bg-bg-elevated"
                )}
              >
                {opt.color ? (
                  <svg width="6" height="6" viewBox="0 0 6 6" className="shrink-0">
                    <circle cx="3" cy="3" r="3" fill={opt.color} />
                  </svg>
                ) : (
                  <span className="text-text-tertiary text-[11px]">—</span>
                )}
                <span className="truncate">{opt.label}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
