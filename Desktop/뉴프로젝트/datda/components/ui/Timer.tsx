"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface TimerProps {
  durationMinutes: number;
  startedAt: number;
  onComplete: () => void;
}

export default function Timer({ durationMinutes, startedAt, onComplete }: TimerProps) {
  const totalSeconds = durationMinutes * 60;

  const calcRemaining = useCallback(() => {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    return Math.max(totalSeconds - elapsed, 0);
  }, [totalSeconds, startedAt]);

  const [remaining, setRemaining] = useState<number>(calcRemaining);

  useEffect(() => {
    setRemaining(calcRemaining());
    const id = setInterval(() => {
      const next = calcRemaining();
      setRemaining(next);
      if (next <= 0) {
        clearInterval(id);
        onComplete();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [calcRemaining, onComplete]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const progress = totalSeconds > 0 ? 1 - remaining / totalSeconds : 1;

  // Visual states
  const isUrgent = remaining <= 60;
  const isWarning = remaining > 60 && remaining <= 5 * 60;

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  const strokeColor = isUrgent ? "#f87171" : "#a78bfa";
  const strokeOpacity = isUrgent ? 1 : isWarning ? 1 : 0.35;
  const textColor = isUrgent ? "text-[#f87171]" : isWarning ? "text-[#a78bfa]" : "text-[#9e96b4]";
  const useGlow = isWarning || isUrgent;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex items-center justify-center ${isUrgent ? "animate-timer-pulse" : ""}`}
    >
      <svg width="260" height="260" viewBox="0 0 260 260">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx="130"
          cy="130"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="2"
        />

        {/* Progress */}
        <circle
          cx="130"
          cy="130"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          opacity={strokeOpacity}
          transform="rotate(-90 130 130)"
          filter={useGlow ? "url(#glow)" : undefined}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease, opacity 0.5s ease" }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-5xl font-extralight tracking-widest tabular-nums transition-colors duration-500 ${textColor}`}>
          {display}
        </span>
        <span className="text-xs tracking-[0.3em] text-[#807898] mt-2">
          남음
        </span>
      </div>
    </motion.div>
  );
}
