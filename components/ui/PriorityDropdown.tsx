"use client";

import type { ItemPriority } from "@/types";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const priorities: { value: ItemPriority; label: string; color: string }[] = [
  { value: "none", label: "없음", color: "text-text-tertiary" },
  { value: "low", label: "낮음", color: "text-priority-low" },
  { value: "medium", label: "보통", color: "text-priority-medium" },
  { value: "high", label: "높음", color: "text-priority-high" },
  { value: "urgent", label: "긴급", color: "text-priority-urgent" },
];

interface Props {
  value: ItemPriority;
  onChange: (priority: ItemPriority) => void;
}

export function PriorityDropdown({ value, onChange }: Props) {
  const current = priorities.find((p) => p.value === value)!;

  return (
    <Select value={value} onValueChange={(v) => onChange(v as ItemPriority)}>
      <SelectTrigger className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-bg-elevated transition-colors border-none shadow-none h-auto focus:ring-0">
        <PriorityIcon priority={value} />
        <SelectValue>
          <span className={cn(current.color)}>{current.label}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {priorities.map((p) => (
          <SelectItem key={p.value} value={p.value}>
            <div className="flex items-center gap-2">
              <PriorityIcon priority={p.value} />
              <span className={cn(p.color)}>{p.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PriorityIcon({ priority }: { priority: ItemPriority }) {
  const bars = { none: 0, low: 1, medium: 2, high: 3, urgent: 4 };
  const colors: Record<string, string> = {
    none: "#555555",
    low: "#8A8A8A",
    medium: "#F2C94C",
    high: "#F2994A",
    urgent: "#EB5757",
  };
  const count = bars[priority];
  const color = colors[priority];

  return (
    <svg width="14" height="14" viewBox="0 0 14 14">
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={1 + i * 3.5}
          y={10 - (i + 1) * 2}
          width="2.5"
          height={(i + 1) * 2}
          rx="0.5"
          fill={i < count ? color : "#2A2A2A"}
        />
      ))}
    </svg>
  );
}
