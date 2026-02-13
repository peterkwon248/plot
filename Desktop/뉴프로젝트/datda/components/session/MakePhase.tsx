"use client";

import { useDatdaStore } from "@/lib/store";
import Timer from "@/components/ui/Timer";
import { motion } from "framer-motion";

export default function MakePhase() {
  const { taskTitle, resultType, timerMinutes, timerStartedAt, goToClose } =
    useDatdaStore();

  return (
    <div className="flex flex-col items-center w-full min-h-[80vh] justify-center -mt-8">
      {/* Task title - very subtle, floating above */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="text-xs tracking-[0.15em] text-[#706884] mb-12 text-center max-w-[260px] leading-relaxed"
      >
        {taskTitle}
      </motion.p>

      {/* Timer - THE hero. Takes up the center. */}
      {timerStartedAt && (
        <Timer
          durationMinutes={timerMinutes}
          startedAt={timerStartedAt}
          onComplete={goToClose}
        />
      )}

      {/* Bottom area - minimal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="mt-16 flex flex-col items-center gap-6"
      >
        <button
          onClick={goToClose}
          className="text-sm text-[#706884] hover:text-[#a78bfa] transition-colors duration-700 cursor-pointer"
        >
          닫으러 가기
        </button>
      </motion.div>
    </div>
  );
}
