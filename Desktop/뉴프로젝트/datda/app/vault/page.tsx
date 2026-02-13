"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useDatdaStore } from "@/lib/store";
import type { Goal, GoalStep } from "@/lib/store";
import StepEditor from "@/components/vault/StepEditor";
import AiStepEditor from "@/components/vault/AiStepEditor";

// ─── Draggable Step List (separate component for local state during drag) ───

function DraggableStepList({ goal }: { goal: Goal }) {
  const moveGoalStep = useDatdaStore((s) => s.moveGoalStep);
  const reorderGoalSteps = useDatdaStore((s) => s.reorderGoalSteps);

  const [localSteps, setLocalSteps] = useState<GoalStep[]>(goal.steps);
  const isDragging = useRef(false);
  const idMap = useRef(new WeakMap<GoalStep, string>());

  // Stable ID per step object (survives reorder, breaks on store update = correct)
  const getStepId = useCallback((step: GoalStep) => {
    if (!idMap.current.has(step)) {
      idMap.current.set(step, Math.random().toString(36).slice(2));
    }
    return idMap.current.get(step)!;
  }, []);

  // Sync local state with store when NOT dragging
  useEffect(() => {
    if (!isDragging.current) {
      setLocalSteps(goal.steps);
    }
  }, [goal.steps]);

  const nextStepIndex = localSteps.findIndex((s) => !s.completed && !s.discarded);

  return (
    <Reorder.Group
      axis="y"
      values={localSteps}
      onReorder={setLocalSteps}
      className="flex flex-col gap-1"
    >
      {localSteps.map((step, i) => {
        const isNext = i === nextStepIndex;
        const isCompleted = step.completed;
        const isDiscarded = step.discarded;
        const isFinished = isCompleted || isDiscarded;
        const isFirst = i === 0;
        const isLast = i === localSteps.length - 1;

        return (
          <Reorder.Item
            key={getStepId(step)}
            value={step}
            dragListener={!isFinished}
            onDragStart={() => { isDragging.current = true; }}
            onDragEnd={() => {
              isDragging.current = false;
              reorderGoalSteps(goal.id, localSteps);
            }}
            className={[
              "flex items-center gap-2 py-1.5 list-none",
              isFinished ? "opacity-40 cursor-default" : "group/step cursor-grab active:cursor-grabbing",
            ].join(" ")}
            whileDrag={isFinished ? undefined : {
              scale: 1.02,
              backgroundColor: "rgba(167, 139, 250, 0.08)",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              zIndex: 50,
            }}
          >
            {/* Drag handle */}
            <div className={isFinished ? "text-[#2d2d38]" : "text-[#66667a] group-hover/step:text-[#8888a0] transition-colors touch-none"}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="9" cy="6" r="1.5" />
                <circle cx="15" cy="6" r="1.5" />
                <circle cx="9" cy="12" r="1.5" />
                <circle cx="15" cy="12" r="1.5" />
                <circle cx="9" cy="18" r="1.5" />
                <circle cx="15" cy="18" r="1.5" />
              </svg>
            </div>

            {/* Step dot */}
            <div className="mt-0.5">
              {isCompleted ? (
                <div className="w-1.5 h-1.5 rounded-full bg-[#a78bfa]" />
              ) : isNext ? (
                <div className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-dot-breathe" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-[#2d2d38]" />
              )}
            </div>

            {/* Step text */}
            <div className="flex-1 flex items-center gap-2">
              <span
                className={[
                  "text-sm leading-relaxed",
                  isCompleted
                    ? "text-[#8888a0] line-through"
                    : isNext
                    ? "text-[#e8e8f0]"
                    : "text-[#9898a8]",
                ].join(" ")}
              >
                {step.action}
              </span>
              {isNext && (
                <span className="px-2 py-0.5 text-[11px] tracking-wider text-[#a78bfa]/70 bg-[#a78bfa]/8 rounded-full">
                  다음
                </span>
              )}
            </div>

            {/* Top/Bottom quick buttons - hidden for finished steps */}
            {!isFinished && <div className="flex gap-0.5 opacity-0 group-hover/step:opacity-100 transition-opacity duration-200">
              {!isFirst && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveGoalStep(goal.id, i, 0);
                  }}
                  className="w-6 h-6 flex items-center justify-center text-[#8888a0] hover:text-[#a78bfa] rounded transition-colors"
                  title="제일 위로"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l7.5-7.5 7.5 7.5m-15 6l7.5-7.5 7.5 7.5" />
                  </svg>
                </button>
              )}
              {!isLast && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveGoalStep(goal.id, i, localSteps.length - 1);
                  }}
                  className="w-6 h-6 flex items-center justify-center text-[#8888a0] hover:text-[#a78bfa] rounded transition-colors"
                  title="제일 아래로"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 5.25l-7.5 7.5-7.5-7.5m15 6l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              )}
            </div>}
          </Reorder.Item>
        );
      })}
    </Reorder.Group>
  );
}

// ─── Helpers ───

function formatKoreanTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours < 12 ? "오전" : "오후";
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMin = minutes.toString().padStart(2, "0");
  return `${period} ${displayHour}:${displayMin}`;
}

export default function VaultPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const goals = useDatdaStore((s) => s.goals);
  const addGoal = useDatdaStore((s) => s.addGoal);
  const removeGoal = useDatdaStore((s) => s.removeGoal);
  const canAccessVault = useDatdaStore((s) => s.canAccessVault);
  const recordVaultAccess = useDatdaStore((s) => s.recordVaultAccess);
  const getNextAccessTime = useDatdaStore((s) => s.getNextAccessTime);
  const shuffleGoalSteps = useDatdaStore((s) => s.shuffleGoalSteps);

  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [showStepEditor, setShowStepEditor] = useState<string | null>(null);
  const [showAiEditor, setShowAiEditor] = useState<string | null>(null);
  const accessRecorded = useRef(false);

  // Check vault access on mount
  useEffect(() => {
    if (!mounted) return;
    const canAccess = canAccessVault();
    setVaultUnlocked(canAccess);
    if (canAccess && !accessRecorded.current) {
      recordVaultAccess();
      accessRecorded.current = true;
    }
  }, [mounted, canAccessVault, recordVaultAccess]);

  const handleAddGoal = () => {
    const trimmed = newGoalTitle.trim();
    if (trimmed.length === 0) return;
    addGoal(trimmed);
    setNewGoalTitle("");
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-pulse" />
      </div>
    );
  }

  // Locked state
  if (!vaultUnlocked) {
    const nextTime = getNextAccessTime();

    return (
      <div className="w-full max-w-md mx-auto py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <svg
            className="w-12 h-12 text-[#9898a8]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
          <h2 className="text-lg font-light text-[#e8e8f0]">
            서랍이 잠겨 있습니다
          </h2>
          {nextTime && (
            <p className="text-sm text-[#8888a0]">
              다음 열기: {formatKoreanTime(nextTime)}
            </p>
          )}
          <Link href="/" className="text-sm text-[#a78bfa] hover:text-[#b89dfc] cursor-pointer">
            돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // Unlocked state - Drawer concept
  return (
    <div className="w-full max-w-md mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light tracking-wide text-[#e8e8f0] mb-2">서랍함</h1>
        <p className="text-sm text-[#8888a0]">
          큰 목표를 넣어두는 곳. 꺼내는 건 앱이 합니다.
        </p>
      </div>

      {/* Goals List */}
      <div className="flex flex-col gap-4 mb-8">
        <AnimatePresence mode="popLayout">
          {goals.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-24 text-center"
            >
              <p className="text-2xl font-light text-[#9898a8] mb-3">
                서랍이 비어 있습니다
              </p>
              <p className="text-sm text-[#8888a0] mb-6">
                목표를 넣어두면, 매일 하나씩 꺼내드립니다.
              </p>
              <Link href="/chat" className="text-sm text-[#a78bfa] hover:text-[#b89dfc] cursor-pointer inline-block">
                채팅으로 쪼개기 →
              </Link>
            </motion.div>
          ) : (
            goals.map((goal) => {
              const isExpanded = expandedGoalId === goal.id;
              const completedCount = goal.steps.filter((s) => s.completed).length;
              const totalCount = goal.steps.length;
              const allCompleted = totalCount > 0 && completedCount === totalCount;
              const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

              return (
                <motion.div
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className={[
                    "backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 relative overflow-hidden",
                    allCompleted ? "bg-[#a78bfa]/[0.03]" : "bg-white/[0.04]",
                    isExpanded
                      ? "border-[#a78bfa]/20"
                      : allCompleted
                      ? "border-[#a78bfa]/30 hover:scale-[1.01] hover:border-[#a78bfa]/40 cursor-pointer hover:shadow-[0_0_20px_rgba(167,139,250,0.05)]"
                      : "border-white/[0.08] hover:scale-[1.01] hover:border-white/[0.1] cursor-pointer hover:shadow-[0_0_20px_rgba(167,139,250,0.05)]",
                  ].join(" ")}
                  onClick={() => {
                    if (!isExpanded) setExpandedGoalId(goal.id);
                  }}
                >
                  {/* Card Header - always visible */}
                  <div
                    className={[
                      "flex items-start justify-between gap-4",
                      isExpanded ? "cursor-pointer" : "",
                    ].join(" ")}
                    onClick={(e) => {
                      if (isExpanded) {
                        e.stopPropagation();
                        setExpandedGoalId(null);
                      }
                    }}
                  >
                    <div className="flex items-start gap-2 flex-1">
                      <svg
                        className={[
                          "w-4 h-4 mt-0.5 transition-transform duration-300 shrink-0",
                          isExpanded ? "rotate-180" : "",
                        ].join(" ")}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                      <h3 className="text-[15px] font-normal tracking-wide text-[#e8e8f0] flex-1">
                        {goal.title}
                        {(goal.round ?? 1) > 1 && (
                          <span className="ml-2 text-xs font-normal text-[#a78bfa]/70">
                            {goal.round}회차
                          </span>
                        )}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {totalCount > 0 && (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-light text-[#a78bfa] tabular-nums">
                            {completedCount}
                          </span>
                          <span className="text-sm text-[#66667a]/60 tabular-nums">
                            / {totalCount}
                          </span>
                          {allCompleted && (
                            <span className="ml-2 px-2 py-0.5 text-xs tracking-wider text-[#a78bfa]/70 bg-[#a78bfa]/8 rounded-full">
                              완료
                            </span>
                          )}
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeGoal(goal.id);
                          setExpandedGoalId(null);
                        }}
                        className="opacity-40 hover:opacity-100 hover:text-red-400/80 transition-all duration-300 py-2"
                        aria-label="삭제"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Progress line at bottom of collapsed card */}
                  {!isExpanded && totalCount > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2d2d38]">
                      <div
                        className="h-full bg-gradient-to-r from-[#a78bfa] to-[#c4b5fd] rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  )}

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="mt-6 pt-5 border-t border-white/[0.08]">
                          {/* Goal with steps - drag & drop */}
                          {totalCount > 0 && !allCompleted && (
                            <DraggableStepList goal={goal} />
                          )}

                          {/* Edit buttons - only for active goals with steps */}
                          {totalCount > 0 && !allCompleted && (
                            <div className="flex gap-2 mt-4 pt-3 border-t border-white/[0.06]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowStepEditor(goal.id);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#9898a8] hover:text-[#e8e8f0] bg-white/[0.04] hover:bg-white/[0.08] rounded-lg transition-all duration-200"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                                직접 수정
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowAiEditor(goal.id);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#a78bfa]/70 hover:text-[#a78bfa] bg-[#a78bfa]/[0.06] hover:bg-[#a78bfa]/[0.12] rounded-lg transition-all duration-200"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                                </svg>
                                AI 수정
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  shuffleGoalSteps(goal.id);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#9898a8] hover:text-[#e8e8f0] bg-white/[0.04] hover:bg-white/[0.08] rounded-lg transition-all duration-200"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                                </svg>
                                섞기
                              </button>
                            </div>
                          )}

                          {/* All steps completed */}
                          {allCompleted && (
                            <div className="text-center py-4">
                              <p className="text-sm text-[#9898a8] mb-5">
                                모든 단계를 닫았습니다
                              </p>
                              <div className="flex gap-2 justify-center">
                                <Link href="/chat" className="text-sm text-[#a78bfa] hover:text-[#b89dfc] cursor-pointer">
                                  새 프로젝트 시작 →
                                </Link>
                                <span className="text-[#66667a]">·</span>
                                <Link
                                  href={`/chat?goalId=${goal.id}`}
                                  className="text-sm text-[#9898a8] hover:text-[#a78bfa] cursor-pointer"
                                >
                                  이 프로젝트 심화
                                </Link>
                              </div>
                            </div>
                          )}

                          {/* No steps - needs AI decomposition */}
                          {totalCount === 0 && (
                            <div className="py-2">
                              <Link
                                href="/chat"
                                className="text-sm text-[#a78bfa]/60 hover:text-[#a78bfa] transition-colors"
                              >
                                채팅으로 쪼개기 →
                              </Link>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Bottom section - two options side by side */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            placeholder="새 목표 넣기..."
            className="input-base flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddGoal();
            }}
          />
          <button
            onClick={handleAddGoal}
            disabled={newGoalTitle.trim().length === 0}
            className="text-sm text-[#a78bfa] hover:text-[#b89dfc] cursor-pointer shrink-0 px-4 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            넣기
          </button>
        </div>
        <Link href="/chat" className="shrink-0 text-sm text-[#a78bfa] hover:text-[#b89dfc] cursor-pointer px-4 py-3">
          채팅으로 쪼개기 →
        </Link>
      </div>

      {/* Settings link */}
      <Link
        href="/settings"
        className="text-xs tracking-wider text-[#8888a0] hover:text-[#9898a8] transition-colors mt-4 block text-center py-2"
      >
        설정
      </Link>

      {/* Step Editor Modal */}
      <AnimatePresence>
        {showStepEditor && (() => {
          const goal = goals.find((g) => g.id === showStepEditor);
          if (!goal) return null;
          return (
            <StepEditor
              key="step-editor"
              steps={goal.steps}
              goalId={goal.id}
              onClose={() => setShowStepEditor(null)}
            />
          );
        })()}
      </AnimatePresence>

      {/* AI Step Editor Modal */}
      <AnimatePresence>
        {showAiEditor && (() => {
          const goal = goals.find((g) => g.id === showAiEditor);
          if (!goal) return null;
          return (
            <AiStepEditor
              key="ai-step-editor"
              goalId={goal.id}
              goalTitle={goal.title}
              steps={goal.steps}
              onClose={() => setShowAiEditor(null)}
              onStepsReplaced={() => setShowAiEditor(null)}
            />
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
