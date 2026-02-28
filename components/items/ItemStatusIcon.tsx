"use client";

import type { ItemStatus } from "@/types";

interface Props {
  status: ItemStatus;
  size?: number;
}

export function ItemStatusIcon({ status, size = 16 }: Props) {
  const s = size;

  switch (status) {
    case "inbox":
      return (
        <svg width={s} height={s} viewBox="0 0 14 14" fill="none" className="shrink-0">
          <circle cx="7" cy="7" r="6" fill="none"
            stroke="var(--color-status-inbox)" strokeWidth="2"
            strokeDasharray="1.4 1.74" strokeDashoffset="0.65" />
        </svg>
      );

    case "todo":
      return (
        <svg width={s} height={s} viewBox="0 0 14 14" fill="none" className="shrink-0">
          <circle cx="7" cy="7" r="6" fill="none"
            stroke="var(--color-status-todo)" strokeWidth="2"
            strokeDasharray="3.14 0" strokeDashoffset="-0.7" />
        </svg>
      );

    case "in_progress":
      return (
        <svg width={s} height={s} viewBox="0 0 14 14" fill="none" className="shrink-0">
          <circle cx="7" cy="7" r="6" fill="none"
            stroke="var(--color-status-in-progress)" strokeWidth="2"
            strokeDasharray="3.14 0" strokeDashoffset="-0.7" />
          <circle cx="7" cy="7" r="2" fill="none"
            stroke="var(--color-status-in-progress)" strokeWidth="4"
            strokeDasharray="6.25 100" strokeDashoffset="0"
            transform="rotate(-90 7 7)" />
        </svg>
      );

    case "done":
      return (
        <svg width={s} height={s} viewBox="0 0 14 14" fill="none" className="shrink-0">
          <circle cx="7" cy="7" r="6" fill="none"
            stroke="var(--color-status-done)" strokeWidth="2"
            strokeDasharray="3.14 0" strokeDashoffset="-0.7" />
          <path d="M4.5 7L6.5 9L9.5 5"
            stroke="var(--color-status-done)" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}
