"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useViewStore } from "@/stores/viewStore";
import { useItemStore } from "@/stores/itemStore";
import { SidebarItem } from "./SidebarItem";
import { HubSection } from "./HubSection";

type SidebarView = "inbox" | "active" | "all" | "done";

const views: { id: SidebarView; label: string }[] = [
  { id: "inbox", label: "메모" },
  { id: "active", label: "진행" },
  { id: "all", label: "전체" },
  { id: "done", label: "완료" },
];

const DEFAULT_WIDTH = 220;
const MIN_WIDTH = 180;
const MAX_WIDTH = 320;

export function Sidebar() {
  const { currentView, setView, toggleCommandBar } = useViewStore();
  const { getByStatus } = useItemStore();

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
        {views.map((view) => (
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

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-accent/20 transition-colors z-10"
      />
    </aside>
  );
}
