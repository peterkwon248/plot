"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useDatdaStore } from "@/lib/store";
import { decomposeGoal } from "@/lib/gemini";
import type { Phase, ResultType } from "@/lib/constants";
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

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const phase = useDatdaStore((s) => s.phase);
  const sessions = useDatdaStore((s) => s.sessions);
  const goals = useDatdaStore((s) => s.goals);
  const getTodaysSuggestion = useDatdaStore((s) => s.getTodaysSuggestion);
  const setAiRecommendation = useDatdaStore((s) => s.setAiRecommendation);
  const hasSeenOnboarding = useDatdaStore((s) => s.hasSeenOnboarding);
  const startOpen = useDatdaStore((s) => s.startOpen);
  const setResultType = useDatdaStore((s) => s.setResultType);
  const startMake = useDatdaStore((s) => s.startMake);
  const addGoalWithSteps = useDatdaStore((s) => s.addGoalWithSteps);

  // Goal input state (State A)
  const [goalInput, setGoalInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Suggestion
  const suggestion = useMemo(() => {
    if (!mounted) return null;
    return getTodaysSuggestion();
  }, [mounted, getTodaysSuggestion, goals]);

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
  const handleStart = () => {
    if (!suggestion) return;

    const { step } = suggestion;

    // Set result type if valid
    if (step.resultType) {
      setResultType(step.resultType as ResultType);
    }

    // Set AI recommendation
    setAiRecommendation({
      action: step.action,
      minutes: step.minutes,
      resultType: step.resultType,
    });

    // startOpen sets taskTitle + transitions to make
    startOpen(step.action);
    // startMake sets timer and starts
    startMake(step.minutes);
  };

  // ========================================
  // State A: No goals → goal input
  // ========================================
  if (!hasGoals || (!suggestion && !loading)) {
    return (
      <FadeTransition keyValue="state-a">
        <div className="flex flex-col items-center w-full max-w-md mx-auto min-h-[80vh] justify-center px-4">
          <h1 className="text-4xl font-light tracking-widest text-[#e4e4e7] mb-10">
            닫다
          </h1>

          <p className="text-sm text-[#71717a] mb-6">
            무엇을 이루고 싶으세요?
          </p>

          <div className="w-full max-w-sm flex gap-2 mb-4">
            <input
              type="text"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="큰 목표를 말해주세요"
              className="flex-1 px-4 py-3 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl text-[#e4e4e7] placeholder:text-[#71717a]/50 text-sm focus:border-[#a78bfa]/50 focus:outline-none transition-all duration-300"
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
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              )}
            </button>
          </div>

          <p className="text-xs text-[#52525b] text-center">
            매일 할 수 있는 단계로 쪼개드립니다.
          </p>

          {lastSession && (
            <p className="text-xs text-[#3f3f46] mt-12">
              지난 닫힘: {lastSession.taskTitle} ·{" "}
              {formatRelativeTime(lastSession.completedAt)}
            </p>
          )}

          <div className="mt-auto pb-4 pt-8" />
        </div>
      </FadeTransition>
    );
  }

  // ========================================
  // State B: Has suggestion → today's task card
  // ========================================
  if (suggestion) {
    const completedCount = (() => {
      const goal = goals.find((g) => g.id === suggestion.goalId);
      if (!goal) return 0;
      return goal.steps.filter((s) => s.completed).length;
    })();
    const totalCount = (() => {
      const goal = goals.find((g) => g.id === suggestion.goalId);
      if (!goal) return 0;
      return goal.steps.length;
    })();

    return (
      <FadeTransition keyValue="state-b">
        <div className="flex flex-col items-center w-full max-w-md mx-auto min-h-[80vh] justify-center px-4">
          <p className="text-sm text-[#71717a] tracking-widest mb-6">
            오늘 닫을 것
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-10 flex flex-col items-center gap-6"
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-lg text-[#e4e4e7] font-medium leading-relaxed">
                {suggestion.step.action}
              </p>
              <p className="text-sm text-[#71717a]">
                {suggestion.goalTitle}
              </p>
            </div>

            <p className="text-xs text-[#52525b]">
              {suggestion.step.minutes}분 · {suggestion.step.resultType}
            </p>

            <button
              onClick={handleStart}
              className="rounded-xl px-8 py-3 font-medium transition-all duration-300 bg-[#a78bfa] text-white hover:bg-[#b89dfc] active:bg-[#9676e8] cursor-pointer hover:shadow-[0_0_20px_rgba(167,139,250,0.15)]"
            >
              시작
            </button>
          </motion.div>

          <p className="text-xs text-[#3f3f46] mt-8">
            {suggestion.goalTitle} · {completedCount}/{totalCount}
          </p>

          {lastSession && (
            <p className="text-xs text-[#3f3f46] mt-2">
              지난 닫힘: {lastSession.taskTitle} ·{" "}
              {formatRelativeTime(lastSession.completedAt)}
            </p>
          )}

          <div className="mt-auto pb-4 pt-8" />
        </div>
      </FadeTransition>
    );
  }

  // Fallback (shouldn't reach here)
  return null;
}
