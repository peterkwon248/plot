"use client";

import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { CommandBar } from "@/components/command-bar/CommandBar";
import { HubAssignOverlay } from "@/components/ui/HubAssignOverlay";
import { useViewStore } from "@/stores/viewStore";
import { useItemStore } from "@/stores/itemStore";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCommandBarOpen, isHubAssignOpen } = useViewStore();
  const { purgeDeleted } = useItemStore();

  // 글로벌 키보드 네비게이션 (j/k, Enter, Esc, ⌘K, 1-4, c, x)
  useKeyboardNavigation();

  // Supabase 동기화 (설정된 경우에만 활성화)
  useSupabaseSync();

  // 앱 로드 시 7일 이상 soft-delete된 아이템 자동 정리
  useEffect(() => {
    purgeDeleted();
  }, [purgeDeleted]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex overflow-hidden relative">
        {children}
        <DetailPanel />
      </main>
      {isCommandBarOpen && <CommandBar />}
      {isHubAssignOpen && <HubAssignOverlay />}
    </div>
  );
}
