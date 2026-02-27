"use client";

import { useViewStore } from "@/stores/viewStore";
import { useItemStore } from "@/stores/itemStore";
import { SidebarItem } from "./SidebarItem";
import type { ViewType } from "@/types";

const views: { id: ViewType; label: string }[] = [
  { id: "inbox", label: "Inbox" },
  { id: "active", label: "Active" },
  { id: "all", label: "All" },
  { id: "done", label: "Done" },
];

export function Sidebar() {
  const { currentView, setView, toggleCommandBar } = useViewStore();
  const { getByStatus } = useItemStore();

  return (
    <aside className="w-sidebar h-full bg-bg-secondary border-r border-border-subtle flex flex-col">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-3">
        <span className="text-[14px] leading-[20px] tracking-[-0.006em] font-semibold text-text-primary">
          ◆ Plot
        </span>
        <button
          onClick={() => toggleCommandBar(true)}
          className="text-[11px] leading-[16px] tracking-[0.01em] text-text-tertiary hover:text-text-secondary transition-colors"
        >
          ⌘K
        </button>
      </div>

      {/* Views */}
      <nav className="flex-1 px-2 py-1">
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
    </aside>
  );
}
