"use client";

import { ItemStatusIcon } from "@/components/items/ItemStatusIcon";
import type { ItemStatus } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const current = statuses.find((s) => s.value === value)!;

  return (
    <Select value={value} onValueChange={(v) => onChange(v as ItemStatus)}>
      <SelectTrigger className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-bg-elevated transition-colors border-none shadow-none h-auto focus:ring-0">
        <ItemStatusIcon status={value} size={16} />
        <SelectValue>{current.label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statuses.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            <div className="flex items-center gap-2">
              <ItemStatusIcon status={s.value} size={14} />
              {s.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
