"use client";

import { useState, useRef, useEffect } from "react";
import { useHubStore } from "@/stores/hubStore";
import { useItemStore } from "@/stores/itemStore";
import { useViewStore } from "@/stores/viewStore";
import { getHubColorHex, HUB_COLORS } from "@/lib/hubColors";
import { cn } from "@/lib/utils";
import type { HubColor } from "@/types";

export function HubSection() {
  const { getActiveHubs } = useHubStore();
  const { items } = useItemStore();
  const { currentView, activeHubId, setActiveHub } = useViewStore();
  const hubs = getActiveHubs();
  const [isCreating, setIsCreating] = useState(false);

  // Collapse state management
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("plot-hub-collapsed") === "true";
    }
    return false;
  });

  // Save collapse state to localStorage
  useEffect(() => {
    localStorage.setItem("plot-hub-collapsed", String(collapsed));
  }, [collapsed]);

  // Count items per hub (non-deleted only)
  const getHubItemCount = (hubId: string) =>
    items.filter((i) => !i.deleted_at && i.hub_id === hubId).length;

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Divider + Section Header */}
      <div className="px-2 pt-2">
        <div className="border-t border-border-subtle mb-2" />
        <div className="group flex items-center justify-between px-1 mb-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-1 text-left"
          >
            {/* Collapse arrow */}
            <svg
              width="10"
              height="10"
              viewBox="0 0 12 12"
              className={cn(
                "shrink-0 text-text-tertiary transition-transform duration-150",
                collapsed ? "" : "rotate-90"
              )}
            >
              <path
                d="M4 2L8 6L4 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium">
              프로젝트
            </span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCreating(true);
              setCollapsed(false);
            }}
            className="text-[14px] leading-[16px] text-text-disabled group-hover:text-text-secondary transition-colors"
            title="새 프로젝트"
          >
            +
          </button>
        </div>
      </div>

      {/* Scrollable hub list */}
      {!collapsed && (
        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2">
          {/* Inline Create Form */}
          {isCreating && (
            <HubInlineCreate
              onCreated={() => setIsCreating(false)}
              onCancel={() => setIsCreating(false)}
            />
          )}

          {/* Hub Items */}
          {hubs.map((hub) => {
            const isActive = currentView === "hub" && activeHubId === hub.id;
            const count = getHubItemCount(hub.id);

            return (
              <button
                key={hub.id}
                onClick={() => setActiveHub(hub.id)}
                className={cn(
                  "relative w-full h-7 flex items-center gap-2 px-2.5 rounded-r-md text-[13px] leading-[20px] transition-colors duration-100",
                  isActive
                    ? "bg-bg-elevated text-accent"
                    : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
                )}
              >
                {/* Left indicator bar (active state only) */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-[60%] bg-accent rounded-r-full" />
                )}
                <svg width="6" height="6" viewBox="0 0 6 6" className="shrink-0">
                  <circle cx="3" cy="3" r="3" fill={getHubColorHex(hub.color)} />
                </svg>
                <span className="flex-1 text-left truncate">{hub.name}</span>
                {count > 0 && (
                  <span className="text-[11px] leading-[16px] tracking-[0.01em] text-text-tertiary">
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Empty state when no hubs and not creating */}
          {hubs.length === 0 && !isCreating && (
            <p className="px-3 py-2 text-[12px] leading-[16px] text-text-disabled">
              프로젝트가 없습니다
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function HubInlineCreate({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<HubColor>("purple");
  const inputRef = useRef<HTMLInputElement>(null);
  const { addHub } = useHubStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      onCancel();
      return;
    }
    addHub({ name: trimmed, color });
    onCreated();
  };

  return (
    <div
      className="mb-1 px-1"
      style={{ animation: "fadeIn 150ms ease forwards" }}
    >
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") onCancel();
        }}
        onBlur={handleSubmit}
        placeholder="프로젝트 이름..."
        className="w-full h-8 bg-bg-elevated rounded-md px-3 text-[13px] leading-[20px] text-text-primary placeholder:text-text-tertiary outline-none border border-border-focus"
      />
      {/* Color Picker Row */}
      <div className="flex items-center gap-1.5 px-1 py-1.5">
        {HUB_COLORS.map((c) => (
          <button
            key={c.value}
            onClick={() => setColor(c.value)}
            className={cn(
              "w-4 h-4 rounded-full transition-transform",
              color === c.value ? "scale-125 ring-1 ring-white/30" : "hover:scale-110"
            )}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>
    </div>
  );
}
