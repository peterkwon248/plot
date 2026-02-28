"use client";

import { useItemStore } from "@/stores/itemStore";
import { useViewStore } from "@/stores/viewStore";
import { useHubStore } from "@/stores/hubStore";
import { ItemStatusIcon } from "@/components/items/ItemStatusIcon";
import { getHubColorHex } from "@/lib/hubColors";
import type { ItemStatus, ItemPriority } from "@/types";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";

const STATUS_OPTIONS: Array<{ value: ItemStatus; label: string }> = [
  { value: "inbox", label: "메모" },
  { value: "todo", label: "할 일" },
  { value: "in_progress", label: "진행 중" },
  { value: "done", label: "완료" },
];

const PRIORITY_OPTIONS: Array<{ value: ItemPriority; label: string }> = [
  { value: "none", label: "없음" },
  { value: "low", label: "낮음" },
  { value: "medium", label: "보통" },
  { value: "high", label: "높음" },
  { value: "urgent", label: "긴급" },
];

interface ItemContextMenuProps {
  itemId: string;
  children: React.ReactNode;
}

export function ItemContextMenu({ itemId, children }: ItemContextMenuProps) {
  const updateItem = useItemStore((s) => s.updateItem);
  const softDeleteItem = useItemStore((s) => s.softDeleteItem);
  const selectItem = useViewStore((s) => s.selectItem);
  const hubs = useHubStore((s) => s.hubs);

  const handleStatusChange = (status: ItemStatus) => {
    updateItem(itemId, { status });
  };

  const handlePriorityChange = (priority: ItemPriority) => {
    updateItem(itemId, { priority });
  };

  const handleProjectChange = (hubId: string | null) => {
    updateItem(itemId, { hub_id: hubId });
  };

  const handleDelete = () => {
    softDeleteItem(itemId);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-[200px]">
        {/* Open Details */}
        <ContextMenuItem onClick={() => selectItem(itemId)}>
          상세 열기
          <ContextMenuShortcut>Enter</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Status Change */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>상태 변경</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-[180px]">
            {STATUS_OPTIONS.map((option) => (
              <ContextMenuItem
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
              >
                <ItemStatusIcon status={option.value} size={16} />
                {option.label}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Priority Change */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>중요도 변경</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-[180px]">
            {PRIORITY_OPTIONS.map((option) => (
              <ContextMenuItem
                key={option.value}
                onClick={() => handlePriorityChange(option.value)}
              >
                <PriorityIndicator priority={option.value} />
                {option.label}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Project Assignment */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>프로젝트 배정</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-[180px]">
            <ContextMenuItem onClick={() => handleProjectChange(null)}>
              <div className="w-4 h-4" />
              없음
            </ContextMenuItem>
            {hubs.map((hub) => (
              <ContextMenuItem
                key={hub.id}
                onClick={() => handleProjectChange(hub.id)}
              >
                <svg width="6" height="6" viewBox="0 0 6 6" className="ml-1">
                  <circle cx="3" cy="3" r="3" fill={getHubColorHex(hub.color)} />
                </svg>
                {hub.name}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* Delete */}
        <ContextMenuItem
          onClick={handleDelete}
          className="text-red-500 focus:text-red-500"
        >
          삭제
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function PriorityIndicator({ priority }: { priority: ItemPriority }) {
  const config: Record<ItemPriority, { bars: number; color: string } | null> = {
    none: null,
    low: { bars: 1, color: "#8D99AE" },
    medium: { bars: 2, color: "#3A86FF" },
    high: { bars: 3, color: "#8338EC" },
    urgent: { bars: 4, color: "#FB8500" },
  };

  const p = config[priority];
  if (!p) {
    return <div className="w-4 h-4" />;
  }

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
