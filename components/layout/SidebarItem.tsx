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

/** 뷰별 커스텀 SVG 아이콘 (16x16) — Linear 스타일 */
function ViewIcon({ viewType, active }: { viewType: ViewType; active: boolean }) {
  const accent = active ? "#5E6AD2" : undefined;

  switch (viewType) {
    case "inbox":
      // 점선 원 — 미분류
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0">
          <circle
            cx="8" cy="8" r="6"
            fill="none"
            stroke={accent || "#8A8A8A"}
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />
        </svg>
      );
    case "active":
      // 반원 채움 — 진행 중
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0">
          <circle
            cx="8" cy="8" r="6"
            fill="none"
            stroke={accent || "#F2C94C"}
            strokeWidth="1.5"
          />
          <path
            d="M8 2a6 6 0 0 1 0 12"
            fill={accent || "#F2C94C"}
          />
        </svg>
      );
    case "all":
      // 이중 원 — 전체
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0">
          <circle
            cx="8" cy="8" r="6"
            fill="none"
            stroke={accent || "#E8E8E8"}
            strokeWidth="1.5"
          />
          <circle
            cx="8" cy="8" r="3"
            fill={accent || "#E8E8E8"}
          />
        </svg>
      );
    case "done":
      // 채워진 원 + 체크 — 완료
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0">
          <circle cx="8" cy="8" r="6" fill={accent || "#5E6AD2"} />
          <path
            d="M5 8L7 10L11 6"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}
