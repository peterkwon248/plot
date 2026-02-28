"use client";

import { useCallback, useMemo } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import { useItemStore } from "@/stores/itemStore";
import { useDisplayStore } from "@/stores/displayStore";
import { useHubStore } from "@/stores/hubStore";
import { ItemStatusIcon } from "./ItemStatusIcon";
import { BoardCard } from "./BoardCard";
import type { Item, ItemStatus, ItemPriority, Hub } from "@/types";
import { getHubColorHex } from "@/lib/hubColors";

const STATUS_ORDER: { key: ItemStatus; label: string }[] = [
  { key: "inbox", label: "\uBA54\uBAA8" },
  { key: "todo", label: "\uD560 \uC77C" },
  { key: "in_progress", label: "\uC9C4\uD589 \uC911" },
  { key: "done", label: "\uC644\uB8CC" },
];

const PRIORITY_ORDER: { key: ItemPriority; label: string }[] = [
  { key: "urgent", label: "\uAE34\uAE09" },
  { key: "high", label: "\uB192\uC74C" },
  { key: "medium", label: "\uBCF4\uD1B5" },
  { key: "low", label: "\uB0AE\uC74C" },
  { key: "none", label: "\uC5C6\uC74C" },
];

interface BoardViewProps {
  items: Item[];
}

export function BoardView({ items }: BoardViewProps) {
  const updateItem = useItemStore((s) => s.updateItem);
  const { settings } = useDisplayStore();
  const hubList = useHubStore((s) => s.hubs);
  const hubs = useMemo(() => hubList.filter(h => !h.archived_at).sort((a, b) => a.sort_order - b.sort_order), [hubList]);

  const groupBy = settings.groupBy !== "none" ? settings.groupBy : "status";

  // Build columns based on groupBy
  const columns = buildColumns(groupBy, items, hubs);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const itemId = active.id as string;
      const targetColumnId = over.id as string;

      // Find which column the target is in
      const targetColumn = columns.find(
        (col) => col.id === targetColumnId || col.items.some((i) => i.id === targetColumnId)
      );
      if (!targetColumn) return;

      // Apply the change based on groupBy
      if (groupBy === "status") {
        updateItem(itemId, { status: targetColumn.id as ItemStatus });
      } else if (groupBy === "priority") {
        updateItem(itemId, { priority: targetColumn.id as ItemPriority });
      } else if (groupBy === "hub") {
        updateItem(itemId, { hub_id: targetColumn.id === "_none" ? null : targetColumn.id });
      }
    },
    [columns, groupBy, updateItem]
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <div className="flex gap-3 h-full min-w-min">
          {columns.map((col) => (
            <BoardColumn
              key={col.id}
              id={col.id}
              label={col.label}
              icon={col.icon}
              count={col.items.length}
              items={col.items}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}

interface ColumnData {
  id: string;
  label: string;
  icon?: React.ReactNode;
  items: Item[];
}

function buildColumns(
  groupBy: string,
  items: Item[],
  hubs: Hub[]
): ColumnData[] {
  if (groupBy === "status") {
    return STATUS_ORDER.map(({ key, label }) => ({
      id: key,
      label,
      icon: <ItemStatusIcon status={key} size={14} />,
      items: items.filter((i) => i.status === key),
    }));
  }
  if (groupBy === "priority") {
    return PRIORITY_ORDER.map(({ key, label }) => ({
      id: key,
      label,
      items: items.filter((i) => i.priority === key),
    }));
  }
  if (groupBy === "hub") {
    const cols: ColumnData[] = [
      {
        id: "_none",
        label: "\uD504\uB85C\uC81D\uD2B8 \uC5C6\uC74C",
        items: items.filter((i) => !i.hub_id),
      },
    ];
    for (const hub of hubs) {
      cols.push({
        id: hub.id,
        label: hub.name,
        icon: (
          <svg width="8" height="8" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="4" fill={getHubColorHex(hub.color)} />
          </svg>
        ),
        items: items.filter((i) => i.hub_id === hub.id),
      });
    }
    return cols;
  }
  // Default: group by status
  return STATUS_ORDER.map(({ key, label }) => ({
    id: key,
    label,
    icon: <ItemStatusIcon status={key} size={14} />,
    items: items.filter((i) => i.status === key),
  }));
}

function BoardColumn({
  id,
  label,
  icon,
  count,
  items,
}: {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count: number;
  items: Item[];
}) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="w-[280px] shrink-0 flex flex-col bg-bg-secondary/50 rounded-lg border border-border-subtle">
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border-subtle">
        {icon}
        <span className="text-[13px] leading-[20px] font-medium text-text-primary">
          {label}
        </span>
        <span className="text-[12px] leading-[16px] text-text-tertiary">
          {count}
        </span>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-2 min-h-[100px]"
      >
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-disabled text-[12px]">
            항목 없음
          </div>
        ) : (
          items.map((item) => (
            <BoardCard key={item.id} item={item} />
          ))
        )}
      </div>
    </div>
  );
}
