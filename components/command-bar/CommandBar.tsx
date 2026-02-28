"use client";

import { useState, useMemo, useCallback } from "react";
import { useViewStore } from "@/stores/viewStore";
import { useItemStore } from "@/stores/itemStore";
import { useHubStore } from "@/stores/hubStore";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import type { Item } from "@/types";

export function CommandBar() {
  const [query, setQuery] = useState("");
  const { isCommandBarOpen, setView, selectItem, toggleCommandBar, setActiveHub, recentItems } = useViewStore();
  const { addItem, items: allItems } = useItemStore();

  const handleClose = useCallback(() => toggleCommandBar(false), [toggleCommandBar]);

  const handleCreate = useCallback(() => {
    const title = query.trim() || "Untitled";
    addItem({ title });
    handleClose();
  }, [query, addItem, handleClose]);

  // Recent items
  const recentOptions = useMemo(() => {
    if (query.trim()) return [];
    const found: Item[] = [];
    for (const id of recentItems.slice(0, 5)) {
      const item = allItems.find((i) => i.id === id && !i.deleted_at);
      if (item) found.push(item);
    }
    return found;
  }, [query, recentItems, allItems]);

  // Hub navigation options
  const hubs = useMemo(() => useHubStore.getState().getActiveHubs(), []);

  return (
    <Dialog open={isCommandBarOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="overflow-hidden p-0 max-w-[560px] top-[20%] translate-y-0 gap-0">
        <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:leading-[16px] [&_[cmdk-group-heading]]:tracking-[0.04em] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-tertiary">
          {/* Input */}
          <div className="flex items-center gap-3 px-4 h-12 border-b border-border-subtle">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-tertiary shrink-0">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="무엇을 기록할까요..."
              className="flex-1 bg-transparent text-[15px] leading-[24px] tracking-[-0.008em] text-text-primary placeholder:text-text-tertiary outline-none border-none h-12 p-0 ring-0 focus:ring-0"
            />
            <kbd className="text-[11px] leading-[16px] text-text-tertiary bg-bg-elevated px-1.5 py-0.5 rounded border border-border-subtle">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <CommandList className="max-h-80 overflow-y-auto">
            <CommandEmpty className="py-6 text-center text-text-tertiary text-[13px] leading-[20px]">
              결과 없음
            </CommandEmpty>

            {/* Create */}
            <CommandGroup heading="작업">
              <CommandItem
                onSelect={handleCreate}
                className="h-9 flex items-center justify-between px-4 text-[13px] leading-[20px] rounded-none"
              >
                <span>{query.trim() ? `"${query.trim()}" 만들기` : "새 항목 만들기"}</span>
                <CommandShortcut>C</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            {/* Recent */}
            {recentOptions.length > 0 && (
              <CommandGroup heading="최근">
                {recentOptions.map((item) => (
                  <CommandItem
                    key={`recent-${item.id}`}
                    onSelect={() => { selectItem(item.id); handleClose(); }}
                    className="h-9 flex items-center px-4 text-[13px] leading-[20px] rounded-none"
                  >
                    <span className="truncate">{item.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Item search results */}
            {query.trim() && (() => {
              const q = query.trim().toLowerCase();
              const results = allItems
                .filter((item) => !item.deleted_at)
                .filter((item) =>
                  item.title.toLowerCase().includes(q) ||
                  (item.body_plain && item.body_plain.toLowerCase().includes(q))
                )
                .slice(0, 8);
              if (results.length === 0) return null;
              return (
                <CommandGroup heading="항목">
                  {results.map((item) => (
                    <CommandItem
                      key={`item-${item.id}`}
                      onSelect={() => { selectItem(item.id); handleClose(); }}
                      className="h-9 flex items-center px-4 text-[13px] leading-[20px] rounded-none"
                    >
                      <span className="truncate">{item.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })()}

            {/* Navigation */}
            <CommandGroup heading="이동">
              <CommandItem onSelect={() => { setView("inbox"); handleClose(); }} className="h-9 flex items-center justify-between px-4 text-[13px] leading-[20px] rounded-none">
                <span>메모로 이동</span>
                <CommandShortcut>1</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => { setView("active"); handleClose(); }} className="h-9 flex items-center justify-between px-4 text-[13px] leading-[20px] rounded-none">
                <span>진행으로 이동</span>
                <CommandShortcut>2</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => { setView("all"); handleClose(); }} className="h-9 flex items-center justify-between px-4 text-[13px] leading-[20px] rounded-none">
                <span>전체로 이동</span>
                <CommandShortcut>3</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => { setView("done"); handleClose(); }} className="h-9 flex items-center justify-between px-4 text-[13px] leading-[20px] rounded-none">
                <span>완료로 이동</span>
                <CommandShortcut>4</CommandShortcut>
              </CommandItem>
              {hubs.map((hub) => (
                <CommandItem
                  key={`hub-${hub.id}`}
                  onSelect={() => { setActiveHub(hub.id); handleClose(); }}
                  className="h-9 flex items-center px-4 text-[13px] leading-[20px] rounded-none"
                >
                  <span>{hub.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
