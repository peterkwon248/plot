"use client";

import { useDisplayStore } from "@/stores/displayStore";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import type { GroupByOption, SortByOption, DisplaySettings } from "@/types";

const GROUP_OPTIONS: { value: GroupByOption; label: string }[] = [
  { value: "none", label: "없음" },
  { value: "status", label: "상태" },
  { value: "priority", label: "중요도" },
  { value: "hub", label: "프로젝트" },
];

const SORT_OPTIONS: { value: SortByOption; label: string }[] = [
  { value: "manual", label: "수동" },
  { value: "created", label: "생성순" },
  { value: "updated", label: "수정순" },
  { value: "priority", label: "중요도순" },
  { value: "title", label: "제목순" },
];

const PROPERTY_OPTIONS: { key: keyof DisplaySettings["showProperties"]; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "priority", label: "중요도" },
  { key: "hub", label: "프로젝트" },
  { key: "date", label: "날짜" },
  { key: "preview", label: "미리보기" },
];

export function DisplayDropdown() {
  const { settings, updateSettings, updateShowProperties } = useDisplayStore();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-2 py-1 rounded text-[12px] leading-[16px] text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
            <line x1="2" y1="3" x2="12" y2="3" />
            <line x1="2" y1="7" x2="8" y2="7" />
            <line x1="2" y1="11" x2="5" y2="11" />
          </svg>
          보기
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[280px] p-3 space-y-4">
        {/* Layout Mode */}
        <div>
          <span className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium mb-1.5 block">
            레이아웃
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => updateSettings({ layout: "list" })}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] leading-[16px] transition-colors",
                settings.layout === "list"
                  ? "bg-accent-muted text-accent"
                  : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
              )}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                <line x1="2" y1="3" x2="12" y2="3" />
                <line x1="2" y1="7" x2="12" y2="7" />
                <line x1="2" y1="11" x2="12" y2="11" />
              </svg>
              리스트
            </button>
            <button
              onClick={() => updateSettings({ layout: "board" })}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] leading-[16px] transition-colors",
                settings.layout === "board"
                  ? "bg-accent-muted text-accent"
                  : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
              )}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="1" y="2" width="3.5" height="10" rx="0.5" />
                <rect x="5.25" y="2" width="3.5" height="7" rx="0.5" />
                <rect x="9.5" y="2" width="3.5" height="10" rx="0.5" />
              </svg>
              보드
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border-subtle" />

        {/* Grouping */}
        <div>
          <span className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium mb-1.5 block">
            그룹
          </span>
          <div className="space-y-0.5">
            {GROUP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateSettings({ groupBy: opt.value })}
                className={cn(
                  "w-full flex items-center px-2.5 py-1.5 rounded-md text-[13px] leading-[20px] transition-colors",
                  settings.groupBy === opt.value
                    ? "bg-accent-muted text-accent"
                    : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sorting */}
        <div>
          <span className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium mb-1.5 block">
            정렬
          </span>
          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-0.5">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateSettings({ sortBy: opt.value })}
                  className={cn(
                    "w-full flex items-center px-2.5 py-1.5 rounded-md text-[13px] leading-[20px] transition-colors",
                    settings.sortBy === opt.value
                      ? "bg-accent-muted text-accent"
                      : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => updateSettings({ sortDir: settings.sortDir === "asc" ? "desc" : "asc" })}
              className="self-start h-8 w-8 flex items-center justify-center rounded-md border border-border-default text-text-secondary hover:text-text-primary hover:border-border-focus transition-colors"
              title={settings.sortDir === "asc" ? "오름차순" : "내림차순"}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                {settings.sortDir === "asc" ? (
                  <path d="M7 11V3M4 6l3-3 3 3" />
                ) : (
                  <path d="M7 3v8M4 8l3 3 3-3" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border-subtle" />

        {/* Property visibility */}
        <div>
          <span className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium mb-1.5 block">
            속성 표시
          </span>
          <div className="space-y-1">
            {PROPERTY_OPTIONS.map((opt) => (
              <div
                key={opt.key}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-md text-[13px] leading-[20px] text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
              >
                <span>{opt.label}</span>
                <Switch
                  checked={settings.showProperties[opt.key]}
                  onCheckedChange={(checked) => updateShowProperties({ [opt.key]: checked })}
                />
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
