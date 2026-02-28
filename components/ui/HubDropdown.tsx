"use client";

import { useMemo } from "react";
import { useHubStore } from "@/stores/hubStore";
import { getHubColorHex } from "@/lib/hubColors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  value: string | null;
  onChange: (hubId: string | null) => void;
}

const NONE_VALUE = "__none__";

export function HubDropdown({ value, onChange }: Props) {
  const hubList = useHubStore((s) => s.hubs);
  const hubs = useMemo(
    () => hubList.filter((h) => !h.archived_at).sort((a, b) => a.sort_order - b.sort_order),
    [hubList]
  );
  const selectedHub = hubs.find((h) => h.id === value);

  return (
    <Select
      value={value ?? NONE_VALUE}
      onValueChange={(v) => onChange(v === NONE_VALUE ? null : v)}
    >
      <SelectTrigger className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-bg-elevated transition-colors text-[13px] leading-[20px] border-none shadow-none h-auto focus:ring-0">
        {selectedHub ? (
          <>
            <svg width="6" height="6" viewBox="0 0 6 6" className="shrink-0">
              <circle cx="3" cy="3" r="3" fill={getHubColorHex(selectedHub.color)} />
            </svg>
            <SelectValue>{selectedHub.name}</SelectValue>
          </>
        ) : (
          <SelectValue>
            <span className="text-text-tertiary">없음</span>
          </SelectValue>
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>
          <div className="flex items-center gap-2">
            <span className="text-text-tertiary">—</span>
            <span>없음</span>
          </div>
        </SelectItem>
        {hubs.map((hub) => (
          <SelectItem key={hub.id} value={hub.id}>
            <div className="flex items-center gap-2">
              <svg width="6" height="6" viewBox="0 0 6 6" className="shrink-0">
                <circle cx="3" cy="3" r="3" fill={getHubColorHex(hub.color)} />
              </svg>
              <span>{hub.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
