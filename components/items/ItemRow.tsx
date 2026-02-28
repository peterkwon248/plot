"use client";

import { forwardRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Item } from "@/types";
import { inferDisplayType } from "@/types";
import { ItemStatusIcon } from "./ItemStatusIcon";
import { useViewStore } from "@/stores/viewStore";
import { useHubStore } from "@/stores/hubStore";
import { getHubColorHex } from "@/lib/hubColors";
import { cn, timeAgo } from "@/lib/utils";
import { ContextMenu } from "@/components/ui/ContextMenu";

interface Props {
  item: Item;
  isFocused?: boolean;
  isDraggable?: boolean;
}

export function ItemRow({ item, isFocused = false, isDraggable = false }: Props) {
  if (isDraggable) {
    return <SortableItemRow item={item} isFocused={isFocused} />;
  }
  return <ItemRowContent item={item} isFocused={isFocused} />;
}

function SortableItemRow({ item, isFocused }: { item: Item; isFocused: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <ItemRowContent
      ref={setNodeRef}
      item={item}
      isFocused={isFocused}
      style={style}
      dragHandleProps={{ ...attributes, ...listeners }}
    />
  );
}

interface ItemRowContentProps {
  item: Item;
  isFocused: boolean;
  style?: React.CSSProperties;
  dragHandleProps?: Record<string, unknown>;
}

const ItemRowContent = forwardRef<HTMLButtonElement, ItemRowContentProps>(
  function ItemRowContent({ item, isFocused, style, dragHandleProps }, ref) {
    const { selectedItemId, selectItem, currentView } = useViewStore();
    const isSelected = selectedItemId === item.id;
    const displayType = inferDisplayType(item);
    const isDone = item.status === "done";

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

    const handleContextMenuOpen = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY });
    };

    const handleContextMenuClose = () => {
      setContextMenu(null);
    };

    return (
      <>
        <button
          ref={ref}
          onClick={() => selectItem(item.id)}
          onContextMenu={handleContextMenuOpen}
          data-focused={isFocused || undefined}
          style={style}
          className={cn(
            "w-full flex items-center gap-2 px-4 py-[7px] border-b border-border-subtle transition-colors duration-100 text-left group/row",
            isSelected
              ? "bg-accent-muted border-l-2 border-l-accent"
              : isFocused
                ? "bg-bg-elevated border-l-2 border-l-text-tertiary"
                : "hover:bg-bg-elevated border-l-2 border-l-transparent",
            isDone && "opacity-60"
          )}
        >
          {/* Context menu (hover) */}
          <div className="shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity">
            <button
              onClick={handleContextMenuOpen}
              className="text-text-tertiary hover:text-text-secondary p-0.5"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <circle cx="3" cy="7" r="1.2" />
                <circle cx="7" cy="7" r="1.2" />
                <circle cx="11" cy="7" r="1.2" />
              </svg>
            </button>
          </div>

        {/* Drag Handle */}
        {dragHandleProps && (
          <div
            className="shrink-0 cursor-grab active:cursor-grabbing text-text-tertiary hover:text-text-secondary transition-colors"
            {...dragHandleProps}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="4" cy="3" r="1" />
              <circle cx="8" cy="3" r="1" />
              <circle cx="4" cy="6" r="1" />
              <circle cx="8" cy="6" r="1" />
              <circle cx="4" cy="9" r="1" />
              <circle cx="8" cy="9" r="1" />
            </svg>
          </div>
        )}

        {/* Status Icon */}
        <div className="shrink-0">
          <ItemStatusIcon status={item.status} size={16} />
        </div>

        {/* Item ID */}
        <span className="text-[11px] leading-[16px] text-text-tertiary shrink-0 font-mono">
          {item.id.slice(0, 4).toUpperCase()}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <span
            className={cn(
              "text-[13px] leading-[20px] tracking-[-0.01em] font-medium truncate block",
              isDone
                ? "text-text-secondary line-through"
                : "text-text-primary"
            )}
          >
            {item.title}
          </span>
          {/* Note preview */}
          {displayType === "note" && item.body_plain && (
            <p className="text-[12px] leading-[18px] text-text-secondary mt-0.5 line-clamp-2">
              {item.body_plain}
            </p>
          )}
        </div>

        {/* Meta (right-aligned inline attributes) */}
        <div className="shrink-0 flex items-center gap-2">
          {/* Project label with color dot */}
          {item.hub_id && currentView !== "hub" && (
            <HubLabel hubId={item.hub_id} />
          )}

          {/* Priority bar icon */}
          {item.priority !== "none" && (
            <PriorityBarIcon priority={item.priority} />
          )}

          {/* Modified date (always show) */}
          <span className="text-[11px] leading-[16px] tracking-[0.01em] text-text-tertiary whitespace-nowrap">
            {timeAgo(item.updated_at)}
          </span>
        </div>
      </button>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          itemId={item.id}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleContextMenuClose}
        />
      )}
    </>
    );
  }
);

function HubLabel({ hubId }: { hubId: string }) {
  const hub = useHubStore((s) => s.hubs.find((h) => h.id === hubId));
  if (!hub) return null;
  return (
    <div className="flex items-center gap-1 shrink-0" title={hub.name}>
      <svg width="6" height="6" viewBox="0 0 6 6">
        <circle cx="3" cy="3" r="3" fill={getHubColorHex(hub.color)} />
      </svg>
      <span className="text-[11px] leading-[16px] text-text-tertiary">
        {hub.name}
      </span>
    </div>
  );
}

function PriorityBarIcon({ priority }: { priority: string }) {
  const config: Record<string, { bars: number; color: string }> = {
    urgent: { bars: 4, color: "#FB8500" }, // Orange
    high: { bars: 3, color: "#8338EC" }, // Purple
    medium: { bars: 2, color: "#3A86FF" }, // Blue
    low: { bars: 1, color: "#8D99AE" }, // Gray
  };
  const p = config[priority];
  if (!p) return null;

  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0">
      {Array.from({ length: p.bars }).map((_, i) => (
        <rect
          key={i}
          x={2 + i * 3}
          y={10 - i * 2}
          width="2"
          height={4 + i * 2}
          fill={p.color}
          rx="0.5"
        />
      ))}
    </svg>
  );
}
