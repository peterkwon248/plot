"use client";

const PHASES = ["MAKE", "CLOSE", "FINAL"] as const;
type Phase = (typeof PHASES)[number];

const PHASE_LABELS: Record<Phase, string> = {
  MAKE: "실행",
  CLOSE: "마무리",
  FINAL: "완료",
};

const PHASE_DESCRIPTIONS: Record<Phase, string> = {
  MAKE: "집중해서 실행합니다",
  CLOSE: "오늘은 여기까지",
  FINAL: "닫힘을 기록합니다",
};

interface PhaseIndicatorProps {
  currentPhase: Phase;
}

export default function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const currentIndex = PHASES.indexOf(currentPhase);

  return (
    <div className="flex flex-col items-center gap-3 select-none px-4">
      {/* Step counter + label */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#a78bfa] font-medium tabular-nums">
          {currentIndex + 1}/{PHASES.length}
        </span>
        <span className="text-sm text-[#e4e4e7] font-medium">
          {PHASE_LABELS[currentPhase]}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs h-1 bg-[#27272a] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#a78bfa] to-[#c4b5fd] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentIndex + 1) / PHASES.length) * 100}%` }}
        />
      </div>

      {/* Description */}
      <p className="text-xs text-[#52525b]">
        {PHASE_DESCRIPTIONS[currentPhase]}
      </p>
    </div>
  );
}
