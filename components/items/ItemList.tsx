"use client";

import { useRef, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useItemStore } from "@/stores/itemStore";
import { useViewStore } from "@/stores/viewStore";
import { useHubStore } from "@/stores/hubStore";
import { ItemRow } from "./ItemRow";
import { HubHeader } from "@/components/layout/HubHeader";
import type { ViewType } from "@/types";

// sort_order 기반 정렬이 가능한 뷰 (done은 완료일 기준이라 드래그 불가)
const SORTABLE_VIEWS: ViewType[] = ["inbox", "active", "all", "hub"];

export function ItemList() {
  const { currentView, focusedIndex, activeHubId } = useViewStore();
  const { getByStatus, getByHub, reorderItem } = useItemStore();
  const { getHubById } = useHubStore();

  const items = currentView === "hub" && activeHubId
    ? getByHub(activeHubId)
    : getByStatus(currentView as Exclude<ViewType, "hub">);

  const activeHub = activeHubId ? getHubById(activeHubId) : null;
  const listRef = useRef<HTMLDivElement>(null);
  const isSortable = SORTABLE_VIEWS.includes(currentView);

  const viewLabels: Record<string, string> = {
    inbox: "Inbox",
    active: "Active",
    all: "All Items",
    done: "Done",
    hub: "Project",
  };

  // 포커스된 아이템을 뷰포트에 스크롤
  useEffect(() => {
    if (!listRef.current) return;
    const focused = listRef.current.querySelector("[data-focused]");
    if (focused) {
      focused.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [focusedIndex]);

  // dnd-kit 센서 설정 (약간의 거리를 둬야 클릭과 구분)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      // 이동 대상을 제외한 나머지 배열에서 newIndex 위치의 sort_order 계산
      const withoutActive = items.filter((i) => i.id !== active.id);
      reorderItem(active.id as string, newIndex > oldIndex ? newIndex : newIndex, withoutActive);
    },
    [items, reorderItem]
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* View Header */}
      {currentView === "hub" && activeHub ? (
        <HubHeader hub={activeHub} />
      ) : (
        <div className="h-12 flex items-center px-4 border-b border-border-default">
          <h1 className="text-[24px] leading-[32px] tracking-[-0.02em] font-semibold">
            {viewLabels[currentView]}
          </h1>
        </div>
      )}

      {/* List */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <EmptyState view={currentView} />
        ) : isSortable ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item, idx) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  isFocused={idx === focusedIndex}
                  isDraggable={true}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          items.map((item, idx) => (
            <ItemRow
              key={item.id}
              item={item}
              isFocused={idx === focusedIndex}
              isDraggable={false}
            />
          ))
        )}
      </div>
    </div>
  );
}

const emptyMessages: Record<ViewType, { title: string; desc: string }> = {
  inbox: {
    title: "Inbox is empty",
    desc: "Press C or \u2318K to create a new item",
  },
  active: {
    title: "No active items",
    desc: "Move items to Todo or In Progress to see them here",
  },
  all: {
    title: "No items yet",
    desc: "Press C to get started",
  },
  done: {
    title: "Nothing completed yet",
    desc: "Mark items as done with the status dropdown or press 4",
  },
  hub: {
    title: "No items yet",
    desc: "Press C to add one",
  },
};

function EmptyState({ view }: { view: ViewType }) {
  const msg = emptyMessages[view];
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <svg width="48" height="48" viewBox="0 0 48 48" className="text-text-disabled">
        <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
        <path d="M18 24h12M24 18v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </svg>
      <div className="text-center">
        <p className="text-text-secondary text-[14px] leading-[20px] font-medium">{msg.title}</p>
        <p className="text-text-tertiary text-[12px] leading-[16px] mt-1">{msg.desc}</p>
      </div>
    </div>
  );
}
