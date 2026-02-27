"use client";

import type { Hub } from "@/types";
import { getHubColorHex } from "@/lib/hubColors";

interface Props {
  hub: Hub;
}

export function HubHeader({ hub }: Props) {
  return (
    <div className="h-12 flex items-center gap-3 px-4 border-b border-border-default">
      <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0">
        <circle cx="4" cy="4" r="4" fill={getHubColorHex(hub.color)} />
      </svg>
      <h1 className="text-[24px] leading-[32px] tracking-[-0.02em] font-semibold flex-1 truncate">
        {hub.name}
      </h1>
    </div>
  );
}
