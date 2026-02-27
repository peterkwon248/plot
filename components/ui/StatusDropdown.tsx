"use client";

import { useState, useRef, useEffect } from "react";
import { ItemStatusIcon } from "@/components/items/ItemStatusIcon";
import { cn } from "@/lib/utils";
import type { ItemStatus } from "@/types";

const statuses: { value: ItemStatus; label: string }[] = [
  { value: "inbox", label: "메모" },
  { value: "todo", label: "할 일" },
  { value: "in_progress", label: "진행 중" },
  { value: "done", label: "완료" },
];

interface Props {
  value: ItemStatus;
  onChange: (status: ItemStatus) => void;
}

export function StatusDropdown({ value, onChange }: Props) {
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

  const current = statuses.find((s) => s.value === value)!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-bg-elevated transition-colors"
      >
        <ItemStatusIcon status={value} size={16} />
        <span className="text-[13px] leading-[20px] capitalize">
          {current.label}
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-40 bg-bg-surface border border-border-default rounded-lg shadow-xl z-50 py-1">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => {
                onChange(s.value);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-[13px] leading-[20px] transition-colors",
                s.value === value
                  ? "bg-accent-muted text-accent"
                  : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
              )}
            >
              <ItemStatusIcon status={s.value} size={14} />
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
