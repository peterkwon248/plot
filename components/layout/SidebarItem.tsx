"use client";

import { cn } from "@/lib/utils";
import type { ViewType } from "@/types";

interface SidebarItemProps {
  label: string;
  viewType: ViewType;
  count: number;
  active: boolean;
  onClick: () => void;
}

export function SidebarItem({
  label,
  viewType,
  count,
  active,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full h-8 flex items-center gap-2 px-3 rounded-md text-[13px] leading-[20px] transition-colors duration-100",
        active
          ? "bg-accent-muted text-accent"
          : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
      )}
    >
      <ViewIcon viewType={viewType} active={active} />
      <span className="flex-1 text-left">{label}</span>
      {count > 0 && (
        <span className="text-[11px] leading-[16px] tracking-[0.01em] text-text-tertiary">
          {count}
        </span>
      )}
    </button>
  );
}

function ViewIcon({ viewType, active }: { viewType: ViewType; active: boolean }) {
  const color = active ? "var(--color-accent)" : undefined;

  switch (viewType) {
    // Inbox — 십자 조준선 (작게)
    case "inbox":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0">
          <circle cx="8" cy="8" r="2" fill="none"
            stroke={color || "var(--color-status-inbox)"} strokeWidth="1" />
          <line x1="8" y1="2" x2="8" y2="5"
            stroke={color || "var(--color-status-inbox)"} strokeWidth="1" />
          <line x1="8" y1="11" x2="8" y2="14"
            stroke={color || "var(--color-status-inbox)"} strokeWidth="1" />
          <line x1="2" y1="8" x2="5" y2="8"
            stroke={color || "var(--color-status-inbox)"} strokeWidth="1" />
          <line x1="11" y1="8" x2="14" y2="8"
            stroke={color || "var(--color-status-inbox)"} strokeWidth="1" />
        </svg>
      );

    // Active — 점 + 확산 링
    case "active":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0">
          <circle cx="8" cy="8" r="5.5" fill="none"
            stroke={color || "var(--color-status-in-progress)"} strokeWidth="1" opacity="0.35" />
          <circle cx="8" cy="8" r="2.5"
            fill={color || "var(--color-status-in-progress)"} />
        </svg>
      );

    // All — 3개 점 (다수의 좌표)
    case "all":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0">
          <circle cx="5" cy="8" r="1.8"
            fill={color || "var(--color-text-secondary)"} />
          <circle cx="8" cy="4.5" r="1.8"
            fill={color || "var(--color-text-secondary)"} opacity="0.6" />
          <circle cx="11" cy="8" r="1.8"
            fill={color || "var(--color-text-secondary)"} opacity="0.35" />
        </svg>
      );

    // Done — 체크
    case "done":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0">
          <path
            d="M4 8L7 11L12 5"
            fill="none"
            stroke={color || "var(--color-status-done)"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}
