"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useViewStore } from "@/stores/viewStore";
import { useItemStore } from "@/stores/itemStore";
import { StatusDropdown } from "@/components/ui/StatusDropdown";
import { PriorityDropdown } from "@/components/ui/PriorityDropdown";
import { TipTapEditor } from "@/components/editor/TipTapEditor";
import { timeAgo } from "@/lib/utils";
import { X, Trash2 } from "lucide-react";
import type { ItemStatus, ItemPriority } from "@/types";

export function DetailPanel() {
  const { selectedItemId, isDetailOpen, toggleDetail } = useViewStore();
  const { items, updateItem, softDeleteItem } = useItemStore();

  const item = items.find((i) => i.id === selectedItemId);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  // 아이템 변경 시 타이틀 초기화
  const itemId = item?.id;
  const itemTitle = item?.title;
  useEffect(() => {
    if (itemTitle) setTitleValue(itemTitle);
  }, [itemId, itemTitle]);

  // 타이틀 편집 모드 진입 시 포커스
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

  if (!isDetailOpen || !item) return null;

  return (
    <aside
      className="w-detail h-full bg-bg-surface border-l border-border-default flex flex-col overflow-hidden"
      style={{
        animation: "slideIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-border-subtle">
        <button
          onClick={handleDelete}
          className="text-text-tertiary hover:text-priority-urgent transition-colors"
          title="Delete item"
        >
          <Trash2 size={16} />
        </button>
        <button
          onClick={() => toggleDetail(false)}
          className="text-text-tertiary hover:text-text-primary transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Title — 클릭하면 편집 모드 */}
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
            className="w-full text-[20px] leading-[28px] tracking-[-0.017em] font-semibold mb-6 bg-transparent outline-none border-b border-accent pb-1"
          />
        ) : (
          <h2
            onClick={() => setEditingTitle(true)}
            className="text-[20px] leading-[28px] tracking-[-0.017em] font-semibold mb-6 cursor-text hover:border-b hover:border-border-default hover:pb-1 transition-all"
          >
            {item.title}
          </h2>
        )}

        {/* Properties */}
        <div className="space-y-3 mb-6">
          <PropertyRow label="Status">
            <StatusDropdown
              value={item.status}
              onChange={handleStatusChange}
            />
          </PropertyRow>

          <PropertyRow label="Priority">
            <PriorityDropdown
              value={item.priority}
              onChange={handlePriorityChange}
            />
          </PropertyRow>

          {item.tags.length > 0 && (
            <PropertyRow label="Tags">
              <div className="flex gap-1.5 flex-wrap">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[12px] leading-[16px] bg-bg-elevated px-2 py-0.5 rounded-md text-text-secondary"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </PropertyRow>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border-subtle mb-6" />

        {/* Body — TipTap Editor (key로 아이템 전환 시 강제 리마운트) */}
        <TipTapEditor
          key={item.id}
          content={item.body as Record<string, unknown>}
          onChange={handleBodyChange}
          editable={true}
        />
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-border-subtle text-[11px] leading-[16px] tracking-[0.01em] text-text-tertiary space-y-1">
        <div>Created {timeAgo(item.created_at)}</div>
        <div>Updated {timeAgo(item.updated_at)}</div>
      </div>
    </aside>
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
    <div className="flex items-center">
      <span className="w-24 text-[13px] leading-[20px] text-text-secondary shrink-0">
        {label}
      </span>
      {children}
    </div>
  );
}
