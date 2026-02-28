"use client";

import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { DetailPanel } from "@/components/layout/DetailPanel";
import { CommandBar } from "@/components/command-bar/CommandBar";
import { HubAssignOverlay } from "@/components/ui/HubAssignOverlay";
import { OnboardingGuide } from "@/components/ui/OnboardingGuide";
import { ShortcutHelpModal } from "@/components/ui/ShortcutHelpModal";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { SidebarProvider } from "@/components/ui/sidebar-primitives";
import { Toaster } from "@/components/ui/sonner";
import { useViewStore } from "@/stores/viewStore";
import { useItemStore } from "@/stores/itemStore";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSettingsOpen } = useViewStore();
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
    <SidebarProvider>
      <Sidebar />
      <main className="flex-1 flex overflow-hidden p-2">
        <div className="flex-1 border border-border-default/60 rounded-lg overflow-hidden flex flex-col bg-bg-secondary relative">
          {children}
          <DetailPanel />
        </div>
      </main>
      <CommandBar />
      <HubAssignOverlay />
      <ShortcutHelpModal />
      {isSettingsOpen && <SettingsPanel />}
      <OnboardingGuide />
      <Toaster />
    </SidebarProvider>
  );
}
