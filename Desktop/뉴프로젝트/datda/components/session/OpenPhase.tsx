"use client";

import { useState, useEffect } from "react";
import { useDatdaStore } from "@/lib/store";
import type { ResultType } from "@/lib/constants";
import Button from "@/components/ui/Button";

export default function OpenPhase() {
  const { startOpen, setResultType, startMake } = useDatdaStore();
  const aiRecommendation = useDatdaStore((s) => s.aiRecommendation);
  const setAiRecommendation = useDatdaStore((s) => s.setAiRecommendation);
  const getTimerPresets = useDatdaStore((s) => s.getTimerPresets);
  const getResultTypes = useDatdaStore((s) => s.getResultTypes);

  const timerPresets = getTimerPresets();
  const resultTypes = getResultTypes();

  const [taskTitle, setTaskTitle] = useState("");
  const [selectedResult, setSelectedResult] = useState<string>("");
  const [selectedTimer, setSelectedTimer] = useState<number>(timerPresets[0] ?? 30);

  // Pre-fill from AI recommendation
  useEffect(() => {
    if (aiRecommendation) {
      if (aiRecommendation.action) setTaskTitle(aiRecommendation.action);
      if (aiRecommendation.resultType) {
        setSelectedResult(aiRecommendation.resultType);
      }
      if (aiRecommendation.minutes && timerPresets.includes(aiRecommendation.minutes)) {
        setSelectedTimer(aiRecommendation.minutes);
      }
    }
  }, [aiRecommendation, timerPresets]);

  const canSubmit = taskTitle.trim().length > 0;

  const handleOpen = () => {
    if (!canSubmit) return;
    if (selectedResult) {
      setResultType(selectedResult as ResultType);
    }
    startOpen(taskTitle.trim());
    startMake(selectedTimer);
    setAiRecommendation(null); // Clear recommendation after use
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto">
      {/* Title */}
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold text-[#e4e4e7]">
          지금 닫을 것 하나를 정하세요
        </h1>
        <p className="text-sm text-[#71717a]">
          시작이 아니라 '제한'입니다.
        </p>
      </div>

      {/* AI Recommendation indicator */}
      {aiRecommendation && (
        <p className="text-xs text-[#a78bfa]/70">
          AI 추천이 적용되었습니다. 자유롭게 수정하세요.
        </p>
      )}

      {/* Task Input */}
      <input
        type="text"
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
        placeholder="이번 세션에서 닫을 것..."
        className="w-full px-5 py-4 text-lg text-center bg-[#141416] border border-[#27272a] rounded-xl text-[#e4e4e7] placeholder:text-[#71717a]/50 focus:border-[#a78bfa] transition-colors duration-300"
        onKeyDown={(e) => {
          if (e.key === "Enter" && canSubmit) handleOpen();
        }}
      />

      {/* Result Type Selector */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {resultTypes.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedResult(type)}
            className={[
              "px-4 py-1.5 text-sm rounded-full transition-all duration-300 cursor-pointer",
              "bg-[#141416] border",
              selectedResult === type
                ? "border-[#a78bfa] text-[#a78bfa]"
                : "border-[#27272a] text-[#71717a] hover:border-[#3f3f46]",
            ].join(" ")}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Timer Selector */}
      <div className="flex flex-col items-center gap-3">
        <span className="text-xs text-[#71717a] tracking-wide">
          세션 시간
        </span>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {timerPresets.map((minutes) => (
            <button
              key={minutes}
              onClick={() => setSelectedTimer(minutes)}
              className={[
                "px-4 py-2 text-sm rounded-xl transition-all duration-300 cursor-pointer",
                selectedTimer === minutes
                  ? "bg-[#a78bfa] text-white"
                  : "bg-[#141416] border border-[#27272a] text-[#71717a] hover:border-[#3f3f46]",
              ].join(" ")}
            >
              {minutes}분
            </button>
          ))}
        </div>
      </div>

      {/* Open Button */}
      <Button
        variant="primary"
        disabled={!canSubmit}
        onClick={handleOpen}
        className="w-full text-base"
      >
        열기
      </Button>
    </div>
  );
}
