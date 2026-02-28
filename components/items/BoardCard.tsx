"use client";

import type { Item } from "@/types";
import { useViewStore } from "@/stores/viewStore";
import { useHubStore } from "@/stores/hubStore";
import { useDisplayStore } from "@/stores/displayStore";
import { getHubColorHex } from "@/lib/hubColors";
import { cn } from "@/lib/utils";

interface BoardCardProps {
  item: Item;
}

export function BoardCard({ item }: BoardCardProps) {
  const selectItem = useViewStore((s) => s.selectItem);
  const { settings } = useDisplayStore();
  const isDone = item.status === "done";

  return (
    <button
      onClick={() => selectItem(item.id)}
      className={cn(
        "w-full text-left bg-bg-surface border border-border-subtle rounded-lg p-3 mb-2 cursor-pointer hover:bg-bg-elevated hover:border-border-default transition-colors",
        isDone && "opacity-60"
      )}
    >
      {/* Title */}
      <p className={cn(
        "text-[13px] leading-[20px] font-medium",
        isDone ? "text-text-secondary line-through" : "text-text-primary"
      )}>
        {item.title}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {settings.showProperties.id && (
          <span className="text-[10px] leading-[14px] text-text-disabled font-mono">
            {item.id.slice(0, 4).toUpperCase()}
          </span>
        )}

        {settings.showProperties.priority && item.priority !== "none" && (
          <PriorityDot priority={item.priority} />
        )}

        {settings.showProperties.hub && item.hub_id && (
          <HubBadge hubId={item.hub_id} />
        )}

        {item.due_date && (
          <span className="text-[10px] leading-[14px] text-text-tertiary">
            {new Date(item.due_date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </button>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    urgent: "#EB5757",
    high: "#F2994A",
    medium: "#F2C94C",
    low: "#8A8A8A",
  };
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0">
      <circle cx="4" cy="4" r="3" fill={colors[priority] || "#8A8A8A"} />
    </svg>
  );
}

function HubBadge({ hubId }: { hubId: string }) {
  const hub = useHubStore((s) => s.hubs.find((h) => h.id === hubId));
  if (!hub) return null;
  return (
    <span className="text-[10px] leading-[14px] text-text-tertiary flex items-center gap-1">
      <svg width="6" height="6" viewBox="0 0 6 6">
        <circle cx="3" cy="3" r="3" fill={getHubColorHex(hub.color)} />
      </svg>
      {hub.name}
    </span>
  );
}
