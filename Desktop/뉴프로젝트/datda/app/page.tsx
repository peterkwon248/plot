"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useDatdaStore } from "@/lib/store";
import { decomposeGoal } from "@/lib/gemini";
import type { Phase, ResultType } from "@/lib/constants";
import { OVERLOAD_CONFIG } from "@/lib/constants";
import FadeTransition from "@/components/ui/FadeTransition";
import PhaseIndicator from "@/components/ui/PhaseIndicator";
import MakePhase from "@/components/session/MakePhase";
import ClosePhase from "@/components/session/ClosePhase";
import FinalScreen from "@/components/session/FinalScreen";
import Onboarding from "@/components/Onboarding";

// Map store phase to PhaseIndicator's expected uppercase format
const PHASE_LABEL_MAP: Record<string, "MAKE" | "CLOSE" | "FINAL"> = {
  make: "MAKE",
  close: "CLOSE",
  final: "FINAL",
};

// Format timestamp to relative time in Korean
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days === 1) return "어제";
  return `${days}일 전`;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "좋은 아침";
  if (hour >= 12 && hour < 18) return "좋은 오후";
  if (hour >= 18 && hour < 24) return "좋은 저녁";
  return "아직 깨어 있군요";
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const phase = useDatdaStore((s) => s.phase);
  const sessions = useDatdaStore((s) => s.sessions);
  const goals = useDatdaStore((s) => s.goals);
  const getTodaysSuggestion = useDatdaStore((s) => s.getTodaysSuggestion);
  const getAllSuggestions = useDatdaStore((s) => s.getAllSuggestions);
  const setAiRecommendation = useDatdaStore((s) => s.setAiRecommendation);
  const hasSeenOnboarding = useDatdaStore((s) => s.hasSeenOnboarding);
  const startOpen = useDatdaStore((s) => s.startOpen);
  const setResultType = useDatdaStore((s) => s.setResultType);
  const startMake = useDatdaStore((s) => s.startMake);
  const addGoalWithSteps = useDatdaStore((s) => s.addGoalWithSteps);
  const isOverloaded = useDatdaStore((s) => s.isOverloaded);

  // Goal input state
  const [goalInput, setGoalInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOverloadWarning, setShowOverloadWarning] = useState(false);
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [customMinutes, setCustomMinutes] = useState<Record<string, number>>({});
  const getTimerPresets = useDatdaStore((s) => s.getTimerPresets);

  // Suggestion (single - for backward compat checks)
  const suggestion = useMemo(() => {
    if (!mounted) return null;
    return getTodaysSuggestion();
  }, [mounted, getTodaysSuggestion, goals]);

  // All suggestions (multi-goal)
  const allSuggestions = useMemo(() => {
    if (!mounted) return [];
    return getAllSuggestions();
  }, [mounted, getAllSuggestions, goals]);

  // Last session
  const lastSession = useMemo(() => {
    if (!mounted || sessions.length === 0) return null;
    return [...sessions].reverse().find((s) => s.completedAt) ?? null;
  }, [mounted, sessions]);

  // Has any goals with pending steps?
  const hasGoals = useMemo(() => {
    if (!mounted) return false;
    return goals.length > 0;
  }, [mounted, goals]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-pulse" />
      </div>
    );
  }

  if (!hasSeenOnboarding) {
    return <Onboarding />;
  }

  // ========================================
  // State C: Active session (make / close / final)
  // ========================================
  if (phase !== "idle") {
    const showIndicator = phase !== "final";
    const indicatorPhase = PHASE_LABEL_MAP[phase];

    const renderPhase = (): React.ReactNode => {
      switch (phase as Phase) {
        case "make":
          return (
            <FadeTransition keyValue="make">
              <MakePhase />
            </FadeTransition>
          );
        case "close":
          return (
            <FadeTransition keyValue="close">
              <ClosePhase />
            </FadeTransition>
          );
        case "final":
          return (
            <FadeTransition keyValue="final">
              <FinalScreen />
            </FadeTransition>
          );
        default:
          // For legacy phases (open, lock, end), map to make
          return (
            <FadeTransition keyValue="make">
              <MakePhase />
            </FadeTransition>
          );
      }
    };

    return (
      <div className="w-full max-w-lg mx-auto py-8">
        {showIndicator && indicatorPhase && (
          <div className="mb-8">
            <PhaseIndicator currentPhase={indicatorPhase} />
          </div>
        )}
        {renderPhase()}
      </div>
    );
  }

  // ========================================
  // Handle goal submission (State A → State B)
  // ========================================
  const handleGoalSubmit = async () => {
    const trimmed = goalInput.trim();
    if (trimmed.length === 0 || loading) return;

    // Overload check - warn but don't block
    if (isOverloaded()) {
      setShowOverloadWarning(true);
      return;
    }

    setLoading(true);
    try {
      const result = await decomposeGoal(trimmed);
      addGoalWithSteps(trimmed, result.steps);

      if (result.steps.length > 0) {
        setAiRecommendation(result.steps[0]);
      }

      setGoalInput("");
    } catch {
      // Error handled by decomposeGoal fallback
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // Force submit goal (bypassing overload warning)
  // ========================================
  const handleGoalSubmitForce = async () => {
    setShowOverloadWarning(false);
    const trimmed = goalInput.trim();
    if (trimmed.length === 0 || loading) return;

    setLoading(true);
    try {
      const result = await decomposeGoal(trimmed);
      addGoalWithSteps(trimmed, result.steps);

      if (result.steps.length > 0) {
        setAiRecommendation(result.steps[0]);
      }

      setGoalInput("");
    } catch {
      // Error handled by decomposeGoal fallback
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // Handle "시작" button (State B → Session)
  // ========================================
  const handleStartSuggestion = (sg: { goalId: string; goalTitle: string; step: { action: string; minutes: number; resultType: string }; stepIndex: number }) => {
    const { step } = sg;
    const minutes = customMinutes[sg.goalId] ?? step.minutes;

    // Set result type if valid
    if (step.resultType) {
      setResultType(step.resultType as ResultType);
    }

    // Set AI recommendation
    setAiRecommendation({
      action: step.action,
      minutes,
      resultType: step.resultType,
    });

    // startOpen sets taskTitle + transitions to make
    startOpen(step.action);
    // startMake sets timer and starts
    startMake(minutes);
  };

  // ========================================
  // Shared: Goal input UI (reused in State A, B, D)
  // ========================================
  const goalInputUI = (
    <div className="w-full max-w-md flex gap-2">
      <input
        type="text"
        value={goalInput}
        onChange={(e) => setGoalInput(e.target.value)}
        placeholder="큰 목표를 말해주세요"
        className="flex-1 px-4 py-3 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl text-[#e8e8f0] placeholder:text-[#9898a8]/50 text-sm focus:border-[#a78bfa]/50 focus:outline-none transition-all duration-300"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleGoalSubmit();
        }}
        disabled={loading}
      />
      <button
        onClick={handleGoalSubmit}
        disabled={goalInput.trim().length === 0 || loading}
        className="shrink-0 rounded-xl px-4 py-3 font-medium transition-all duration-300 bg-[#a78bfa] text-white hover:bg-[#b89dfc] active:bg-[#9676e8] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? (
          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        )}
      </button>
    </div>
  );

  // ========================================
  // State A: No goals at all → goal input
  // ========================================
  if (!hasGoals) {
    return (
      <FadeTransition keyValue="state-a">
        <div className="flex flex-col items-center w-full mx-auto min-h-[80vh] justify-center px-4">
          {showOverloadWarning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            >
              <div className="w-full max-w-sm card-glass rounded-2xl p-8 flex flex-col items-center gap-6">
                <p className="text-lg text-[#e8e8f0] font-medium text-center leading-relaxed">
                  {OVERLOAD_CONFIG.warningMessage}
                </p>
                <p className="text-sm text-[#9898a8] text-center">
                  {OVERLOAD_CONFIG.actionMessage}
                </p>
                <div className="flex flex-col gap-3 w-full">
                  <Link
                    href="/vault"
                    className="w-full rounded-xl px-6 py-3.5 font-medium text-center transition-all duration-300 bg-[#a78bfa] text-white hover:bg-[#b89dfc]"
                  >
                    서랍함에서 정리하기
                  </Link>
                  <button
                    onClick={handleGoalSubmitForce}
                    className="w-full rounded-xl px-6 py-3 text-sm text-[#6a6a7a] hover:text-[#9898a8] transition-colors duration-300 cursor-pointer"
                  >
                    그래도 추가하기
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <span className="text-[10px] tracking-[0.3em] text-[#4a4a58] uppercase mb-6">{getTimeGreeting()}</span>

          <h1 className="text-6xl font-extralight tracking-[0.2em] text-[#e8e8f0] mb-16">
            닫다
          </h1>

          <div className="mb-6">{goalInputUI}</div>

          <p className="text-[11px] text-[#4a4a58]/50 animate-breathe-subtle text-center mt-4">
            매일 닫을 수 있는 크기로 쪼개드립니다
          </p>

          {sessions.length > 0 && (
            <div className="flex flex-col items-center mt-16">
              <span className="text-4xl font-extralight text-[#a78bfa]/20 tabular-nums">
                {sessions.length}
              </span>
              <span className="text-[10px] tracking-[0.3em] text-[#4a4a58] mt-2">
                번의 닫힘
              </span>
            </div>
          )}

          <div className="mt-auto pb-4 pt-8" />
        </div>
      </FadeTransition>
    );
  }

  // ========================================
  // State D: All goals completed → celebration
  // ========================================
  if (allSuggestions.length === 0 && !loading) {
    return (
      <FadeTransition keyValue="state-d">
        <div className="flex flex-col items-center w-full max-w-md mx-auto min-h-[80vh] justify-center px-4">
          <span className="text-[10px] tracking-[0.3em] text-[#4a4a58] uppercase mb-12">{getTimeGreeting()}</span>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-6 mb-12"
          >
            <div className="flex flex-col items-center">
              <span className="text-7xl font-extralight text-[#a78bfa]/20 tabular-nums">
                {sessions.length}
              </span>
              <span className="text-[10px] tracking-[0.3em] text-[#4a4a58] mt-3">
                번의 닫힘
              </span>
            </div>

            <p className="text-lg font-light text-[#9898a8] mt-6">
              모두 닫았습니다
            </p>

            <p className="text-xs text-[#4a4a58]/60 text-center leading-loose mt-6">
              매일 하나를 닫으면,<br />어느 날 당신은 이미 그 안에 있습니다.
            </p>
          </motion.div>

          {showGoalInput ? (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 mt-8"
            >
              {goalInputUI}
              <button
                onClick={() => { setShowGoalInput(false); setGoalInput(""); }}
                className="text-xs text-[#6a6a7a] hover:text-[#9898a8] transition-colors cursor-pointer"
              >
                취소
              </button>
            </motion.div>
          ) : (
            <button
              onClick={() => setShowGoalInput(true)}
              className="text-sm text-[#9898a8] hover:text-[#a78bfa] transition-colors duration-300 cursor-pointer mt-8"
            >
              새로운 목표 시작하기
            </button>
          )}

          <div className="mt-auto pb-4 pt-8" />
        </div>
      </FadeTransition>
    );
  }

  // ========================================
  // State B: Has suggestions → accordion cards
  // ========================================
  if (allSuggestions.length > 0) {
    return (
      <FadeTransition keyValue="state-b">
        <div className="flex flex-col items-center w-full max-w-md mx-auto min-h-[80vh] justify-center px-4">
          <span className="text-[10px] tracking-[0.3em] text-[#4a4a58] uppercase mb-10">{getTimeGreeting()}</span>

          <p className="text-xs tracking-[0.15em] text-[#6a6a7a] mb-6">오늘 닫을 것</p>

          {/* Accordion cards - all equal, tap to expand */}
          <div className="w-full flex flex-col gap-3">
            {allSuggestions.map((sg, i) => {
              const goal = goals.find((g) => g.id === sg.goalId);
              const completedCount = goal ? goal.steps.filter((s) => s.completed).length : 0;
              const totalCount = goal ? goal.steps.length : 0;
              const isExpanded = expandedGoalId === sg.goalId;

              return (
                <motion.div
                  key={sg.goalId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className={[
                    "w-full card-glass rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer",
                    isExpanded ? "border-l-2 border-l-[#a78bfa]/50" : "",
                  ].join(" ")}
                  onClick={() => {
                    setExpandedGoalId(isExpanded ? null : sg.goalId);
                  }}
                >
                  {/* Collapsed: minimal info */}
                  <div className="p-5 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={[
                        "font-light leading-relaxed transition-colors duration-300",
                        isExpanded ? "text-[15px] text-[#e8e8f0]" : "text-sm text-[#9898a8]",
                      ].join(" ")}>
                        {sg.goalTitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] tabular-nums text-[#4a4a58]">
                        {completedCount}/{totalCount}
                      </span>
                    </div>
                  </div>

                  {/* Expanded: full detail + start button */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="px-5 pb-6">
                        {/* Divider */}
                        <div className="h-px bg-white/[0.06] mb-5" />

                        {/* Step action */}
                        <p className="text-[15px] font-light text-[#e8e8f0] leading-relaxed mb-2">
                          {sg.step.action}
                        </p>

                        {/* Minutes selector + result type */}
                        <div className="flex items-center gap-1.5 mb-5 flex-wrap">
                          {getTimerPresets().map((preset) => {
                            const activeMinutes = customMinutes[sg.goalId] ?? sg.step.minutes;
                            const isActive = preset === activeMinutes;
                            return (
                              <button
                                key={preset}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCustomMinutes((prev) => ({ ...prev, [sg.goalId]: preset }));
                                }}
                                className={[
                                  "px-2.5 py-1 rounded-full text-xs transition-all duration-200 cursor-pointer",
                                  isActive
                                    ? "bg-[#a78bfa]/20 text-[#a78bfa]"
                                    : "bg-white/[0.04] text-[#6a6a7a] hover:text-[#9898a8]",
                                ].join(" ")}
                              >
                                {preset}분
                              </button>
                            );
                          })}
                        </div>

                        {/* Progress bar */}
                        <div className="flex items-center gap-2 mb-6">
                          <div className="flex-1 h-0.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#a78bfa]/40 transition-all duration-500"
                              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Start button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartSuggestion(sg);
                          }}
                          className="w-full py-3.5 text-sm tracking-[0.05em] bg-[#a78bfa] text-white rounded-xl hover:bg-[#b89dfc] transition-colors duration-300 cursor-pointer"
                        >
                          시작하기
                        </button>

                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* 새 목표 추가 */}
          <div className="w-full mt-6">
            {showGoalInput ? (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-2"
              >
                {goalInputUI}
                <button
                  onClick={() => { setShowGoalInput(false); setGoalInput(""); }}
                  className="text-xs text-[#6a6a7a] hover:text-[#9898a8] transition-colors cursor-pointer"
                >
                  취소
                </button>
              </motion.div>
            ) : (
              <button
                onClick={() => setShowGoalInput(true)}
                className="w-full py-3 text-xs tracking-[0.1em] text-[#4a4a58] hover:text-[#9898a8] transition-colors duration-300 cursor-pointer text-center"
              >
                + 새 목표
              </button>
            )}
          </div>

          {sessions.length > 0 && (
            <div className="flex flex-col items-center mt-12">
              <span className="text-2xl font-extralight text-[#a78bfa]/20 tabular-nums">
                {sessions.length}
              </span>
              <span className="text-[10px] tracking-[0.3em] text-[#4a4a58] mt-1">
                번의 닫힘
              </span>
            </div>
          )}

          <div className="mt-auto pb-4 pt-8" />
        </div>
      </FadeTransition>
    );
  }

  // Fallback (shouldn't reach here)
  return null;
}
