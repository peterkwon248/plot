"use client";

const PHASES = ["MAKE", "CLOSE", "FINAL"] as const;
type Phase = (typeof PHASES)[number];

const PHASE_LABELS: Record<Phase, string> = {
  MAKE: "하기",
  CLOSE: "닫기",
  FINAL: "끝",
};

interface PhaseIndicatorProps {
  currentPhase: Phase;
}

export default function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const currentIndex = PHASES.indexOf(currentPhase);

  return (
    <div className="flex flex-col items-center gap-2 select-none px-4">
      {/* Step counter + label */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#a78bfa] font-medium tabular-nums">
          {currentIndex + 1}/{PHASES.length}
        </span>
        <span className="text-xs text-[#e8e8f0] font-light tracking-widest">
          {PHASE_LABELS[currentPhase]}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs h-0.5 bg-[#2d2d38]/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#a78bfa] to-[#c4b5fd] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentIndex + 1) / PHASES.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
