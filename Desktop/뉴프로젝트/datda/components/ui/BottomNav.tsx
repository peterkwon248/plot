"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDatdaStore } from "@/lib/store";

const TABS = [
  {
    href: "/",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: "/vault",
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-[#1a1a1f]/95 via-[#1a1a1f]/90 to-transparent backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-around max-w-md mx-auto h-14 px-2">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-1.5 w-16 h-10 transition-colors duration-200"
            >
              <div className={isActive ? "text-[#a78bfa]" : "text-[#4a4a58] hover:text-[#9898a8]"}>
                {tab.icon}
              </div>
              {isActive && (
                <div className="w-[2px] h-[2px] rounded-full bg-[#a78bfa]" />
              )}
            </Link>
          );
        })}
      </div>
      {/* Safe area for iOS home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
