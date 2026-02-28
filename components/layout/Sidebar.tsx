"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useViewStore } from "@/stores/viewStore";
import { useItemStore } from "@/stores/itemStore";
import { useCustomViewStore } from "@/stores/customViewStore";
import { SidebarItem } from "./SidebarItem";
import { HubSection } from "./HubSection";
import { CustomViewEditor } from "@/components/views/CustomViewEditor";

type SidebarView = "inbox" | "active" | "all" | "done";

const NAV_VIEWS: { id: SidebarView; label: string }[] = [
  { id: "inbox", label: "메모" },
  { id: "active", label: "진행" },
  { id: "all", label: "전체" },
  { id: "done", label: "완료" },
];

const DEFAULT_WIDTH = 220;
const MIN_WIDTH = 180;
const MAX_WIDTH = 320;

export function Sidebar() {
  const { currentView, setView, toggleCommandBar, setCustomView } = useViewStore();
  const { getByStatus } = useItemStore();
  const { views: customViews } = useCustomViewStore();
  const [showViewEditor, setShowViewEditor] = useState(false);

  const [width, setWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("plot-sidebar-width");
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= MIN_WIDTH && val <= MAX_WIDTH) return val;
      }
    }
    return DEFAULT_WIDTH;
  });

  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  useEffect(() => {
    localStorage.setItem("plot-sidebar-width", String(width));
  }, [width]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [width]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleDoubleClick = useCallback(() => {
    setWidth(DEFAULT_WIDTH);
  }, []);

  return (
    <aside
      className="h-full bg-bg-secondary border-r border-border-subtle flex flex-col relative shrink-0"
      style={{ width }}
    >
      {/* Header */}
      <div className="h-11 flex items-center justify-between px-3">
        <span className="text-[14px] leading-[20px] tracking-[-0.006em] font-semibold text-text-primary">
          <span className="text-accent">✦</span> Plot
        </span>
        <button
          onClick={() => toggleCommandBar(true)}
          className="text-[11px] leading-[16px] tracking-[0.01em] text-text-tertiary hover:text-text-secondary transition-colors"
        >
          ⌘K
        </button>
      </div>

      {/* Views */}
      <nav className="px-2 py-1">
        {NAV_VIEWS.map((view) => (
          <SidebarItem
            key={view.id}
            label={view.label}
            viewType={view.id}
            count={getByStatus(view.id).length}
            active={currentView === view.id}
            onClick={() => setView(view.id)}
          />
        ))}
      </nav>

      {/* Hub Section */}
      <HubSection />

      {/* Views Section */}
      <div className="mt-1 px-2">
        <div className="flex items-center justify-between px-0.5 py-1.5">
          <span className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium">
            뷰
          </span>
          <button
            onClick={() => setShowViewEditor(true)}
            className="text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="7" y1="3" x2="7" y2="11" />
              <line x1="3" y1="7" x2="11" y2="7" />
            </svg>
          </button>
        </div>
        {customViews.map(view => (
          <button
            key={view.id}
            onClick={() => setCustomView(view.id)}
            className="w-full h-7 flex items-center gap-2 px-2.5 text-[13px] leading-[20px] text-text-secondary hover:bg-bg-surface transition-colors rounded-md"
          >
            <span className="text-[12px] shrink-0">{view.icon}</span>
            <span className="truncate">{view.name}</span>
          </button>
        ))}
      </div>

      {/* View Editor Modal */}
      {showViewEditor && <CustomViewEditor onClose={() => setShowViewEditor(false)} />}

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-accent/20 transition-colors z-10"
      />
    </aside>
  );
}
