"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useDatdaStore } from "@/lib/store";
import { CLOSE_TYPE_CONFIG } from "@/lib/constants";
import type { CloseType } from "@/lib/constants";

export default function FinalScreen() {
  const { resetSession, sessions, goals } = useDatdaStore();

  const [phase, setPhase] = useState(0); // 0: nothing, 1: dot, 2: main text, 3: context, 4: count, 5: button

  const projectContext = useMemo(() => {
    if (sessions.length === 0) return null;
    const lastSession = sessions[sessions.length - 1];
    const taskTitle = lastSession.taskTitle;
    const closeType = (lastSession.closeType || '완료') as CloseType;

    for (const goal of goals) {
      const matchingStepIndex = goal.steps.findIndex(
        (step) => step.action === taskTitle
      );
      if (matchingStepIndex !== -1) {
        const completedCount = goal.steps.filter((s) => s.completed).length;
        return { goalTitle: goal.title, closeCount: completedCount, closeType };
      }
    }
    return { goalTitle: '', closeCount: 0, closeType };
  }, [sessions, goals]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 3000),
      setTimeout(() => setPhase(4), 4500),
      setTimeout(() => setPhase(5), 6000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1a1a1f]">
      {/* Ambient background glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 2 ? 1 : 0 }}
        transition={{ duration: 3 }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 45%, rgba(167, 139, 250, 0.06) 0%, transparent 60%)",
        }}
      />

      {/* Phase 1: Dot appears */}
      {phase >= 1 && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] mb-8 animate-breathe-subtle"
        />
      )}

      {/* Phase 2: Main message */}
      {phase >= 2 && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl font-extralight tracking-[0.1em] text-[#e8e8f0] text-center"
        >
          {projectContext ? CLOSE_TYPE_CONFIG[projectContext.closeType].finalMessage : '닫힘.'}
        </motion.p>
      )}

      {/* Phase 3: Context */}
      {phase >= 3 && projectContext && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="mt-6 text-sm text-[#9e96b4] text-center tracking-wide"
        >
          {projectContext.closeType === '완료' && projectContext.goalTitle
            ? `${projectContext.goalTitle} — ${projectContext.closeCount}번째`
            : CLOSE_TYPE_CONFIG[projectContext.closeType].finalSub}
        </motion.p>
      )}

      {/* Phase 4: Total count - the accumulation number */}
      {phase >= 4 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="mt-12 flex flex-col items-center"
        >
          <span className="text-6xl font-extralight tabular-nums text-[#a78bfa]/30">
            {sessions.length}
          </span>
          <span className="text-xs tracking-[0.3em] text-[#807898] mt-2">
            번째 닫힘
          </span>
        </motion.div>
      )}

      {/* Phase 5: Return button */}
      {phase >= 5 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          onClick={resetSession}
          className="mt-16 text-xs tracking-[0.2em] text-[#807898] hover:text-[#aea6c0] transition-colors duration-700 cursor-pointer"
        >
          돌아가기
        </motion.button>
      )}
    </div>
  );
}
