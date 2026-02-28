"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useViewStore } from "@/stores/viewStore";
import { useItemStore } from "@/stores/itemStore";
import { StatusDropdown } from "@/components/ui/StatusDropdown";
import { PriorityDropdown } from "@/components/ui/PriorityDropdown";
import { HubDropdown } from "@/components/ui/HubDropdown";
import { DatePicker } from "@/components/ui/DatePicker";
import { TagEditor } from "@/components/ui/TagEditor";
import { TipTapEditor } from "@/components/editor/TipTapEditor";
import { ChainSection } from "@/components/detail/ChainSection";
import { ActivityTimeline } from "@/components/detail/ActivityTimeline";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { timeAgo } from "@/lib/utils";
import type { ItemStatus, ItemPriority } from "@/types";

const viewLabels: Record<string, string> = {
  inbox: "메모",
  active: "진행",
  all: "전체",
  done: "완료",
  hub: "프로젝트",
};

export function DetailPanel() {
  const { selectedItemId, isDetailOpen, toggleDetail, currentView, activeHubId } = useViewStore();
  const { items, updateItem, softDeleteItem, getByStatus, getByHub } = useItemStore();

  // Current view's filtered items
  const viewItems = useMemo(() => {
    if (currentView === "hub" && activeHubId) {
      return getByHub(activeHubId);
    }
    return getByStatus(currentView as Exclude<typeof currentView, "hub">);
  }, [currentView, activeHubId, getByStatus, getByHub]);

  const item = items.find((i) => i.id === selectedItemId);
  const currentIndex = viewItems.findIndex((i) => i.id === selectedItemId);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  const itemId = item?.id;
  const itemTitle = item?.title;
  useEffect(() => {
    if (itemTitle) setTitleValue(itemTitle);
  }, [itemId, itemTitle]);

  useEffect(() => {
    if (editingTitle) titleRef.current?.focus();
  }, [editingTitle]);

  const saveTitle = useCallback(() => {
    if (!item) return;
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== item.title) {
      updateItem(item.id, { title: trimmed });
    } else {
      setTitleValue(item.title);
    }
    setEditingTitle(false);
  }, [item, titleValue, updateItem]);

  const handleStatusChange = useCallback(
    (status: ItemStatus) => {
      if (item) updateItem(item.id, { status });
    },
    [item, updateItem]
  );

  const handlePriorityChange = useCallback(
    (priority: ItemPriority) => {
      if (item) updateItem(item.id, { priority });
    },
    [item, updateItem]
  );

  const handleHubChange = useCallback(
    (hubId: string | null) => {
      if (item) updateItem(item.id, { hub_id: hubId });
    },
    [item, updateItem]
  );

  const handleBodyChange = useCallback(
    (json: Record<string, unknown>) => {
      if (item) updateItem(item.id, { body: json });
    },
    [item, updateItem]
  );

  const handleDelete = useCallback(() => {
    if (!item) return;
    softDeleteItem(item.id);
    toggleDetail(false);
  }, [item, softDeleteItem, toggleDetail]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      const { selectItem } = useViewStore.getState();
      selectItem(viewItems[currentIndex - 1].id);
    }
  }, [currentIndex, viewItems]);

  const goToNext = useCallback(() => {
    if (currentIndex < viewItems.length - 1) {
      const { selectItem } = useViewStore.getState();
      selectItem(viewItems[currentIndex + 1].id);
    }
  }, [currentIndex, viewItems]);

  if (!isDetailOpen || !item) return null;

  return (
    <div className="absolute inset-0 z-30 bg-bg-primary flex flex-col" style={{ animation: "detailPanelIn 150ms ease forwards" }}>
      {/* Top Bar */}
      <div className="h-12 shrink-0 flex items-center justify-between px-6 border-b border-border-default">
        {/* Left: Back + Breadcrumb */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => toggleDetail(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="8" x2="4" y2="8" />
                  <polyline points="8,4 4,8 8,12" />
                </svg>
              </button>
            </TooltipTrigger>
            <TooltipContent>뒤로 (Esc)</TooltipContent>
          </Tooltip>
          <span className="text-[13px] leading-[20px] text-text-secondary">
            {viewLabels[currentView]}
          </span>
          <span className="text-[13px] leading-[20px] text-text-tertiary">&gt;</span>
          <span className="text-[13px] leading-[20px] text-text-primary font-medium truncate max-w-[300px]">
            {item.title}
          </span>
        </div>

        {/* Right: Nav + Delete */}
        <div className="flex items-center gap-1">
          {/* Item counter */}
          <span className="text-[12px] leading-[16px] text-text-tertiary mr-2">
            {currentIndex + 1}/{viewItems.length}
          </span>
          {/* Prev */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={goToPrev}
                disabled={currentIndex <= 0}
                className="p-1 text-text-secondary hover:text-text-primary disabled:text-text-disabled transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="10,3 7,7 10,11" />
                </svg>
              </button>
            </TooltipTrigger>
            <TooltipContent>이전 (K)</TooltipContent>
          </Tooltip>
          {/* Next */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={goToNext}
                disabled={currentIndex >= viewItems.length - 1}
                className="p-1 text-text-secondary hover:text-text-primary disabled:text-text-disabled transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4,3 7,7 4,11" />
                </svg>
              </button>
            </TooltipTrigger>
            <TooltipContent>다음 (J)</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Body — two column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main content — left */}
        <div className="flex-1 overflow-y-auto px-16 py-8 max-w-3xl">
          {/* Title */}
          {editingTitle ? (
            <input
              ref={titleRef}
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") {
                  setTitleValue(item.title);
                  setEditingTitle(false);
                }
              }}
              className="w-full text-[24px] leading-[32px] tracking-[-0.02em] font-semibold mb-8 bg-transparent outline-none border-b border-text-tertiary pb-1 text-text-primary"
            />
          ) : (
            <h1
              onClick={() => setEditingTitle(true)}
              className="text-[24px] leading-[32px] tracking-[-0.02em] font-semibold mb-8 cursor-text border-b border-transparent hover:border-border-subtle pb-1 text-text-primary"
            >
              {item.title}
            </h1>
          )}

          {/* Editor */}
          <TipTapEditor
            key={item.id}
            content={item.body as Record<string, unknown>}
            onChange={handleBodyChange}
            editable={true}
          />

          {/* Activity Timeline */}
          <ActivityTimeline itemId={item.id} />
        </div>

        {/* Right sidebar — properties */}
        <div className="w-[280px] shrink-0 border-l border-border-default overflow-y-auto p-6">
          <div className="mb-3">
            <span className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium">
              속성
            </span>
          </div>
          <div className="space-y-1">
            <PropertyRow label="상태">
              <StatusDropdown value={item.status} onChange={handleStatusChange} />
            </PropertyRow>

            <PropertyRow label="중요도">
              <PriorityDropdown value={item.priority} onChange={handlePriorityChange} />
            </PropertyRow>

            <PropertyRow label="프로젝트">
              <HubDropdown value={item.hub_id} onChange={handleHubChange} />
            </PropertyRow>

            <PropertyRow label="마감일">
              <DatePicker
                value={item.due_date}
                onChange={(date) => updateItem(item.id, { due_date: date })}
              />
            </PropertyRow>

            <PropertyRow label="태그">
              <TagEditor
                tags={item.tags}
                onChange={(tags) => updateItem(item.id, { tags })}
              />
            </PropertyRow>
          </div>

          {/* Chain Section */}
          <ChainSection itemId={item.id} />

          {/* Divider */}
          <div className="border-t border-border-subtle my-6" />

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 text-[13px] leading-[20px] text-text-tertiary hover:text-priority-urgent transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="2,4 12,4" />
              <path d="M5,4V2.5C5,2.2,5.2,2,5.5,2h3C8.8,2,9,2.2,9,2.5V4" />
              <path d="M3,4l0.7,8.1c0,0.5,0.4,0.9,0.9,0.9h4.8c0.5,0,0.9-0.4,0.9-0.9L11,4" />
            </svg>
            삭제
          </button>

          {/* Timestamps */}
          <div className="mt-6 space-y-1 text-[11px] leading-[16px] tracking-[0.01em] text-text-tertiary">
            <div>생성 {timeAgo(item.created_at)}</div>
            <div>수정 {timeAgo(item.updated_at)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between h-8">
      <span className="text-[13px] leading-[20px] text-text-tertiary shrink-0">
        {label}
      </span>
      <div className="flex items-center">
        {children}
      </div>
    </div>
  );
}
