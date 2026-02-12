"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useDatdaStore } from "@/lib/store";

export default function FinalScreen() {
  const { resetSession, sessions, goals } = useDatdaStore();

  const [showProjectContext, setShowProjectContext] = useState(false);
  const [showHomeButton, setShowHomeButton] = useState(false);

  // Find project context from the last completed session
  const projectContext = useMemo(() => {
    if (sessions.length === 0) return null;

    const lastSession = sessions[sessions.length - 1];
    const taskTitle = lastSession.taskTitle;

    // Search through goals to find matching step
    for (const goal of goals) {
      const matchingStepIndex = goal.steps.findIndex(
        (step) => step.action === taskTitle
      );

      if (matchingStepIndex !== -1) {
        // Count completed steps in this goal
        const completedCount = goal.steps.filter((s) => s.completed).length;
        return {
          goalTitle: goal.title,
          closeCount: completedCount,
        };
      }
    }

    return null;
  }, [sessions, goals]);

  useEffect(() => {
    const t1 = setTimeout(() => setShowProjectContext(true), 2000);
    const t2 = setTimeout(() => setShowHomeButton(true), 3500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full">
      {/* Main "닫힘." */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="text-2xl text-[#e4e4e7] font-medium text-center"
      >
        닫힘.
      </motion.p>

      {/* Project context (if exists) */}
      {showProjectContext && projectContext && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="mt-4 text-base text-[#71717a] text-center"
        >
          {projectContext.goalTitle} — {projectContext.closeCount}번째 닫힘
        </motion.p>
      )}

      {/* Home button */}
      {showHomeButton && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          onClick={resetSession}
          className="mt-12 text-sm text-[#71717a]/60 hover:text-[#a78bfa] transition-colors duration-500 cursor-pointer"
        >
          홈으로
        </motion.button>
      )}
    </div>
  );
}
