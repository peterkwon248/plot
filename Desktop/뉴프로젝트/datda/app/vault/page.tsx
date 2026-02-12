"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useDatdaStore } from "@/lib/store";
import Button from "@/components/ui/Button";

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

  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
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
          <span className="text-6xl" role="img" aria-label="잠금">
            🔒
          </span>
          <h2 className="text-xl font-medium text-[#e4e4e7]">
            서랍이 잠겨 있습니다
          </h2>
          {nextTime && (
            <p className="text-sm text-[#71717a]">
              다음 열기: {formatKoreanTime(nextTime)}
            </p>
          )}
          <Link href="/">
            <Button variant="secondary" className="py-2">돌아가기</Button>
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
        <h1 className="text-2xl font-semibold text-[#e4e4e7] mb-2">서랍함</h1>
        <p className="text-sm text-[#71717a]">
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
              <p className="text-2xl font-light text-[#71717a] mb-3">
                서랍이 비어 있습니다
              </p>
              <p className="text-sm text-[#52525b] mb-6">
                목표를 넣어두면, 매일 하나씩 꺼내드립니다.
              </p>
              <Link href="/chat">
                <Button variant="primary" className="py-2">
                  AI로 목표 쪼개기 →
                </Button>
              </Link>
            </motion.div>
          ) : (
            goals.map((goal) => {
              const isExpanded = expandedGoalId === goal.id;
              const completedCount = goal.steps.filter((s) => s.completed).length;
              const totalCount = goal.steps.length;
              const allCompleted = totalCount > 0 && completedCount === totalCount;
              const nextStepIndex = goal.steps.findIndex((s) => !s.completed);
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
                    allCompleted ? "bg-[#a78bfa]/[0.03]" : "bg-white/[0.03]",
                    isExpanded
                      ? "border-[#a78bfa]/20"
                      : allCompleted
                      ? "border-[#a78bfa]/30 hover:scale-[1.01] hover:border-[#a78bfa]/40 cursor-pointer hover:shadow-[0_0_20px_rgba(167,139,250,0.05)]"
                      : "border-white/[0.06] hover:scale-[1.01] hover:border-white/[0.1] cursor-pointer hover:shadow-[0_0_20px_rgba(167,139,250,0.05)]",
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
                      <h3 className="text-base font-medium text-[#e4e4e7] tracking-wide flex-1">
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
                          <span className="text-sm text-[#3f3f46] tabular-nums">
                            / {totalCount}
                          </span>
                          {allCompleted && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium text-[#a78bfa] bg-[#a78bfa]/10 rounded-full">
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
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#27272a]">
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
                        <div className="mt-6 pt-5 border-t border-white/[0.06]">
                          {/* Goal with steps */}
                          {totalCount > 0 && !allCompleted && (
                            <div className="flex flex-col gap-2.5">
                              {goal.steps.map((step, i) => {
                                const isNext = i === nextStepIndex;
                                const isCompleted = step.completed;

                                return (
                                  <div
                                    key={i}
                                    className="flex items-start gap-3 py-1.5"
                                  >
                                    <div className="mt-1.5">
                                      {isCompleted ? (
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#a78bfa]" />
                                      ) : isNext ? (
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] ring-4 ring-[#a78bfa]/20" />
                                      ) : (
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#27272a]" />
                                      )}
                                    </div>
                                    <div className="flex-1 flex items-center gap-2">
                                      <span
                                        className={[
                                          "text-[13px] leading-relaxed",
                                          isCompleted
                                            ? "text-[#52525b] line-through"
                                            : isNext
                                            ? "text-[#e4e4e7]"
                                            : "text-[#71717a]",
                                        ].join(" ")}
                                      >
                                        {step.action}
                                      </span>
                                      {isNext && (
                                        <span className="px-2 py-0.5 text-[10px] font-medium text-[#a78bfa] bg-[#a78bfa]/10 rounded-full">
                                          다음
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* All steps completed */}
                          {allCompleted && (
                            <div className="text-center py-4">
                              <p className="text-sm text-[#71717a] mb-5">
                                모든 단계를 닫았습니다
                              </p>
                              <div className="flex gap-2 justify-center">
                                <Link href="/chat">
                                  <Button variant="primary" className="text-sm px-4 py-2">
                                    새 프로젝트 시작 →
                                  </Button>
                                </Link>
                                <Link
                                  href={`/chat?goalId=${goal.id}`}
                                >
                                  <Button variant="secondary" className="text-sm px-4 py-2">
                                    이 프로젝트 심화
                                  </Button>
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
                                AI로 로드맵 만들기 →
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
            className="flex-1 px-4 py-3 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl text-[#e4e4e7] placeholder:text-[#71717a]/50 text-sm focus:border-[#a78bfa]/50 focus:outline-none transition-all duration-300"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddGoal();
            }}
          />
          <Button
            variant="primary"
            onClick={handleAddGoal}
            disabled={newGoalTitle.trim().length === 0}
            className="shrink-0 py-2"
          >
            넣기
          </Button>
        </div>
        <Link href="/chat" className="shrink-0">
          <Button variant="secondary" className="h-full py-2">
            AI로 쪼개기 →
          </Button>
        </Link>
      </div>

      {/* Settings link */}
      <Link
        href="/settings"
        className="text-xs text-[#52525b] hover:text-[#71717a] transition-colors mt-4 block text-center py-2"
      >
        설정
      </Link>
    </div>
  );
}
