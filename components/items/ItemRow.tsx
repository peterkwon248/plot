"use client";

import { forwardRef, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Item } from "@/types";
import { inferDisplayType } from "@/types";
import { ItemStatusIcon } from "./ItemStatusIcon";
import { useViewStore } from "@/stores/viewStore";
import { useItemStore } from "@/stores/itemStore";
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
    const { updateItem } = useItemStore();
    const { settings: displaySettings } = useDisplayStore();
    const { showProperties } = displaySettings;
    const isSelected = selectedItemId === item.id;
    const displayType = inferDisplayType(item);
    const isDone = item.status === "done";

    const statusCycle: Item["status"][] = ["inbox", "todo", "in_progress", "done"];
    const priorityCycle: Item["priority"][] = ["none", "low", "medium", "high", "urgent"];

    const cycleStatus = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      const idx = statusCycle.indexOf(item.status);
      const next = statusCycle[(idx + 1) % statusCycle.length];
      updateItem(item.id, { status: next });
    }, [item.id, item.status, updateItem]);

    const cyclePriority = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      const idx = priorityCycle.indexOf(item.priority);
      const next = priorityCycle[(idx + 1) % priorityCycle.length];
      updateItem(item.id, { priority: next });
    }, [item.id, item.priority, updateItem]);

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
            "w-full flex items-center gap-1.5 px-6 h-11 transition-colors duration-75 text-left group/row relative animate-[listItemIn_150ms_ease_forwards]",
            isSelected
              ? "bg-accent-muted"
              : isFocused
                ? "bg-bg-surface/60"
                : "hover:bg-bg-surface/40",
            isDone && "opacity-60"
          )}
        >
          {/* Drag Handle (positioned on hover) */}
          {dragHandleProps && (
            <div
              className="absolute left-0 ml-1.5 opacity-0 group-hover/row:opacity-100 cursor-grab active:cursor-grabbing text-text-tertiary hover:text-text-secondary transition-opacity"
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

          {/* Priority icon (always reserve space) */}
          <div className="shrink-0 w-[14px]">
            {showProperties.priority && item.priority !== "none" ? (
              <PriorityBarIcon priority={item.priority} />
            ) : null}
          </div>

          {/* Item ID (identifier) */}
          {showProperties.id && (
            <span className="text-[11px] leading-[16px] text-text-tertiary font-mono w-[52px] shrink-0 truncate">
              {item.id.slice(0, 6).toUpperCase()}
            </span>
          )}

          {/* Status Icon */}
          <div className="shrink-0">
            <ItemStatusIcon status={item.status} size={14} />
          </div>

          {/* Title (flex-1) */}
          <div className="flex-1 min-w-0 ml-1">
            <span
              className={cn(
                "text-[13px] leading-[20px] font-medium truncate block",
                isDone
                  ? "text-text-secondary line-through"
                  : "text-text-primary"
              )}
            >
              {item.title}
            </span>
            {/* Note preview (hidden due to h-11 fixed height, but kept in code) */}
            {showProperties.preview && displayType === "note" && item.body_plain && (
              <p className="text-[12px] leading-[18px] text-text-secondary mt-0.5 line-clamp-2 hidden overflow-hidden">
                {item.body_plain}
              </p>
            )}
          </div>

          {/* Meta — 기본 상태 (hover시 숨김) */}
          <div className="shrink-0 flex items-center gap-2.5 group-hover/row:hidden">
            {showProperties.hub && item.hub_id && currentView !== "hub" && (
              <HubLabel hubId={item.hub_id} />
            )}
            {showProperties.date && item.due_date && (
              <DueDateLabel dueDate={item.due_date} />
            )}
            {showProperties.date && (
              <span className="text-[11px] text-text-tertiary whitespace-nowrap w-[48px] text-right">
                {timeAgo(item.updated_at)}
              </span>
            )}
          </div>

          {/* hover 시 인라인 액션 */}
          <div className="shrink-0 hidden group-hover/row:flex items-center gap-0.5">
            {/* 상태 순환 */}
            <button
              onClick={cycleStatus}
              className="p-1 rounded hover:bg-bg-elevated text-text-tertiary hover:text-text-primary transition-colors"
              title="상태 변경"
            >
              <ItemStatusIcon status={item.status} size={14} />
            </button>
            {/* 우선순위 순환 */}
            <button
              onClick={cyclePriority}
              className="p-1 rounded hover:bg-bg-elevated text-text-tertiary hover:text-text-primary transition-colors"
              title="중요도 변경"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M7 2v7M7 12v0" strokeLinecap="round" />
              </svg>
            </button>
            {/* 3-dot 메뉴 */}
            <button
              onClick={handleTriggerContextMenu}
              className="p-1 rounded hover:bg-bg-elevated text-text-tertiary hover:text-text-primary transition-colors"
              title="더보기"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <circle cx="3" cy="7" r="1.2" />
                <circle cx="7" cy="7" r="1.2" />
                <circle cx="11" cy="7" r="1.2" />
              </svg>
            </button>
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
