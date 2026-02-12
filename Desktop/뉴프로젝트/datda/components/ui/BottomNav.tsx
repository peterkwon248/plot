"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDatdaStore } from "@/lib/store";

const TABS = [
  {
    href: "/",
    label: "홈",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: "/vault",
    label: "서랍함",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <circle cx="12" cy="7.5" r="1" />
        <circle cx="12" cy="16.5" r="1" />
      </svg>
    ),
  },
  {
    href: "/history",
    label: "기록",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const phase = useDatdaStore((s) => s.phase);
  const hasSeenOnboarding = useDatdaStore((s) => s.hasSeenOnboarding);

  // Hide during active session or onboarding
  if ((phase !== "idle" && phase !== "final") || !hasSeenOnboarding) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0b]/90 backdrop-blur-lg border-t border-white/[0.06]">
      <div className="flex items-center justify-around max-w-md mx-auto h-16 px-2">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                "flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-colors duration-200",
                isActive
                  ? "text-[#a78bfa]"
                  : "text-[#52525b] hover:text-[#71717a]",
              ].join(" ")}
            >
              {tab.icon}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area for iOS home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
