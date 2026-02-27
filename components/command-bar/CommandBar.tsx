"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useViewStore } from "@/stores/viewStore";
import { useItemStore } from "@/stores/itemStore";
import { useHubStore } from "@/stores/hubStore";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandOption {
  id: string;
  label: string;
  section: "Actions" | "Navigation" | "Items";
  hint?: string;
  action: () => void;
}

export function CommandBar() {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { setView, selectItem, toggleCommandBar, setActiveHub } = useViewStore();
  const { addItem, items: allItems } = useItemStore();

  // 자동 포커스
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 고정 커맨드 옵션
  const staticOptions: CommandOption[] = useMemo(() => {
    const hubs = useHubStore.getState().getActiveHubs();

    const base: CommandOption[] = [
      {
        id: "create",
        label: "새 항목 만들기",
        section: "Actions" as const,
        hint: "C",
        action: () => {
          const title = query.trim() || "Untitled";
          addItem({ title });
          toggleCommandBar(false);
        },
      },
      {
        id: "nav-inbox",
        label: "메모로 이동",
        section: "Navigation" as const,
        hint: "1",
        action: () => {
          setView("inbox");
          toggleCommandBar(false);
        },
      },
      {
        id: "nav-active",
        label: "진행으로 이동",
        section: "Navigation" as const,
        hint: "2",
        action: () => {
          setView("active");
          toggleCommandBar(false);
        },
      },
      {
        id: "nav-all",
        label: "전체로 이동",
        section: "Navigation" as const,
        hint: "3",
        action: () => {
          setView("all");
          toggleCommandBar(false);
        },
      },
      {
        id: "nav-done",
        label: "완료로 이동",
        section: "Navigation" as const,
        hint: "4",
        action: () => {
          setView("done");
          toggleCommandBar(false);
        },
      },
    ];

    const hubNav: CommandOption[] = hubs.map((hub) => ({
      id: `nav-hub-${hub.id}`,
      label: hub.name,
      section: "Navigation" as const,
      action: () => {
        setActiveHub(hub.id);
        toggleCommandBar(false);
      },
    }));

    return [...base, ...hubNav];
  }, [query, addItem, setView, setActiveHub, toggleCommandBar]);

  // 아이템 검색 결과
  const itemResults: CommandOption[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return allItems
      .filter((item) => !item.deleted_at)
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.body_plain && item.body_plain.toLowerCase().includes(q))
      )
      .slice(0, 8) // 최대 8개
      .map((item) => ({
        id: `item-${item.id}`,
        label: item.title,
        section: "Items" as const,
        action: () => {
          selectItem(item.id);
          toggleCommandBar(false);
        },
      }));
  }, [query, allItems, selectItem, toggleCommandBar]);

  // 필터링된 결과 조합
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return staticOptions;

    // Create는 항상 표시 (검색어를 타이틀로 사용)
    const createOpt = staticOptions.filter((opt) => opt.id === "create");

    // 나머지 static 필터링
    const matchedStatic = staticOptions.filter(
      (opt) => opt.id !== "create" && opt.label.toLowerCase().includes(q)
    );

    return [...createOpt, ...itemResults, ...matchedStatic];
  }, [query, staticOptions, itemResults]);

  // selectedIndex 클램핑
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // 선택된 항목 스크롤
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector("[data-selected]");
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // 키보드 핸들링
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
    } else if (e.key === "Escape") {
      e.preventDefault();
      toggleCommandBar(false);
    }
  };

  // 섹션별 그룹핑
  const sections = useMemo(() => {
    const groups: { section: string; items: (CommandOption & { globalIndex: number })[] }[] = [];
    let globalIdx = 0;
    const sectionOrder = ["Actions", "Items", "Navigation"];

    for (const sectionName of sectionOrder) {
      const sectionItems = filtered
        .filter((opt) => opt.section === sectionName)
        .map((opt) => ({ ...opt, globalIndex: -1 }));

      if (sectionItems.length > 0) {
        for (const item of sectionItems) {
          item.globalIndex = globalIdx++;
        }
        groups.push({ section: sectionName, items: sectionItems });
      }
    }

    return groups;
  }, [filtered]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(10, 13, 15, 0.6)", backdropFilter: "blur(12px)" }}
        onClick={() => toggleCommandBar(false)}
      />

      {/* Modal */}
      <div
        className="relative w-[560px] bg-bg-surface border border-border-default rounded-xl shadow-2xl overflow-hidden"
        style={{
          animation:
            "commandBarIn 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 h-12 border-b border-border-subtle">
          <Search size={16} className="text-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="무엇을 기록할까요..."
            className="flex-1 bg-transparent text-[15px] leading-[24px] tracking-[-0.008em] text-text-primary placeholder:text-text-tertiary outline-none"
          />
          <kbd className="text-[11px] leading-[16px] text-text-tertiary bg-bg-elevated px-1.5 py-0.5 rounded border border-border-subtle">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-text-tertiary text-[13px] leading-[20px]">
              결과 없음
            </div>
          ) : (
            sections.map((group) => (
              <div key={group.section}>
                {/* Section Header */}
                <div className="px-4 pt-2 pb-1">
                  <span className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium">
                    {group.section}
                  </span>
                </div>

                {/* Section Items */}
                {group.items.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={opt.action}
                    data-selected={opt.globalIndex === selectedIndex || undefined}
                    className={cn(
                      "w-full h-9 flex items-center justify-between px-4 text-[13px] leading-[20px] transition-colors",
                      opt.globalIndex === selectedIndex
                        ? "bg-bg-elevated text-text-primary"
                        : "text-text-secondary hover:bg-bg-elevated"
                    )}
                  >
                    <span className="truncate">
                      {opt.id === "create" && query.trim()
                        ? `"${query.trim()}" 만들기`
                        : opt.label}
                    </span>
                    {opt.hint && (
                      <kbd className="ml-2 text-[11px] leading-[16px] text-text-tertiary bg-bg-secondary px-1.5 py-0.5 rounded border border-border-subtle shrink-0">
                        {opt.hint}
                      </kbd>
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
