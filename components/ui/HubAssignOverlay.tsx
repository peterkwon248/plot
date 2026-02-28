"use client";

import { useMemo, useCallback } from "react";
import { useViewStore } from "@/stores/viewStore";
import { useItemStore } from "@/stores/itemStore";
import { useHubStore } from "@/stores/hubStore";
import { getHubColorHex } from "@/lib/hubColors";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

export function HubAssignOverlay() {
  const { isHubAssignOpen, selectedItemId, focusedIndex, currentView, activeHubId, toggleHubAssign } = useViewStore();
  const { getByStatus, getByHub, assignToHub } = useItemStore();
  const hubList = useHubStore((s) => s.hubs);
  const hubs = useMemo(
    () => hubList.filter((h) => !h.archived_at).sort((a, b) => a.sort_order - b.sort_order),
    [hubList]
  );

  const targetItemId = useMemo(() => {
    if (selectedItemId) return selectedItemId;
    const viewItems = currentView === "hub" && activeHubId
      ? getByHub(activeHubId)
      : getByStatus(currentView as Exclude<typeof currentView, "hub">);
    return viewItems[focusedIndex]?.id ?? null;
  }, [selectedItemId, focusedIndex, currentView, activeHubId, getByStatus, getByHub]);

  const close = useCallback(() => toggleHubAssign(false), [toggleHubAssign]);

  const handleSelect = useCallback((hubId: string | null) => {
    if (targetItemId) {
      assignToHub(targetItemId, hubId);
    }
    close();
  }, [targetItemId, assignToHub, close]);

  return (
    <Dialog open={isHubAssignOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="overflow-hidden p-0 max-w-[320px] top-[20%] translate-y-0 gap-0">
        <Command className="rounded-xl">
          <CommandInput placeholder="프로젝트 검색..." className="h-10 text-[13px] border-none focus:ring-0" />
          <CommandList className="max-h-60 overflow-y-auto">
            <CommandEmpty className="px-4 py-4 text-center text-text-tertiary text-[13px] leading-[20px]">
              프로젝트를 찾을 수 없습니다
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => handleSelect(null)}
                className="h-8 flex items-center gap-2 px-4 text-[13px] leading-[20px] rounded-none"
              >
                <span className="text-text-tertiary text-[11px]">—</span>
                <span>프로젝트 해제</span>
              </CommandItem>
              {hubs.map((hub) => (
                <CommandItem
                  key={hub.id}
                  onSelect={() => handleSelect(hub.id)}
                  className="h-8 flex items-center gap-2 px-4 text-[13px] leading-[20px] rounded-none"
                >
                  <svg width="6" height="6" viewBox="0 0 6 6" className="shrink-0">
                    <circle cx="3" cy="3" r="3" fill={getHubColorHex(hub.color)} />
                  </svg>
                  <span className="truncate">{hub.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
