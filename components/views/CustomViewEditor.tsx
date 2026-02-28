"use client";

import { useState } from "react";
import { useCustomViewStore } from "@/stores/customViewStore";
import { useHubStore } from "@/stores/hubStore";
import type { ItemStatus, ItemPriority, CustomViewFilter, CustomView } from "@/types";

const STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: "inbox", label: "메모" },
  { value: "todo", label: "할 일" },
  { value: "in_progress", label: "진행 중" },
  { value: "done", label: "완료" },
];

const PRIORITY_OPTIONS: { value: ItemPriority; label: string }[] = [
  { value: "urgent", label: "긴급" },
  { value: "high", label: "높음" },
  { value: "medium", label: "보통" },
  { value: "low", label: "낮음" },
  { value: "none", label: "없음" },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "manual", label: "수동" },
  { value: "created", label: "생성순" },
  { value: "updated", label: "수정순" },
  { value: "priority", label: "중요도순" },
  { value: "title", label: "제목순" },
];

interface CustomViewEditorProps {
  editingView?: CustomView;
  onClose: () => void;
}

export function CustomViewEditor({ editingView, onClose }: CustomViewEditorProps) {
  const { addView, updateView } = useCustomViewStore();
  const hubs = useHubStore(state => state.getActiveHubs());

  const [name, setName] = useState(editingView?.name || "");
  const [selectedStatuses, setSelectedStatuses] = useState<ItemStatus[]>(editingView?.filter.status || []);
  const [selectedPriorities, setSelectedPriorities] = useState<ItemPriority[]>(editingView?.filter.priority || []);
  const [selectedHubs, setSelectedHubs] = useState<string[]>(editingView?.filter.hub_ids || []);
  const [sortBy, setSortBy] = useState<"manual" | "created" | "updated" | "priority" | "title">(editingView?.sort_by || "manual");
  const [sortDir, setSortDir] = useState(editingView?.sort_dir || "desc");

  const toggleInArray = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const filter: CustomViewFilter = {};
    if (selectedStatuses.length > 0) filter.status = selectedStatuses;
    if (selectedPriorities.length > 0) filter.priority = selectedPriorities;
    if (selectedHubs.length > 0) filter.hub_ids = selectedHubs;

    if (editingView) {
      updateView(editingView.id, { name: trimmedName, filter, sort_by: sortBy as any, sort_dir: sortDir as any });
    } else {
      addView(trimmedName, filter, sortBy, sortDir);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(10, 13, 15, 0.6)", backdropFilter: "blur(12px)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-[420px] bg-bg-surface border border-border-default rounded-xl shadow-2xl overflow-hidden"
        style={{ animation: "commandBarIn 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-12 border-b border-border-subtle">
          <span className="text-[14px] leading-[20px] font-medium text-text-primary">
            {editingView ? "뷰 수정" : "새 뷰 만들기"}
          </span>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-secondary transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="3" y1="3" x2="11" y2="11" />
              <line x1="11" y1="3" x2="3" y2="11" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5">
          {/* Name */}
          <div>
            <label className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium mb-1.5 block">
              이름
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="예: 높은 중요도"
              className="w-full h-9 px-3 bg-bg-elevated border border-border-default rounded-lg text-[13px] leading-[20px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-border-focus"
              autoFocus
            />
          </div>

          {/* Status filter */}
          <div>
            <label className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium mb-1.5 block">
              상태
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedStatuses(toggleInArray(selectedStatuses, opt.value))}
                  className={`text-[12px] leading-[16px] px-2.5 py-1 rounded-md border transition-colors ${
                    selectedStatuses.includes(opt.value)
                      ? "bg-accent-muted border-accent/30 text-accent"
                      : "border-border-default text-text-secondary hover:border-border-focus"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority filter */}
          <div>
            <label className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium mb-1.5 block">
              중요도
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedPriorities(toggleInArray(selectedPriorities, opt.value))}
                  className={`text-[12px] leading-[16px] px-2.5 py-1 rounded-md border transition-colors ${
                    selectedPriorities.includes(opt.value)
                      ? "bg-accent-muted border-accent/30 text-accent"
                      : "border-border-default text-text-secondary hover:border-border-focus"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hub filter */}
          {hubs.length > 0 && (
            <div>
              <label className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium mb-1.5 block">
                프로젝트
              </label>
              <div className="flex flex-wrap gap-1.5">
                {hubs.map(hub => (
                  <button
                    key={hub.id}
                    onClick={() => setSelectedHubs(toggleInArray(selectedHubs, hub.id))}
                    className={`text-[12px] leading-[16px] px-2.5 py-1 rounded-md border transition-colors ${
                      selectedHubs.includes(hub.id)
                        ? "bg-accent-muted border-accent/30 text-accent"
                        : "border-border-default text-text-secondary hover:border-border-focus"
                    }`}
                  >
                    {hub.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sort */}
          <div>
            <label className="text-[11px] leading-[16px] tracking-[0.04em] uppercase text-text-tertiary font-medium mb-1.5 block">
              정렬
            </label>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="h-9 px-3 bg-bg-elevated border border-border-default rounded-lg text-[13px] text-text-primary outline-none focus:border-border-focus appearance-none cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
                className="h-9 w-9 flex items-center justify-center bg-bg-elevated border border-border-default rounded-lg text-text-secondary hover:text-text-primary transition-colors"
                title={sortDir === "asc" ? "오름차순" : "내림차순"}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  {sortDir === "asc" ? (
                    <path d="M7 11V3M4 6l3-3 3 3" />
                  ) : (
                    <path d="M7 3v8M4 8l3 3 3-3" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border-subtle">
          <button
            onClick={onClose}
            className="text-[13px] leading-[20px] px-3 py-1.5 text-text-secondary hover:text-text-primary transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="text-[13px] leading-[20px] px-4 py-1.5 bg-accent text-bg-primary font-medium rounded-lg hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {editingView ? "저장" : "만들기"}
          </button>
        </div>
      </div>
    </div>
  );
}
