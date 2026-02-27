"use client";

import { forwardRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Item } from "@/types";
import { inferDisplayType } from "@/types";
import { ItemStatusIcon } from "./ItemStatusIcon";
import { useViewStore } from "@/stores/viewStore";
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
    const { selectedItemId, selectItem } = useViewStore();
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
          "w-full flex items-start gap-3 px-4 py-2 border-b border-border-subtle transition-colors duration-100 text-left",
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

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[14px] leading-[20px] tracking-[-0.006em] font-medium truncate",
                isDone
                  ? "text-text-secondary line-through"
                  : "text-text-primary"
              )}
            >
              {item.title}
            </span>
          </div>
          {/* Note preview (2줄) */}
          {displayType === "note" && item.body_plain && (
            <p className="text-[13px] leading-[20px] text-text-secondary mt-0.5 line-clamp-2">
              {item.body_plain}
            </p>
          )}
        </div>

        {/* Meta */}
        <div className="shrink-0 flex items-center gap-2">
          {item.priority !== "none" && (
            <PriorityBadge priority={item.priority} />
          )}
          <span className="text-[11px] leading-[16px] tracking-[0.01em] text-text-tertiary whitespace-nowrap">
            {timeAgo(item.updated_at)}
          </span>
        </div>
      </button>
    );
  }
);

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
