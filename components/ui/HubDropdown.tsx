"use client";

import { useState, useRef, useEffect } from "react";
import { useHubStore } from "@/stores/hubStore";
import { getHubColorHex } from "@/lib/hubColors";
import { cn } from "@/lib/utils";

interface Props {
  value: string | null;
  onChange: (hubId: string | null) => void;
}

export function HubDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { getActiveHubs, getHubById } = useHubStore();
  const hubs = getActiveHubs();
  const selectedHub = value ? getHubById(value) : null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-bg-elevated transition-colors text-[13px] leading-[20px]"
      >
        {selectedHub ? (
          <>
            <svg width="6" height="6" viewBox="0 0 6 6" className="shrink-0">
              <circle cx="3" cy="3" r="3" fill={getHubColorHex(selectedHub.color)} />
            </svg>
            <span className="text-text-primary">{selectedHub.name}</span>
          </>
        ) : (
          <span className="text-text-tertiary">없음</span>
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-bg-surface border border-border-default rounded-lg shadow-xl z-50 py-1">
          {/* None option */}
          <button
            onClick={() => { onChange(null); setOpen(false); }}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-1.5 text-[13px] leading-[20px] transition-colors",
              value === null
                ? "bg-accent-muted text-accent"
                : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
            )}
          >
            <span className="text-text-tertiary">—</span>
            <span>없음</span>
          </button>

          {/* Hub options */}
          {hubs.map((hub) => (
            <button
              key={hub.id}
              onClick={() => { onChange(hub.id); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-[13px] leading-[20px] transition-colors",
                value === hub.id
                  ? "bg-accent-muted text-accent"
                  : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
              )}
            >
              <svg width="6" height="6" viewBox="0 0 6 6" className="shrink-0">
                <circle cx="3" cy="3" r="3" fill={getHubColorHex(hub.color)} />
              </svg>
              <span>{hub.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
