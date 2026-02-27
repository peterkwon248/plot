"use client";

import type { Hub } from "@/types";
import { getHubColorHex } from "@/lib/hubColors";

export function HubHeader({ hub }: { hub: Hub }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="10" height="10" viewBox="0 0 10 10">
        <circle cx="5" cy="5" r="5" fill={getHubColorHex(hub.color)} />
      </svg>
      <h1 className="text-[14px] leading-[20px] font-semibold text-text-primary">
        {hub.name}
      </h1>
    </div>
  );
}
