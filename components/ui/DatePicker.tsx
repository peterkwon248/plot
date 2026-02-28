"use client";

import { useMemo } from "react";
import { format, addDays, addWeeks, isBefore, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface DatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const selectedDate = useMemo(() => (value ? new Date(value) : undefined), [value]);
  const today = useMemo(() => new Date(), []);

  const isOverdue = selectedDate && isBefore(selectedDate, today) && !isSameDay(selectedDate, today);

  const quickPicks = [
    { label: "오늘", date: today },
    { label: "내일", date: addDays(today, 1) },
    { label: "다음 주", date: addWeeks(today, 1) },
  ];

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"));
    }
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 px-2 py-1 rounded-md hover:bg-bg-elevated transition-colors text-[13px] leading-[20px]",
            isOverdue ? "text-[#EB5757]" : value ? "text-text-primary" : "text-text-tertiary"
          )}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="1.5" y="2.5" width="11" height="9.5" rx="1.5" />
            <line x1="1.5" y1="5.5" x2="12.5" y2="5.5" />
            <line x1="4.5" y1="1" x2="4.5" y2="3.5" />
            <line x1="9.5" y1="1" x2="9.5" y2="3.5" />
          </svg>
          {value
            ? format(new Date(value), "M월 d일", { locale: ko })
            : "마감일 설정"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {/* Quick picks */}
        <div className="p-2 space-y-0.5 border-b border-border-subtle">
          {quickPicks.map((qp) => (
            <button
              key={qp.label}
              onClick={() => handleSelect(qp.date)}
              className="w-full flex items-center px-2.5 py-1.5 rounded-md text-[13px] leading-[20px] text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
            >
              {qp.label}
            </button>
          ))}
          {value && (
            <button
              onClick={handleClear}
              className="w-full flex items-center px-2.5 py-1.5 rounded-md text-[13px] leading-[20px] text-[#EB5757] hover:bg-bg-elevated transition-colors"
            >
              마감일 제거
            </button>
          )}
        </div>

        {/* Calendar */}
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          defaultMonth={selectedDate || today}
        />
      </PopoverContent>
    </Popover>
  );
}
