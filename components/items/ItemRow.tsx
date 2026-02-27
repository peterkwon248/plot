"use client";

import { forwardRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Item } from "@/types";
import { inferDisplayType } from "@/types";
import { ItemStatusIcon } from "./ItemStatusIcon";
import { useViewStore } from "@/stores/viewStore";
import { useHubStore } from "@/stores/hubStore";
import { getHubColorHex } from "@/lib/hubColors";
import { cn, timeAgo } from "@/lib/utils";

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

    return (
      <button
        ref={ref}
        onClick={() => selectItem(item.id)}
        data-focused={isFocused || undefined}
        style={style}
        className={cn(
          "w-full flex items-start gap-3 px-4 py-3 border-b border-border-subtle transition-colors duration-100 text-left",
          isSelected
            ? "bg-accent-muted border-l-2 border-l-accent"
            : isFocused
              ? "bg-bg-elevated border-l-2 border-l-text-tertiary"
              : "hover:bg-bg-elevated border-l-2 border-l-transparent",
          isDone && "opacity-60"
        )}
      >
        {/* Drag Handle */}
        {dragHandleProps && (
          <div
            className="mt-1 shrink-0 cursor-grab active:cursor-grabbing text-text-tertiary hover:text-text-secondary transition-colors"
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
        <div className="mt-0.5 shrink-0">
          <ItemStatusIcon status={item.status} size={16} />
        </div>

        {/* Hub Color Dot */}
        {item.hub_id && currentView !== "hub" && (
          <HubColorDot hubId={item.hub_id} />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <span
            className={cn(
              "text-[15px] leading-[22px] tracking-[-0.01em] font-medium truncate block",
              isDone
                ? "text-text-secondary line-through"
                : "text-text-primary"
            )}
          >
            {item.title}
          </span>
          {/* 타임스탬프 서브라인 (note 프리뷰가 없을 때) */}
          {displayType === "task" && (
            <span className="text-[12px] leading-[16px] text-text-tertiary mt-0.5 block">
              {timeAgo(item.updated_at)}
            </span>
          )}
          {/* Note preview */}
          {displayType === "note" && item.body_plain && (
            <p className="text-[13px] leading-[20px] text-text-secondary mt-1 line-clamp-2">
              {item.body_plain}
            </p>
          )}
        </div>

        {/* Meta */}
        <div className="shrink-0 flex items-center gap-2">
          {item.priority !== "none" && (
            <PriorityBadge priority={item.priority} />
          )}
          {displayType === "note" && (
            <span className="text-[11px] leading-[16px] tracking-[0.01em] text-text-tertiary whitespace-nowrap">
              {timeAgo(item.updated_at)}
            </span>
          )}
        </div>
      </button>
    );
  }
);

function HubColorDot({ hubId }: { hubId: string }) {
  const hub = useHubStore((s) => s.hubs.find((h) => h.id === hubId));
  if (!hub) return null;
  return (
    <div className="mt-1 shrink-0" title={hub.name}>
      <svg width="6" height="6" viewBox="0 0 6 6">
        <circle cx="3" cy="3" r="3" fill={getHubColorHex(hub.color)} />
      </svg>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { label: string; color: string }> = {
    urgent: { label: "!!!", color: "text-priority-urgent" },
    high: { label: "!!", color: "text-priority-high" },
    medium: { label: "!", color: "text-priority-medium" },
    low: { label: "·", color: "text-priority-low" },
  };
  const p = config[priority];
  if (!p) return null;
  return (
    <span className={cn("text-[11px] leading-[16px] font-semibold", p.color)}>
      {p.label}
    </span>
  );
}
