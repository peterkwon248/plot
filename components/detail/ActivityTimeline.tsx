"use client";

import { useMemo } from "react";
import { useActivityStore } from "@/stores/activityStore";
import { useHubStore } from "@/stores/hubStore";
import { timeAgo } from "@/lib/utils";
import type { ActivityAction } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  inbox: "메모",
  todo: "할 일",
  in_progress: "진행 중",
  done: "완료",
};

const PRIORITY_LABELS: Record<string, string> = {
  none: "없음",
  low: "낮음",
  medium: "보통",
  high: "높음",
  urgent: "긴급",
};

function getActionDescription(action: ActivityAction, fromValue?: string, toValue?: string, hubName?: string): string {
  switch (action) {
    case "created":
      return "생성됨";
    case "status_changed":
      return `상태 변경: ${STATUS_LABELS[fromValue || ""] || fromValue} → ${STATUS_LABELS[toValue || ""] || toValue}`;
    case "priority_changed":
      return `중요도 변경: ${PRIORITY_LABELS[fromValue || ""] || fromValue} → ${PRIORITY_LABELS[toValue || ""] || toValue}`;
    case "hub_assigned":
      return `프로젝트 배정: ${hubName || toValue}`;
    case "hub_removed":
      return "프로젝트 해제";
    case "title_changed":
      return `제목 변경`;
    case "chain_added":
      return "노드 연결 추가";
    case "chain_removed":
      return "노드 연결 제거";
    default:
      return action;
  }
}

interface ActivityTimelineProps {
  itemId: string;
}

export function ActivityTimeline({ itemId }: ActivityTimelineProps) {
  const entries = useActivityStore(state => state.getEntriesForItem(itemId));
  const getHubById = useHubStore(state => state.getHubById);

  const displayEntries = useMemo(() => {
    return entries.slice(0, 20).map(entry => {
      let hubName: string | undefined;
      if ((entry.action === "hub_assigned") && entry.to_value) {
        const hub = getHubById(entry.to_value);
        hubName = hub?.name;
      }
      return {
        ...entry,
        description: getActionDescription(entry.action, entry.from_value, entry.to_value, hubName),
      };
    });
  }, [entries, getHubById]);

  if (displayEntries.length === 0) return null;

  return (
    <div className="mt-8 border-t border-border-subtle pt-6">
      <div className="mb-3">
        <span className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium">
          활동
        </span>
      </div>
      <div className="space-y-0">
        {displayEntries.map((entry, idx) => (
          <div key={entry.id} className="flex items-start gap-3 py-1.5">
            {/* Timeline dot + line */}
            <div className="flex flex-col items-center shrink-0 pt-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-text-tertiary" />
              {idx < displayEntries.length - 1 && (
                <div className="w-px flex-1 bg-border-subtle mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <span className="text-[12px] leading-[16px] text-text-secondary">
                {entry.description}
              </span>
            </div>

            {/* Time */}
            <span className="text-[11px] leading-[16px] text-text-tertiary shrink-0">
              {timeAgo(entry.created_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
