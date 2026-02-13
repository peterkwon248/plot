"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import Link from "next/link";
import { useDatdaStore } from "@/lib/store";
import type { GoalStep } from "@/lib/store";
import { decomposeGoal } from "@/lib/gemini";
import type { Phase, ResultType } from "@/lib/constants";
import { OVERLOAD_CONFIG } from "@/lib/constants";
import FadeTransition from "@/components/ui/FadeTransition";
import PhaseIndicator from "@/components/ui/PhaseIndicator";
import MakePhase from "@/components/session/MakePhase";
import ClosePhase from "@/components/session/ClosePhase";
import FinalScreen from "@/components/session/FinalScreen";
import Onboarding from "@/components/Onboarding";
import StepEditor from "@/components/vault/StepEditor";
import AiStepEditor from "@/components/vault/AiStepEditor";

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

// ─── Inline Reorder List for main page ───

import type { Goal } from "@/lib/store";

function InlineReorderList({ goal, onShuffle }: { goal: Goal; onShuffle: () => void }) {
  const reorderGoalSteps = useDatdaStore((s) => s.reorderGoalSteps);

  const [localSteps, setLocalSteps] = useState<GoalStep[]>(goal.steps);
  const isDragging = useRef(false);
  const idMap = useRef(new WeakMap<GoalStep, string>());

  const getStepId = useCallback((step: GoalStep) => {
    if (!idMap.current.has(step)) {
      idMap.current.set(step, Math.random().toString(36).slice(2));
    }
    return idMap.current.get(step)!;
  }, []);

  useEffect(() => {
    if (!isDragging.current) {
      setLocalSteps(goal.steps);
    }
  }, [goal.steps]);

  const nextIdx = localSteps.findIndex((s) => !s.completed && !s.discarded);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] tracking-[0.1em] text-[#8888a0]">세션 순서</p>
        <button
          onClick={onShuffle}
          className="flex items-center gap-1 px-2 py-1 text-[11px] text-[#9898a8] hover:text-[#a78bfa] bg-white/[0.04] hover:bg-white/[0.08] rounded-md transition-all duration-200"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          랜덤
        </button>
      </div>
      <Reorder.Group
        axis="y"
        values={localSteps}
        onReorder={setLocalSteps}
        className="flex flex-col gap-0.5"
      >
        {localSteps.map((step, i) => {
          const isNext = i === nextIdx;
          const isCompleted = step.completed;
          const isDiscarded = step.discarded;

          return (
            <Reorder.Item
              key={getStepId(step)}
              value={step}
              dragListener={!isCompleted && !isDiscarded}
              onDragStart={() => { isDragging.current = true; }}
              onDragEnd={() => {
                isDragging.current = false;
                reorderGoalSteps(goal.id, localSteps);
              }}
              className={[
                "flex items-center gap-2 py-1.5 px-2 rounded-lg list-none",
                isCompleted || isDiscarded
                  ? "opacity-40 cursor-default"
                  : "cursor-grab active:cursor-grabbing",
              ].join(" ")}
              whileDrag={isCompleted || isDiscarded ? undefined : {
                scale: 1.02,
                backgroundColor: "rgba(167, 139, 250, 0.08)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                zIndex: 50,
              }}
            >
              {/* Drag handle */}
              <div className={`${isCompleted || isDiscarded ? "text-[#2d2d38]" : "text-[#66667a]"} shrink-0`}>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="9" cy="7" r="1.5" />
                  <circle cx="15" cy="7" r="1.5" />
                  <circle cx="9" cy="12" r="1.5" />
                  <circle cx="15" cy="12" r="1.5" />
                  <circle cx="9" cy="17" r="1.5" />
                  <circle cx="15" cy="17" r="1.5" />
                </svg>
              </div>

              {/* Dot */}
              <div className="shrink-0">
                {isCompleted ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#a78bfa]" />
                ) : isDiscarded ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8888a0]" />
                ) : isNext ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-dot-breathe" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2d2d38]" />
                )}
              </div>

              {/* Text */}
              <span
                className={[
                  "text-xs leading-relaxed flex-1 truncate",
                  isCompleted ? "text-[#8888a0] line-through" :
                  isDiscarded ? "text-[#66667a] line-through" :
                  isNext ? "text-[#e8e8f0]" : "text-[#9898a8]",
                ].join(" ")}
              >
                {step.action}
              </span>

              {isNext && (
                <span className="px-1.5 py-0.5 text-[10px] tracking-wider text-[#a78bfa]/70 bg-[#a78bfa]/8 rounded-full shrink-0">
                  다음
                </span>
              )}
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
    </div>
  );
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
  const addTimerPreset = useDatdaStore((s) => s.addTimerPreset);
  const removeTimerPreset = useDatdaStore((s) => s.removeTimerPreset);
  const getResultTypes = useDatdaStore((s) => s.getResultTypes);
  const addResultType = useDatdaStore((s) => s.addResultType);
  const removeResultType = useDatdaStore((s) => s.removeResultType);
  const moveGoalStep = useDatdaStore((s) => s.moveGoalStep);
  const reorderGoalSteps = useDatdaStore((s) => s.reorderGoalSteps);
  const shuffleGoalSteps = useDatdaStore((s) => s.shuffleGoalSteps);
  // Subscribe to actual data to trigger re-renders
  useDatdaStore((s) => s.userTimerPresets);
  useDatdaStore((s) => s.userResultTypes);

  // Goal input state
  const [goalInput, setGoalInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOverloadWarning, setShowOverloadWarning] = useState(false);
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [customMinutes, setCustomMinutes] = useState<Record<string, number>>({});
  const [customResultType, setCustomResultType] = useState<Record<string, string>>({});
  const getTimerPresets = useDatdaStore((s) => s.getTimerPresets);
  // Subscribe to underlying state so component re-renders when presets change
  useDatdaStore((s) => s.userTimerPresets);
  useDatdaStore((s) => s.userResultTypes);
  const [showStepEditor, setShowStepEditor] = useState<string | null>(null);
  const [showAiEditor, setShowAiEditor] = useState<string | null>(null);
  const [showReorderSteps, setShowReorderSteps] = useState<string | null>(null);
  const [editingPresets, setEditingPresets] = useState(false);
  const [addingMinute, setAddingMinute] = useState(false);
  const [addingResult, setAddingResult] = useState(false);
  const [newMinuteInput, setNewMinuteInput] = useState("");
  const [newResultInput, setNewResultInput] = useState("");
  const [editingTimer, setEditingTimer] = useState<number | null>(null);
  const [editTimerValue, setEditTimerValue] = useState("");
  const [editingResultType, setEditingResultType] = useState<string | null>(null);
  const [editResultValue, setEditResultValue] = useState("");

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
    const resultType = customResultType[sg.goalId] ?? step.resultType;

    // Set result type if valid
    if (resultType) {
      setResultType(resultType as ResultType);
    }

    // Set AI recommendation
    setAiRecommendation({
      action: step.action,
      minutes,
      resultType,
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
                    className="w-full rounded-xl px-6 py-3 text-sm text-[#8888a0] hover:text-[#9898a8] transition-colors duration-300 cursor-pointer"
                  >
                    그래도 추가하기
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <span className="text-xs tracking-[0.3em] text-[#66667a] uppercase mb-6">{getTimeGreeting()}</span>

          <h1 className="text-6xl font-extralight tracking-[0.2em] text-[#e8e8f0] mb-16">
            닫다
          </h1>

          <div className="mb-6">{goalInputUI}</div>

          <p className="text-xs text-[#66667a]/50 animate-breathe-subtle text-center mt-4">
            매일 닫을 수 있는 크기로 쪼개드립니다
          </p>

          {sessions.length > 0 && (
            <div className="flex flex-col items-center mt-16">
              <span className="text-4xl font-extralight text-[#a78bfa]/20 tabular-nums">
                {sessions.length}
              </span>
              <span className="text-xs tracking-[0.3em] text-[#66667a] mt-2">
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
          <span className="text-xs tracking-[0.3em] text-[#66667a] uppercase mb-12">{getTimeGreeting()}</span>

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
              <span className="text-xs tracking-[0.3em] text-[#66667a] mt-3">
                번의 닫힘
              </span>
            </div>

            <p className="text-lg font-light text-[#9898a8] mt-6">
              모두 닫았습니다
            </p>

            <p className="text-xs text-[#66667a]/60 text-center leading-loose mt-6">
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
                className="text-xs text-[#8888a0] hover:text-[#9898a8] transition-colors cursor-pointer"
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
          <span className="text-xs tracking-[0.3em] text-[#66667a] uppercase mb-10">{getTimeGreeting()}</span>

          <p className="text-sm tracking-[0.15em] text-[#8888a0] mb-6">오늘 닫을 것</p>

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
                      <span className="text-xs tabular-nums text-[#66667a]">
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

                        {/* Step action (session name) */}
                        <p className="text-lg font-light text-[#e8e8f0] leading-relaxed mb-3">
                          {sg.step.action}
                        </p>

                        {/* Edit buttons - right under session name */}
                        <div className="flex items-center gap-2 mb-5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowStepEditor(sg.goalId);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#aea6c0] hover:text-[#e8e8f0] bg-white/[0.04] hover:bg-white/[0.08] rounded-lg transition-all duration-200"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                            직접 수정
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAiEditor(sg.goalId);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#a78bfa]/70 hover:text-[#a78bfa] bg-[#a78bfa]/[0.06] hover:bg-[#a78bfa]/[0.12] rounded-lg transition-all duration-200"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                            </svg>
                            AI 수정
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowReorderSteps(showReorderSteps === sg.goalId ? null : sg.goalId);
                            }}
                            className={[
                              "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all duration-200",
                              showReorderSteps === sg.goalId
                                ? "text-[#a78bfa] bg-[#a78bfa]/10"
                                : "text-[#9898a8] hover:text-[#e8e8f0] bg-white/[0.04] hover:bg-white/[0.08]",
                            ].join(" ")}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                            순서 변경
                          </button>
                          {/* Preset edit toggle */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPresets(!editingPresets);
                              setAddingMinute(false);
                              setAddingResult(false);
                              setNewMinuteInput("");
                              setNewResultInput("");
                            }}
                            className={[
                              "ml-auto p-1.5 transition-colors duration-200",
                              editingPresets ? "text-[#a78bfa]" : "text-[#66667a] hover:text-[#8888a0]",
                            ].join(" ")}
                            title={editingPresets ? "편집 완료" : "프리셋 편집"}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              {editingPresets ? (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                              )}
                            </svg>
                          </button>
                        </div>

                        {/* Inline reorder step list */}
                        <AnimatePresence>
                          {showReorderSteps === sg.goalId && goal && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="mb-5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                <InlineReorderList
                                  goal={goal}
                                  onShuffle={() => shuffleGoalSteps(sg.goalId)}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Time label */}
                        <p className="text-[13px] tracking-[0.1em] text-[#9e96b4] mb-2">시간</p>

                        {/* Minutes selector */}
                        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                          {getTimerPresets().map((preset) => {
                            const activeMinutes = customMinutes[sg.goalId] ?? sg.step.minutes;
                            const isActive = preset === activeMinutes;
                            const canRemove = getTimerPresets().length > 1;

                            if (editingTimer === preset) {
                              return (
                                <div key={preset} className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="number"
                                    value={editTimerValue}
                                    onChange={(e) => setEditTimerValue(e.target.value)}
                                    className="w-14 px-2 py-1 rounded-full text-xs bg-white/[0.08] border border-[#a78bfa]/30 text-[#e8e8f0] text-center focus:outline-none"
                                    min={1}
                                    max={180}
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        const val = parseInt(editTimerValue, 10);
                                        if (!isNaN(val) && val > 0 && val <= 180) {
                                          removeTimerPreset(preset);
                                          addTimerPreset(val);
                                          if (isActive) setCustomMinutes((prev) => ({ ...prev, [sg.goalId]: val }));
                                        }
                                        setEditingTimer(null);
                                      }
                                      if (e.key === "Escape") setEditingTimer(null);
                                    }}
                                    onBlur={() => setEditingTimer(null)}
                                  />
                                  <span className="text-xs text-[#9898a8]">분</span>
                                </div>
                              );
                            }

                            return (
                              <div key={preset} className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCustomMinutes((prev) => ({ ...prev, [sg.goalId]: preset }));
                                  }}
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTimer(preset);
                                    setEditTimerValue(String(preset));
                                  }}
                                  className={[
                                    "px-3.5 py-1.5 rounded-full text-[15px] transition-all duration-200 cursor-pointer",
                                    isActive
                                      ? "bg-[#a78bfa]/20 text-[#a78bfa]"
                                      : "bg-white/[0.04] text-[#9e96b4] hover:text-[#aea6c0]",
                                  ].join(" ")}
                                >
                                  {preset}분
                                </button>
                                {editingPresets && canRemove && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeTimerPreset(preset);
                                    }}
                                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#8888a0] hover:bg-[#a78bfa] text-white flex items-center justify-center transition-colors duration-200"
                                    title="삭제"
                                  >
                                    <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          {editingPresets && !addingMinute && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAddingMinute(true);
                                setNewMinuteInput("");
                              }}
                              className="px-2.5 py-1 rounded-full text-xs border border-dashed border-white/[0.12] text-[#8888a0] hover:text-[#a78bfa] hover:border-[#a78bfa]/30 transition-all duration-200 cursor-pointer"
                            >
                              +
                            </button>
                          )}
                          {addingMinute && (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                value={newMinuteInput}
                                onChange={(e) => setNewMinuteInput(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-14 px-2 py-1 rounded-lg text-xs bg-white/[0.04] border border-white/[0.08] text-[#e8e8f0] focus:border-[#a78bfa]/50 focus:outline-none"
                                placeholder="분"
                                min="1"
                                max="180"
                                autoFocus
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const num = parseInt(newMinuteInput);
                                  if (!isNaN(num) && num > 0 && num <= 180) {
                                    addTimerPreset(num);
                                  }
                                  setNewMinuteInput("");
                                  setAddingMinute(false);
                                }}
                                className="p-1 rounded-lg bg-[#a78bfa] hover:bg-[#b89dfc] text-white transition-colors duration-200"
                                title="추가"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNewMinuteInput("");
                                  setAddingMinute(false);
                                }}
                                className="p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8888a0] transition-colors duration-200"
                                title="취소"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Result type label */}
                        <p className="text-[13px] tracking-[0.1em] text-[#9e96b4] mb-2">완료 유형</p>

                        {/* Result type selector */}
                        <div className="flex items-center gap-1.5 mb-5 flex-wrap">
                          {getResultTypes().map((type) => {
                            const activeType = customResultType[sg.goalId] ?? sg.step.resultType;
                            const isActive = type === activeType;
                            const canRemove = getResultTypes().length > 1;

                            if (editingResultType === type) {
                              return (
                                <div key={type} className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="text"
                                    value={editResultValue}
                                    onChange={(e) => setEditResultValue(e.target.value)}
                                    className="w-20 px-2 py-1 rounded-full text-xs bg-white/[0.08] border border-[#a78bfa]/30 text-[#e8e8f0] text-center focus:outline-none"
                                    maxLength={20}
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        const trimmed = editResultValue.trim();
                                        if (trimmed.length > 0 && trimmed !== type) {
                                          removeResultType(type);
                                          addResultType(trimmed);
                                          if (isActive) setCustomResultType((prev) => ({ ...prev, [sg.goalId]: trimmed }));
                                        }
                                        setEditingResultType(null);
                                      }
                                      if (e.key === "Escape") setEditingResultType(null);
                                    }}
                                    onBlur={() => setEditingResultType(null)}
                                  />
                                </div>
                              );
                            }

                            return (
                              <div key={type} className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCustomResultType((prev) => ({ ...prev, [sg.goalId]: type }));
                                  }}
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    setEditingResultType(type);
                                    setEditResultValue(type);
                                  }}
                                  className={[
                                    "px-3.5 py-1.5 rounded-full text-[15px] transition-all duration-200 cursor-pointer",
                                    isActive
                                      ? "bg-[#a78bfa]/20 text-[#a78bfa]"
                                      : "bg-white/[0.04] text-[#9e96b4] hover:text-[#aea6c0]",
                                  ].join(" ")}
                                >
                                  {type}
                                </button>
                                {editingPresets && canRemove && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeResultType(type);
                                    }}
                                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#8888a0] hover:bg-[#a78bfa] text-white flex items-center justify-center transition-colors duration-200"
                                    title="삭제"
                                  >
                                    <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          {editingPresets && !addingResult && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAddingResult(true);
                                setNewResultInput("");
                              }}
                              className="px-2.5 py-1 rounded-full text-xs border border-dashed border-white/[0.12] text-[#8888a0] hover:text-[#a78bfa] hover:border-[#a78bfa]/30 transition-all duration-200 cursor-pointer"
                            >
                              +
                            </button>
                          )}
                          {addingResult && (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={newResultInput}
                                onChange={(e) => setNewResultInput(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-20 px-2 py-1 rounded-lg text-xs bg-white/[0.04] border border-white/[0.08] text-[#e8e8f0] focus:border-[#a78bfa]/50 focus:outline-none"
                                placeholder="결과물"
                                maxLength={20}
                                autoFocus
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const trimmed = newResultInput.trim();
                                  if (trimmed.length > 0) {
                                    addResultType(trimmed);
                                  }
                                  setNewResultInput("");
                                  setAddingResult(false);
                                }}
                                className="p-1 rounded-lg bg-[#a78bfa] hover:bg-[#b89dfc] text-white transition-colors duration-200"
                                title="추가"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNewResultInput("");
                                  setAddingResult(false);
                                }}
                                className="p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8888a0] transition-colors duration-200"
                                title="취소"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}
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
                  className="text-xs text-[#8888a0] hover:text-[#9898a8] transition-colors cursor-pointer"
                >
                  취소
                </button>
              </motion.div>
            ) : (
              <button
                onClick={() => setShowGoalInput(true)}
                className="w-full py-3 text-xs tracking-[0.1em] text-[#66667a] hover:text-[#9898a8] transition-colors duration-300 cursor-pointer text-center"
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
              <span className="text-xs tracking-[0.3em] text-[#66667a] mt-1">
                번의 닫힘
              </span>
            </div>
          )}

          <div className="mt-auto pb-4 pt-8" />
        </div>

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
      </FadeTransition>
    );
  }

  // Fallback (shouldn't reach here)
  return null;
}
