"use client";

import { useEffect, useState, useCallback } from "react";

interface TimerProps {
  durationMinutes: number;
  startedAt: number;
  onComplete: () => void;
}

export default function Timer({
  durationMinutes,
  startedAt,
  onComplete,
}: TimerProps) {
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

  // Color tiers
  let colorClass: string;
  let pulse = false;

  if (remaining > 5 * 60) {
    // > 5 min: muted
    colorClass = "text-zinc-500";
  } else if (remaining > 60) {
    // 1-5 min: primary accent
    colorClass = "text-[#a78bfa]";
  } else {
    // < 1 min: danger + pulse
    colorClass = "text-red-400";
    pulse = true;
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <span
        className={[
          "text-5xl font-light tracking-wider tabular-nums transition-colors duration-500",
          colorClass,
          pulse ? "animate-pulse" : "",
        ].join(" ")}
      >
        {display}
      </span>

      {/* Progress bar */}
      <div className="w-64 h-[2px] rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full bg-[#a78bfa] rounded-full transition-[width] duration-1000 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
