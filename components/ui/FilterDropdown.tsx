"use client";

import { useMemo } from "react";
import { useViewStore } from "@/stores/viewStore";
import { useItemStore } from "@/stores/itemStore";
import { useHubStore } from "@/stores/hubStore";
import { getHubColorHex } from "@/lib/hubColors";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import type { ItemStatus, ItemPriority, ListFilter } from "@/types";

const STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: "inbox", label: "메모" },
  { value: "todo", label: "할 일" },
  { value: "in_progress", label: "진행 중" },
  { value: "done", label: "완료" },
];

const PRIORITY_OPTIONS: { value: ItemPriority; label: string }[] = [
  { value: "urgent", label: "긴급" },
  { value: "high", label: "높음" },
  { value: "medium", label: "보통" },
  { value: "low", label: "낮음" },
  { value: "none", label: "없음" },
];

export function FilterDropdown() {
  const { activeFilter, setFilter, clearFilter, isFilterActive } = useViewStore();
  const items = useItemStore((s) => s.items);
  const hubList = useHubStore((s) => s.hubs);
  const hubs = useMemo(() => hubList.filter(h => !h.archived_at).sort((a, b) => a.sort_order - b.sort_order), [hubList]);
  const allTags = useMemo(() => Array.from(new Set(items.filter(i => !i.deleted_at).flatMap(i => i.tags))).sort(), [items]);

  const toggleInArray = <T extends string>(arr: T[] | undefined, val: T): T[] => {
    const current = arr || [];
    return current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
  };

  const updateFilter = (key: keyof ListFilter, value: string) => {
    const newArr = toggleInArray(activeFilter[key] as string[] | undefined, value);
    setFilter({ ...activeFilter, [key]: newArr.length > 0 ? newArr : undefined });
  };

  const filterActive = isFilterActive();
  const activeCount = [
    activeFilter.status?.length || 0,
    activeFilter.priority?.length || 0,
    activeFilter.hub_ids?.length || 0,
    activeFilter.tags?.length || 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[12px] leading-[16px] transition-colors ${
            filterActive
              ? "text-accent bg-accent-muted"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
            <line x1="2" y1="4" x2="12" y2="4" />
            <line x1="4" y1="7" x2="10" y2="7" />
            <line x1="6" y1="10" x2="8" y2="10" />
          </svg>
          필터
          {filterActive && (
            <span className="text-[10px] leading-[14px] bg-accent/20 text-accent px-1.5 rounded-full font-medium">
              {activeCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[300px] p-0">
        <div className="max-h-[400px] overflow-y-auto p-3 space-y-4">
          {/* Status */}
          <div>
            <span className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium mb-1.5 block">
              상태
            </span>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateFilter("status", opt.value)}
                  className={`text-[12px] leading-[16px] px-2.5 py-1 rounded-md border transition-colors ${
                    activeFilter.status?.includes(opt.value)
                      ? "bg-accent-muted border-accent/30 text-accent"
                      : "border-border-default text-text-secondary hover:border-border-focus"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <span className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium mb-1.5 block">
              중요도
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateFilter("priority", opt.value)}
                  className={`text-[12px] leading-[16px] px-2.5 py-1 rounded-md border transition-colors ${
                    activeFilter.priority?.includes(opt.value)
                      ? "bg-accent-muted border-accent/30 text-accent"
                      : "border-border-default text-text-secondary hover:border-border-focus"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hub / Project */}
          {hubs.length > 0 && (
            <div>
              <span className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium mb-1.5 block">
                프로젝트
              </span>
              <div className="flex flex-wrap gap-1.5">
                {hubs.map((hub) => (
                  <button
                    key={hub.id}
                    onClick={() => updateFilter("hub_ids", hub.id)}
                    className={`text-[12px] leading-[16px] px-2.5 py-1 rounded-md border transition-colors flex items-center gap-1.5 ${
                      activeFilter.hub_ids?.includes(hub.id)
                        ? "bg-accent-muted border-accent/30 text-accent"
                        : "border-border-default text-text-secondary hover:border-border-focus"
                    }`}
                  >
                    <svg width="6" height="6" viewBox="0 0 6 6" className="shrink-0">
                      <circle cx="3" cy="3" r="3" fill={getHubColorHex(hub.color)} />
                    </svg>
                    {hub.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <span className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium mb-1.5 block">
                태그
              </span>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => updateFilter("tags", tag)}
                    className={`text-[12px] leading-[16px] px-2.5 py-1 rounded-md border transition-colors ${
                      activeFilter.tags?.includes(tag)
                        ? "bg-accent-muted border-accent/30 text-accent"
                        : "border-border-default text-text-secondary hover:border-border-focus"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {filterActive && (
          <div className="border-t border-border-subtle px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] leading-[16px] text-text-tertiary">
              {activeCount}개 필터 적용 중
            </span>
            <button
              onClick={() => clearFilter()}
              className="text-[12px] leading-[16px] text-text-secondary hover:text-text-primary transition-colors"
            >
              초기화
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
