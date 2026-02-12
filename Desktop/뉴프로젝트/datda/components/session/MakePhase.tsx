"use client";

import { useDatdaStore } from "@/lib/store";
import Timer from "@/components/ui/Timer";
import Button from "@/components/ui/Button";

export default function MakePhase() {
  const { taskTitle, resultType, timerMinutes, timerStartedAt, goToClose } =
    useDatdaStore();

  return (
    <div className="flex flex-col items-center gap-10 w-full max-w-md mx-auto min-h-[60vh] justify-center">
      {/* Task Info */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-lg text-[#71717a]">{taskTitle}</p>
        {resultType && (
          <span className="px-3 py-1 text-xs rounded-full bg-[#141416] border border-[#27272a] text-[#a78bfa]">
            {resultType}
          </span>
        )}
      </div>

      {/* Timer */}
      {timerStartedAt && (
        <Timer
          durationMinutes={timerMinutes}
          startedAt={timerStartedAt}
          onComplete={goToClose}
        />
      )}

      {/* Complete Button */}
      <Button variant="primary" onClick={goToClose} className="px-8">
        형태가 생겼어요
      </Button>

      {/* Subtle Guidance */}
      <p className="text-sm text-[#71717a]/60 text-center max-w-xs">
        앱 밖에서 작업하세요. 형태가 생기면 돌아오세요.
      </p>
    </div>
  );
}
