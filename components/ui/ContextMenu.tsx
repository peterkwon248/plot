"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useItemStore } from "@/stores/itemStore";
import { useViewStore } from "@/stores/viewStore";
import { useHubStore } from "@/stores/hubStore";
import { ItemStatusIcon } from "@/components/items/ItemStatusIcon";
import { getHubColorHex } from "@/lib/hubColors";
import type { ItemStatus, ItemPriority } from "@/types";

interface ContextMenuProps {
  itemId: string;
  x: number;
  y: number;
  onClose: () => void;
}

interface SubMenu {
  type: "status" | "priority" | "project" | null;
  x: number;
  y: number;
}

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

export function ContextMenu({ itemId, x, y, onClose }: ContextMenuProps) {
  const [mounted, setMounted] = useState(false);
  const [subMenu, setSubMenu] = useState<SubMenu>({ type: null, x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const subMenuRef = useRef<HTMLDivElement>(null);

  const updateItem = useItemStore((s) => s.updateItem);
  const softDeleteItem = useItemStore((s) => s.softDeleteItem);
  const selectItem = useViewStore((s) => s.selectItem);
  const hubs = useHubStore((s) => s.hubs);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        (!subMenuRef.current || !subMenuRef.current.contains(e.target as Node))
      ) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Adjust position to prevent overflow
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 8;
      }
      if (rect.bottom > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 8;
      }

      if (adjustedX !== x || adjustedY !== y) {
        menuRef.current.style.left = `${adjustedX}px`;
        menuRef.current.style.top = `${adjustedY}px`;
      }
    }
  }, [x, y]);

  const handleOpenDetails = () => {
    selectItem(itemId);
    onClose();
  };

  const handleStatusChange = (status: ItemStatus) => {
    updateItem(itemId, { status });
    onClose();
  };

  const handlePriorityChange = (priority: ItemPriority) => {
    updateItem(itemId, { priority });
    onClose();
  };

  const handleProjectChange = (hubId: string | null) => {
    updateItem(itemId, { hub_id: hubId });
    onClose();
  };

  const handleDelete = () => {
    softDeleteItem(itemId);
    onClose();
  };

  const handleSubMenuOpen = (
    type: "status" | "priority" | "project",
    parentRect: DOMRect
  ) => {
    setSubMenu({
      type,
      x: parentRect.right + 4,
      y: parentRect.top,
    });
  };

  const handleSubMenuClose = () => {
    setSubMenu({ type: null, x: 0, y: 0 });
  };

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Main Menu */}
      <div
        ref={menuRef}
        className="fixed bg-bg-surface border border-border-default rounded-lg shadow-xl min-w-[200px] py-1 z-50"
        style={{ left: x, top: y, animation: "contextMenuIn 100ms ease forwards" }}
      >
        {/* Open Details */}
        <button
          onClick={handleOpenDetails}
          className="w-full flex items-center justify-between px-3 h-8 text-[13px] leading-[20px] text-text-primary hover:bg-bg-elevated transition-colors"
        >
          <span>상세 열기</span>
          <span className="text-text-tertiary text-[11px]">Enter</span>
        </button>

        <div className="border-t border-border-subtle my-1" />

        {/* Status Change */}
        <button
          onMouseEnter={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            handleSubMenuOpen("status", rect);
          }}
          onMouseLeave={handleSubMenuClose}
          className="w-full flex items-center justify-between px-3 h-8 text-[13px] leading-[20px] text-text-primary hover:bg-bg-elevated transition-colors"
        >
          <span>상태 변경</span>
          <span className="text-text-tertiary">→</span>
        </button>

        {/* Priority Change */}
        <button
          onMouseEnter={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            handleSubMenuOpen("priority", rect);
          }}
          onMouseLeave={handleSubMenuClose}
          className="w-full flex items-center justify-between px-3 h-8 text-[13px] leading-[20px] text-text-primary hover:bg-bg-elevated transition-colors"
        >
          <span>중요도 변경</span>
          <span className="text-text-tertiary">→</span>
        </button>

        {/* Project Assignment */}
        <button
          onMouseEnter={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            handleSubMenuOpen("project", rect);
          }}
          onMouseLeave={handleSubMenuClose}
          className="w-full flex items-center justify-between px-3 h-8 text-[13px] leading-[20px] text-text-primary hover:bg-bg-elevated transition-colors"
        >
          <span>프로젝트 배정</span>
          <span className="text-text-tertiary">→</span>
        </button>

        <div className="border-t border-border-subtle my-1" />

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="w-full flex items-center justify-between px-3 h-8 text-[13px] leading-[20px] text-red-500 hover:bg-bg-elevated transition-colors"
        >
          <span>삭제</span>
          <span className="text-[11px]">⌫</span>
        </button>
      </div>

      {/* SubMenu */}
      {subMenu.type && (
        <div
          ref={subMenuRef}
          className="fixed bg-bg-surface border border-border-default rounded-lg shadow-xl min-w-[180px] py-1 z-50"
          style={{ left: subMenu.x, top: subMenu.y }}
          onMouseEnter={() => setSubMenu((prev) => prev)}
          onMouseLeave={handleSubMenuClose}
        >
          {subMenu.type === "status" &&
            STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                className="w-full flex items-center gap-2 px-3 h-8 text-[13px] leading-[20px] text-text-primary hover:bg-bg-elevated transition-colors"
              >
                <ItemStatusIcon status={option.value} size={16} />
                <span>{option.label}</span>
              </button>
            ))}

          {subMenu.type === "priority" &&
            PRIORITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePriorityChange(option.value)}
                className="w-full flex items-center gap-2 px-3 h-8 text-[13px] leading-[20px] text-text-primary hover:bg-bg-elevated transition-colors"
              >
                <PriorityIndicator priority={option.value} />
                <span>{option.label}</span>
              </button>
            ))}

          {subMenu.type === "project" && (
            <>
              <button
                onClick={() => handleProjectChange(null)}
                className="w-full flex items-center gap-2 px-3 h-8 text-[13px] leading-[20px] text-text-primary hover:bg-bg-elevated transition-colors"
              >
                <div className="w-4 h-4" />
                <span>없음</span>
              </button>
              {hubs.map((hub) => (
                <button
                  key={hub.id}
                  onClick={() => handleProjectChange(hub.id)}
                  className="w-full flex items-center gap-2 px-3 h-8 text-[13px] leading-[20px] text-text-primary hover:bg-bg-elevated transition-colors"
                >
                  <svg width="6" height="6" viewBox="0 0 6 6" className="ml-1">
                    <circle cx="3" cy="3" r="3" fill={getHubColorHex(hub.color)} />
                  </svg>
                  <span>{hub.name}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </>,
    document.body
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
