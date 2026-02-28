"use client";

import { useViewStore } from "@/stores/viewStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const shortcuts = [
  {
    category: "탐색",
    items: [
      { keys: ["J", "↓"], desc: "아래로 이동" },
      { keys: ["K", "↑"], desc: "위로 이동" },
      { keys: ["Enter"], desc: "상세 열기" },
      { keys: ["Esc"], desc: "닫기" },
    ],
  },
  {
    category: "항목 작업",
    items: [
      { keys: ["C"], desc: "새 항목 만들기" },
      { keys: ["S"], desc: "상태 순환" },
      { keys: ["P"], desc: "중요도 순환" },
      { keys: ["M"], desc: "프로젝트 배정" },
      { keys: ["1-4"], desc: "상태 직접 변경" },
      { keys: ["X"], desc: "삭제" },
    ],
  },
  {
    category: "명령",
    items: [
      { keys: ["⌘K"], desc: "명령 팔레트" },
      { keys: ["⌘D"], desc: "복제" },
      { keys: ["⌘L"], desc: "노드 연결" },
      { keys: ["?"], desc: "단축키 도움말" },
    ],
  },
];

export function ShortcutHelpModal() {
  const { isShortcutHelpOpen, toggleShortcutHelp } = useViewStore();

  return (
    <Dialog open={isShortcutHelpOpen} onOpenChange={(open) => !open && toggleShortcutHelp(false)}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-[14px] leading-[20px] font-medium">
            키보드 단축키
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <span className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium mb-2 block">
                {section.category}
              </span>
              <div className="space-y-1.5">
                {section.items.map((s) => (
                  <div key={s.desc} className="flex items-center justify-between">
                    <span className="text-[13px] leading-[20px] text-text-secondary">
                      {s.desc}
                    </span>
                    <div className="flex gap-1">
                      {s.keys.map((key) => (
                        <kbd
                          key={key}
                          className="text-[11px] leading-[16px] px-1.5 py-0.5 rounded bg-bg-elevated border border-border-default text-text-tertiary font-mono"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
