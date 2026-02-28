"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
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
import { ItemStatusIcon } from "./ItemStatusIcon";
import { HubHeader } from "@/components/layout/HubHeader";
import type { ViewType, ItemStatus, Item } from "@/types";

const SORTABLE_VIEWS: ViewType[] = ["inbox", "active", "all", "hub"];

const viewLabels: Record<string, string> = {
  inbox: "\uBA54\uBAA8",
  active: "\uC9C4\uD589",
  all: "\uC804\uCCB4",
  done: "\uC644\uB8CC",
  hub: "\uD504\uB85C\uC81D\uD2B8",
};

const statusLabels: Record<ItemStatus, string> = {
  inbox: "\uBA54\uBAA8",
  todo: "\uD560 \uC77C",
  in_progress: "\uC9C4\uD589 \uC911",
  done: "\uC644\uB8CC",
};

const statusOrder: ItemStatus[] = ["inbox", "todo", "in_progress", "done"];

// Views that should show items grouped by status
const GROUPED_VIEWS: ViewType[] = ["all", "hub"];

// Views that should show tab bar for sub-filtering
const TAB_VIEWS: ViewType[] = ["all", "hub"];

type TabFilter = "all" | ItemStatus;

export function ItemList() {
  const { currentView, focusedIndex, activeHubId } = useViewStore();
  const { getByStatus, getByHub, reorderItem } = useItemStore();
  const { getHubById } = useHubStore();

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<TabFilter>("all");

  const items = currentView === "hub" && activeHubId
    ? getByHub(activeHubId)
    : getByStatus(currentView as Exclude<ViewType, "hub">);

  const activeHub = activeHubId ? getHubById(activeHubId) : null;
  const listRef = useRef<HTMLDivElement>(null);
  const isSortable = SORTABLE_VIEWS.includes(currentView);
  const showGrouped = GROUPED_VIEWS.includes(currentView);
  const showTabs = TAB_VIEWS.includes(currentView);

  // Filter items by active tab
  const filteredItems = useMemo(() => {
    if (!showTabs || activeTab === "all") return items;
    return items.filter((item) => item.status === activeTab);
  }, [items, activeTab, showTabs]);

  // Group items by status
  const groupedItems = useMemo(() => {
    if (!showGrouped || activeTab !== "all") return null;
    const groups: Record<string, Item[]> = {};
    for (const status of statusOrder) {
      const group = filteredItems.filter((item) => item.status === status);
      if (group.length > 0) {
        groups[status] = group;
      }
    }
    return groups;
  }, [filteredItems, showGrouped, activeTab]);

  // Reset tab when view changes
  useEffect(() => {
    setActiveTab("all");
    setCollapsedGroups(new Set());
  }, [currentView]);

  const toggleGroup = useCallback((status: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }, []);

  // Scroll focused item into view
  useEffect(() => {
    if (!listRef.current) return;
    const focused = listRef.current.querySelector("[data-focused]");
    if (focused) {
      focused.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [focusedIndex]);

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
      const withoutActive = items.filter((i) => i.id !== active.id);
      reorderItem(active.id as string, newIndex > oldIndex ? newIndex : newIndex, withoutActive);
    },
    [items, reorderItem]
  );

  const renderItems = (itemList: Item[], draggable: boolean) => {
    if (draggable) {
      return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={itemList.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {itemList.map((item, idx) => (
              <ItemRow key={item.id} item={item} isFocused={idx === focusedIndex} isDraggable={true} />
            ))}
          </SortableContext>
        </DndContext>
      );
    }
    return itemList.map((item, idx) => (
      <ItemRow key={item.id} item={item} isFocused={idx === focusedIndex} isDraggable={false} />
    ));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Page Header */}
      <div className="shrink-0 border-b border-border-default">
        {/* Title Row */}
        <div className="h-11 flex items-center justify-between px-4">
          {currentView === "hub" && activeHub ? (
            <HubHeader hub={activeHub} />
          ) : (
            <h1 className="text-[14px] leading-[20px] font-semibold text-text-primary">
              {viewLabels[currentView]}
            </h1>
          )}
          {/* Filter & Display buttons */}
          <div className="flex items-center gap-1">
            <button className="flex items-center gap-1.5 px-2 py-1 rounded text-[12px] leading-[16px] text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                <line x1="2" y1="4" x2="12" y2="4" />
                <line x1="4" y1="7" x2="10" y2="7" />
                <line x1="6" y1="10" x2="8" y2="10" />
              </svg>
              {"\uD544\uD130"}
            </button>
            <button className="flex items-center gap-1.5 px-2 py-1 rounded text-[12px] leading-[16px] text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                <line x1="2" y1="3" x2="12" y2="3" />
                <line x1="2" y1="7" x2="8" y2="7" />
                <line x1="2" y1="11" x2="5" y2="11" />
              </svg>
              {"\uBCF4\uAE30"}
            </button>
          </div>
        </div>

        {/* Tab Bar — only for "all" and "hub" views */}
        {showTabs && (
          <div className="flex items-center gap-0.5 px-4 pb-2">
            <TabButton label={"\uC804\uCCB4"} active={activeTab === "all"} onClick={() => setActiveTab("all")} />
            <TabButton label={"\uD560 \uC77C"} active={activeTab === "todo"} onClick={() => setActiveTab("todo")} />
            <TabButton label={"\uC9C4\uD589 \uC911"} active={activeTab === "in_progress"} onClick={() => setActiveTab("in_progress")} />
            <TabButton label={"\uC644\uB8CC"} active={activeTab === "done"} onClick={() => setActiveTab("done")} />
          </div>
        )}
      </div>

      {/* List */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <EmptyState view={currentView} />
        ) : showGrouped && groupedItems && activeTab === "all" ? (
          // Grouped view
          Object.entries(groupedItems).map(([status, groupItems]) => (
            <div key={status}>
              <GroupHeader
                status={status as ItemStatus}
                count={groupItems.length}
                collapsed={collapsedGroups.has(status)}
                onToggle={() => toggleGroup(status)}
              />
              {!collapsedGroups.has(status) && renderItems(groupItems, isSortable)}
            </div>
          ))
        ) : (
          // Flat view
          renderItems(filteredItems, isSortable)
        )}
      </div>
    </div>
  );
}

// ─── Tab Button ───
function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded text-[12px] leading-[16px] font-medium transition-colors ${
        active
          ? "bg-bg-elevated text-text-primary"
          : "text-text-secondary hover:text-text-primary hover:bg-bg-surface"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Group Header ───
function GroupHeader({
  status,
  count,
  collapsed,
  onToggle,
}: {
  status: ItemStatus;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-4 py-1.5 text-left hover:bg-bg-surface transition-colors group"
    >
      {/* Collapse arrow */}
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        className={`shrink-0 text-text-tertiary transition-transform duration-150 ${
          collapsed ? "" : "rotate-90"
        }`}
      >
        <path d="M4 2L8 6L4 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {/* Status icon */}
      <ItemStatusIcon status={status} size={16} />
      {/* Label */}
      <span className="text-[13px] leading-[20px] font-medium text-text-primary">
        {statusLabels[status]}
      </span>
      {/* Count */}
      <span className="text-[12px] leading-[16px] text-text-tertiary">
        {count}
      </span>
      {/* Add button (right side) */}
      <span className="ml-auto opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-text-primary transition-opacity">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="7" y1="3" x2="7" y2="11" />
          <line x1="3" y1="7" x2="11" y2="7" />
        </svg>
      </span>
    </button>
  );
}

// ─── Empty State ───
const emptyMessages: Record<ViewType, { title: string; desc: string }> = {
  inbox: {
    title: "\uC544\uC9C1 \uBA54\uBAA8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
    desc: "\u2318K\uB97C \uB20C\uB7EC \uC0C8 \uD56D\uBAA9\uC744 \uB9CC\uB4E4\uC5B4\uBCF4\uC138\uC694",
  },
  active: {
    title: "\uC9C4\uD589 \uC911\uC778 \uD56D\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4",
    desc: "\uBA54\uBAA8\uC5D0\uC11C \uD56D\uBAA9\uC744 \uC62E\uACA8\uBCF4\uC138\uC694",
  },
  all: {
    title: "\uC544\uC9C1 \uD56D\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4",
    desc: "\u2318K\uB97C \uB20C\uB7EC \uC2DC\uC791\uD558\uC138\uC694",
  },
  done: {
    title: "\uC644\uB8CC\uB41C \uD56D\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4",
    desc: "\uD56D\uBAA9\uC744 \uC644\uB8CC\uD558\uBA74 \uC5EC\uAE30\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4",
  },
  hub: {
    title: "\uC774 \uD504\uB85C\uC81D\uD2B8\uC5D0 \uD56D\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4",
    desc: "\uD56D\uBAA9\uC744 \uD504\uB85C\uC81D\uD2B8\uC5D0 \uBC30\uC815\uD574\uBCF4\uC138\uC694",
  },
};

function EmptyState({ view }: { view: ViewType }) {
  const msg = emptyMessages[view];
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <svg width="48" height="48" viewBox="0 0 48 48" className="text-text-disabled">
        <line x1="24" y1="8" x2="24" y2="18" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <line x1="24" y1="30" x2="24" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <line x1="8" y1="24" x2="18" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <line x1="30" y1="24" x2="40" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <circle cx="24" cy="24" r="6" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
      </svg>
      <div className="text-center">
        <p className="text-text-secondary text-[14px] leading-[20px] font-medium">{msg.title}</p>
        <p className="text-text-tertiary text-[12px] leading-[16px] mt-1">{msg.desc}</p>
      </div>
    </div>
  );
}
