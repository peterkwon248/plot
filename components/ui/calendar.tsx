"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={ko}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-[13px] leading-[20px] font-medium text-text-primary",
        nav: "flex items-center gap-1",
        button_previous:
          "absolute left-1 h-7 w-7 bg-transparent p-0 text-text-tertiary hover:text-text-primary transition-colors inline-flex items-center justify-center rounded-md",
        button_next:
          "absolute right-1 h-7 w-7 bg-transparent p-0 text-text-tertiary hover:text-text-primary transition-colors inline-flex items-center justify-center rounded-md",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-text-disabled rounded-md w-8 font-medium text-[10px] leading-[14px] text-center",
        week: "flex w-full mt-1",
        day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(
          "h-8 w-8 p-0 font-normal text-[12px] leading-[16px] rounded-md transition-colors inline-flex items-center justify-center",
          "hover:bg-bg-elevated hover:text-text-primary",
          "focus:outline-none focus:ring-1 focus:ring-border-focus",
          "aria-selected:opacity-100"
        ),
        range_end: "day-range-end",
        selected:
          "bg-accent text-bg-primary hover:bg-accent-hover hover:text-bg-primary focus:bg-accent focus:text-bg-primary font-medium rounded-md",
        today: "border border-accent/30 text-text-primary rounded-md",
        outside:
          "text-text-disabled opacity-50 aria-selected:bg-accent/5 aria-selected:text-text-disabled aria-selected:opacity-30",
        disabled: "text-text-disabled opacity-50",
        range_middle:
          "aria-selected:bg-accent/10 aria-selected:text-text-primary",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            {orientation === "left" ? (
              <path d="M7 2L3 6L7 10" />
            ) : (
              <path d="M5 2L9 6L5 10" />
            )}
          </svg>
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
