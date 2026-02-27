"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { ItemPriority } from "@/types";

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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = priorities.find((p) => p.value === value)!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-bg-elevated transition-colors"
      >
        <PriorityIcon priority={value} />
        <span className={cn("text-[13px] leading-[20px] capitalize", current.color)}>
          {current.label}
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-40 bg-bg-surface border border-border-default rounded-lg shadow-xl z-50 py-1">
          {priorities.map((p) => (
            <button
              key={p.value}
              onClick={() => {
                onChange(p.value);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-[13px] leading-[20px] transition-colors",
                p.value === value
                  ? "bg-accent-muted text-accent"
                  : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
              )}
            >
              <PriorityIcon priority={p.value} />
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
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
