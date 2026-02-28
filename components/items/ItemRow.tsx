"use client";

import { forwardRef, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Item } from "@/types";
import { inferDisplayType } from "@/types";
import { ItemStatusIcon } from "./ItemStatusIcon";
import { useViewStore } from "@/stores/viewStore";
import { useHubStore } from "@/stores/hubStore";
import { useDisplayStore } from "@/stores/displayStore";
import { getHubColorHex } from "@/lib/hubColors";
import { cn, timeAgo } from "@/lib/utils";
import { ItemContextMenu } from "@/components/ui/ContextMenu";
import { isBefore, isToday, differenceInDays, format } from "date-fns";
import { ko } from "date-fns/locale";

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
    const { settings: displaySettings } = useDisplayStore();
    const { showProperties } = displaySettings;
    const isSelected = selectedItemId === item.id;
    const displayType = inferDisplayType(item);
    const isDone = item.status === "done";

    const handleTriggerContextMenu = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Dispatch a native contextmenu event on the row so Radix picks it up
      const row = e.currentTarget.closest("[data-item-row]");
      if (row) {
        const rect = e.currentTarget.getBoundingClientRect();
        row.dispatchEvent(
          new MouseEvent("contextmenu", {
            bubbles: true,
            clientX: rect.left,
            clientY: rect.bottom,
          })
        );
      }
    }, []);

    return (
      <ItemContextMenu itemId={item.id}>
        <button
          ref={ref}
          onClick={() => selectItem(item.id)}
          data-focused={isFocused || undefined}
          data-item-row
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
          {/* Context menu (hover) — 3-dot trigger */}
          <div className="shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity">
            <button
              onClick={handleTriggerContextMenu}
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
          {showProperties.id && (
            <span className="text-[11px] leading-[16px] text-text-tertiary shrink-0 font-mono">
              {item.id.slice(0, 4).toUpperCase()}
            </span>
          )}

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
            {showProperties.preview && displayType === "note" && item.body_plain && (
              <p className="text-[12px] leading-[18px] text-text-secondary mt-0.5 line-clamp-2">
                {item.body_plain}
              </p>
            )}
          </div>

          {/* Meta (right-aligned inline attributes) */}
          <div className="shrink-0 flex items-center gap-2">
            {/* Project label with color dot */}
            {showProperties.hub && item.hub_id && currentView !== "hub" && (
              <HubLabel hubId={item.hub_id} />
            )}

            {/* Priority bar icon */}
            {showProperties.priority && item.priority !== "none" && (
              <PriorityBarIcon priority={item.priority} />
            )}

            {/* Due date */}
            {showProperties.date && item.due_date && (
              <DueDateLabel dueDate={item.due_date} />
            )}

            {/* Modified date */}
            {showProperties.date && (
              <span className="text-[11px] leading-[16px] tracking-[0.01em] text-text-tertiary whitespace-nowrap">
                {timeAgo(item.updated_at)}
              </span>
            )}
          </div>
        </button>
      </ItemContextMenu>
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

function DueDateLabel({ dueDate }: { dueDate: string }) {
  const date = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = isBefore(date, today) && !isToday(date);
  const dueToday = isToday(date);
  const daysUntil = differenceInDays(date, today);

  let label: string;
  let colorClass: string;

  if (overdue) {
    label = "지남";
    colorClass = "text-[#EB5757]";
  } else if (dueToday) {
    label = "오늘";
    colorClass = "text-accent";
  } else if (daysUntil <= 3) {
    label = `${daysUntil}일 후`;
    colorClass = "text-text-secondary";
  } else {
    label = format(date, "M/d", { locale: ko });
    colorClass = "text-text-tertiary";
  }

  return (
    <span className={`text-[11px] leading-[16px] whitespace-nowrap flex items-center gap-1 ${colorClass}`}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
        <rect x="1" y="1.5" width="8" height="7" rx="1" />
        <line x1="1" y1="4" x2="9" y2="4" />
      </svg>
      {label}
    </span>
  );
}

function PriorityBarIcon({ priority }: { priority: string }) {
  const config: Record<string, { bars: number; color: string }> = {
    urgent: { bars: 4, color: "#FB8500" },
    high: { bars: 3, color: "#8338EC" },
    medium: { bars: 2, color: "#3A86FF" },
    low: { bars: 1, color: "#8D99AE" },
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
