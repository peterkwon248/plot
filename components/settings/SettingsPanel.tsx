"use client";

import { useSettingsStore } from "@/stores/settingsStore";
import { useViewStore } from "@/stores/viewStore";
import { cn } from "@/lib/utils";
import type { ItemStatus, ItemPriority } from "@/types";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: "inbox", label: "메모" },
  { value: "todo", label: "할 일" },
  { value: "in_progress", label: "진행 중" },
  { value: "done", label: "완료" },
];

const PRIORITY_OPTIONS: { value: ItemPriority; label: string }[] = [
  { value: "none", label: "없음" },
  { value: "low", label: "낮음" },
  { value: "medium", label: "보통" },
  { value: "high", label: "높음" },
  { value: "urgent", label: "긴급" },
];

export function SettingsPanel() {
  const { toggleSettings } = useViewStore();
  const {
    density,
    showCompletedItems,
    defaultStatus,
    defaultPriority,
    confirmDelete,
    updateSettings,
  } = useSettingsStore();

  const handleExportData = () => {
    const data: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("plot-")) {
        try {
          const value = localStorage.getItem(key);
          data[key] = value ? JSON.parse(value) : null;
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plot-data-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="absolute inset-0 z-30 bg-bg-primary flex flex-col"
      style={{ animation: "detailPanelIn 150ms ease forwards" }}
    >
      {/* Top Bar */}
      <div className="h-12 shrink-0 flex items-center px-6 border-b border-border-default">
        <button
          onClick={() => toggleSettings(false)}
          className="text-text-secondary hover:text-text-primary transition-colors mr-3"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="8" x2="4" y2="8" />
            <polyline points="8,4 4,8 8,12" />
          </svg>
        </button>
        <span className="text-[16px] leading-[24px] tracking-[-0.01em] font-semibold text-text-primary">
          설정
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto py-8 px-6 space-y-8">
          {/* Section: 일반 */}
          <section>
            <h2 className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium mb-3">
              일반
            </h2>
            <div className="space-y-1">
              {/* 밀도 */}
              <div className="flex items-center justify-between h-9 px-2.5 rounded-md hover:bg-bg-elevated transition-colors">
                <span className="text-[13px] leading-[20px] text-text-secondary">
                  밀도
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => updateSettings({ density: "comfortable" })}
                    className={cn(
                      "px-3 py-1 rounded-md text-[12px] leading-[16px] transition-colors",
                      density === "comfortable"
                        ? "bg-accent-muted text-accent"
                        : "bg-bg-elevated text-text-secondary hover:text-text-primary"
                    )}
                  >
                    편안함
                  </button>
                  <button
                    onClick={() => updateSettings({ density: "compact" })}
                    className={cn(
                      "px-3 py-1 rounded-md text-[12px] leading-[16px] transition-colors",
                      density === "compact"
                        ? "bg-accent-muted text-accent"
                        : "bg-bg-elevated text-text-secondary hover:text-text-primary"
                    )}
                  >
                    조밀함
                  </button>
                </div>
              </div>

              {/* 완료 항목 표시 */}
              <div className="flex items-center justify-between h-9 px-2.5 rounded-md hover:bg-bg-elevated transition-colors">
                <span className="text-[13px] leading-[20px] text-text-secondary">
                  완료 항목 표시
                </span>
                <Switch
                  checked={showCompletedItems}
                  onCheckedChange={(checked) => updateSettings({ showCompletedItems: checked })}
                />
              </div>

              {/* 삭제 전 확인 */}
              <div className="flex items-center justify-between h-9 px-2.5 rounded-md hover:bg-bg-elevated transition-colors">
                <span className="text-[13px] leading-[20px] text-text-secondary">
                  삭제 전 확인
                </span>
                <Switch
                  checked={confirmDelete}
                  onCheckedChange={(checked) => updateSettings({ confirmDelete: checked })}
                />
              </div>
            </div>
          </section>

          {/* Section: 기본값 */}
          <section>
            <h2 className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium mb-3">
              기본값
            </h2>
            <div className="space-y-1">
              {/* 기본 상태 */}
              <div className="flex items-center justify-between h-9 px-2.5 rounded-md hover:bg-bg-elevated transition-colors">
                <span className="text-[13px] leading-[20px] text-text-secondary">
                  기본 상태
                </span>
                <Select value={defaultStatus} onValueChange={(v) => updateSettings({ defaultStatus: v as ItemStatus })}>
                  <SelectTrigger className="h-8 w-auto gap-2 bg-bg-elevated border-border-default text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 기본 중요도 */}
              <div className="flex items-center justify-between h-9 px-2.5 rounded-md hover:bg-bg-elevated transition-colors">
                <span className="text-[13px] leading-[20px] text-text-secondary">
                  기본 중요도
                </span>
                <Select value={defaultPriority} onValueChange={(v) => updateSettings({ defaultPriority: v as ItemPriority })}>
                  <SelectTrigger className="h-8 w-auto gap-2 bg-bg-elevated border-border-default text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Section: 데이터 */}
          <section>
            <h2 className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium mb-3">
              데이터
            </h2>
            <div className="space-y-1">
              {/* 데이터 내보내기 */}
              <button
                onClick={handleExportData}
                className="w-full flex items-center justify-between h-9 px-2.5 rounded-md hover:bg-bg-elevated transition-colors text-left"
              >
                <span className="text-[13px] leading-[20px] text-text-secondary">
                  데이터 내보내기
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 3v6M4 6l3 3 3-3" />
                  <path d="M2 11h10" />
                </svg>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
