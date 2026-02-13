"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useDatdaStore, type GoalStep } from "@/lib/store";
import { canModifyWithAi, recordAiModification, getNextModifyTime } from "@/lib/rate-limit";
import { modifySteps } from "@/lib/gemini";

interface AiStepEditorProps {
  goalId: string;
  goalTitle: string;
  steps: GoalStep[];
  onClose: () => void;
  onStepsReplaced: () => void;
}

function formatKoreanTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours < 12 ? "오전" : "오후";
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMin = minutes.toString().padStart(2, "0");
  return `${period} ${displayHour}:${displayMin}`;
}

export default function AiStepEditor({
  goalId,
  goalTitle,
  steps,
  onClose,
  onStepsReplaced,
}: AiStepEditorProps) {
  const replaceGoalSteps = useDatdaStore((s) => s.replaceGoalSteps);

  const [userMessage, setUserMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [newSteps, setNewSteps] = useState<{ action: string; minutes: number; resultType: string }[] | null>(null);
  const [error, setError] = useState("");

  const canUseAi = canModifyWithAi();
  const nextTime = getNextModifyTime();

  const handleSend = async () => {
    if (!userMessage.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await modifySteps(
        goalTitle,
        steps.map((s) => ({ action: s.action, minutes: s.minutes, resultType: s.resultType })),
        userMessage
      );

      if (result.steps && result.steps.length > 0) {
        setNewSteps(result.steps);
      } else {
        setError("AI 응답을 받지 못했습니다. 다시 시도해주세요.");
      }
    } catch (err) {
      console.error("[AiStepEditor] Error:", err);
      setError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!newSteps || newSteps.length === 0) return;

    replaceGoalSteps(goalId, newSteps);
    recordAiModification();
    onStepsReplaced();
    onClose();
  };

  const handleCancel = () => {
    setNewSteps(null);
    setUserMessage("");
    setError("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-md bg-[#252530] border border-white/[0.08] rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-white/[0.08]">
          <h2 className="text-lg font-light text-[#e8e8f0]">AI 스텝 수정</h2>
          <p className="text-sm text-[#8888a0] mt-1">
            AI가 목표를 다시 분해해드립니다 (1일 1회)
          </p>
        </div>

        {/* Rate Limit Check */}
        {!canUseAi ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#a78bfa]/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-[#a78bfa]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-[#e8e8f0] mb-2">오늘은 이미 AI 수정을 사용했습니다</p>
            {nextTime && (
              <p className="text-xs text-[#8888a0]">
                다음 사용 가능 시간: {formatKoreanTime(nextTime)}
              </p>
            )}
            <button
              onClick={onClose}
              className="mt-6 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-[#9898a8] hover:text-[#e8e8f0] rounded-xl text-sm transition-all duration-200"
            >
              닫기
            </button>
          </div>
        ) : (
          <>
            {/* Current Steps Summary */}
            <div className="mb-4 p-3 bg-white/[0.03] border border-white/[0.08] rounded-lg">
              <p className="text-xs text-[#9898a8] mb-2">현재 스텝 ({steps.length}개)</p>
              <div className="flex flex-col gap-1.5">
                {steps.slice(0, 3).map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs text-[#8888a0] mt-0.5">{i + 1}.</span>
                    <span className="text-xs text-[#e8e8f0] line-clamp-1">{step.action}</span>
                  </div>
                ))}
                {steps.length > 3 && (
                  <span className="text-xs text-[#8888a0]">외 {steps.length - 3}개...</span>
                )}
              </div>
            </div>

            {/* No Preview Yet - Show Input */}
            {!newSteps && (
              <>
                <div className="mb-4">
                  <label className="text-xs text-[#9898a8] block mb-2">
                    어떻게 수정할까요?
                  </label>
                  <textarea
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="예: 스텝을 더 구체적으로 나눠줘, 시간을 줄여줘, 불필요한 스텝 제거해줘"
                    className="w-full px-3 py-2.5 bg-[#1a1a1f] border border-white/[0.08] rounded-lg text-sm text-[#e8e8f0] placeholder:text-[#8888a0] resize-none focus:border-[#a78bfa]/30 focus:outline-none transition-colors"
                    rows={4}
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs text-red-400">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-[#9898a8] hover:text-[#e8e8f0] rounded-xl text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={isLoading || !userMessage.trim()}
                    className="flex-1 px-4 py-2.5 bg-[#a78bfa] hover:bg-[#b89dfc] text-white rounded-xl text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>생성 중...</span>
                      </>
                    ) : (
                      "보내기"
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Preview After AI Response */}
            {newSteps && (
              <>
                <div className="mb-4">
                  <p className="text-xs text-[#9898a8] mb-3">수정된 스텝 미리보기</p>
                  <div className="flex flex-col gap-2.5 max-h-[40vh] overflow-y-auto">
                    {newSteps.map((step, i) => (
                      <div
                        key={i}
                        className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-lg"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div className="w-5 h-5 rounded-full bg-[#a78bfa]/10 border border-[#a78bfa]/20 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs text-[#a78bfa]">{i + 1}</span>
                          </div>
                          <p className="text-sm text-[#e8e8f0] leading-relaxed">{step.action}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-7">
                          <span className="text-xs text-[#8888a0]">{step.minutes}분</span>
                          <span className="text-xs text-[#8888a0]">·</span>
                          <span className="text-xs text-[#9898a8]">{step.resultType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/[0.08]">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-[#9898a8] hover:text-[#e8e8f0] rounded-xl text-sm transition-all duration-200"
                  >
                    다시 입력
                  </button>
                  <button
                    onClick={handleApply}
                    className="flex-1 px-4 py-2.5 bg-[#a78bfa] hover:bg-[#b89dfc] text-white rounded-xl text-sm transition-all duration-200"
                  >
                    적용하기
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
