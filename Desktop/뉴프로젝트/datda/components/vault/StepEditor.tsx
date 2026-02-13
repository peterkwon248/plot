"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDatdaStore, type GoalStep } from "@/lib/store";

interface StepEditorProps {
  steps: GoalStep[];
  goalId: string;
  onClose: () => void;
}

const TIME_OPTIONS = [15, 25, 30, 45, 60];
const RESULT_TYPE_OPTIONS = ["업로드", "실행", "결정", "완성"];

export default function StepEditor({ steps, goalId, onClose }: StepEditorProps) {
  const updateGoalStep = useDatdaStore((s) => s.updateGoalStep);
  const moveGoalStep = useDatdaStore((s) => s.moveGoalStep);
  const shuffleGoalSteps = useDatdaStore((s) => s.shuffleGoalSteps);
  const goals = useDatdaStore((s) => s.goals);

  // Local state for editing
  const [editingSteps, setEditingSteps] = useState(
    steps.map((step, i) => ({ index: i, ...step }))
  );

  // Sync local state when goals change (after move/shuffle)
  useEffect(() => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      setEditingSteps(goal.steps.map((step, i) => ({ index: i, ...step })));
    }
  }, [goals, goalId]);

  const handleActionChange = (index: number, newAction: string) => {
    setEditingSteps((prev) =>
      prev.map((step) => (step.index === index ? { ...step, action: newAction } : step))
    );
  };

  const handleMinutesChange = (index: number, newMinutes: number) => {
    setEditingSteps((prev) =>
      prev.map((step) => (step.index === index ? { ...step, minutes: newMinutes } : step))
    );
  };

  const handleResultTypeChange = (index: number, newType: string) => {
    setEditingSteps((prev) =>
      prev.map((step) => (step.index === index ? { ...step, resultType: newType } : step))
    );
  };

  const handleMove = (fromIdx: number, toIdx: number) => {
    moveGoalStep(goalId, fromIdx, toIdx);
  };

  const handleShuffle = () => {
    shuffleGoalSteps(goalId);
  };

  const handleSave = () => {
    // Save all changes to store
    editingSteps.forEach((step) => {
      updateGoalStep(goalId, step.index, {
        action: step.action,
        minutes: step.minutes,
        resultType: step.resultType,
      });
    });
    onClose();
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
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-light text-[#e8e8f0]">스텝 편집</h2>
            <button
              onClick={handleShuffle}
              className="text-xs text-[#a78bfa]/70 hover:text-[#a78bfa] bg-[#a78bfa]/[0.06] hover:bg-[#a78bfa]/[0.12] rounded-lg px-3 py-1.5 transition-all duration-200 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              섞기
            </button>
          </div>
          <p className="text-sm text-[#9e96b4] mt-1">각 스텝의 내용과 설정을 수정할 수 있습니다</p>
        </div>

        {/* Step List */}
        <div className="flex flex-col gap-5 mb-6">
          {editingSteps.map((step, i) => (
            <div
              key={step.index}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-xl p-4"
            >
              {/* Step Number */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-[#a78bfa]/10 border border-[#a78bfa]/20 flex items-center justify-center">
                  <span className="text-xs text-[#a78bfa]">{i + 1}</span>
                </div>
                <span className="text-xs text-[#aea6c0]">
                  {step.completed ? "완료됨" : step.discarded ? "폐기됨" : "대기 중"}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() => handleMove(i, i - 1)}
                    disabled={i === 0}
                    className={[
                      "w-6 h-6 rounded-lg transition-all duration-200 flex items-center justify-center",
                      i === 0
                        ? "opacity-20 cursor-not-allowed bg-white/[0.04]"
                        : "bg-white/[0.04] hover:bg-white/[0.08] text-[#9e96b4] hover:text-[#aea6c0]"
                    ].join(" ")}
                    title="위로 이동"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMove(i, i + 1)}
                    disabled={i === editingSteps.length - 1}
                    className={[
                      "w-6 h-6 rounded-lg transition-all duration-200 flex items-center justify-center",
                      i === editingSteps.length - 1
                        ? "opacity-20 cursor-not-allowed bg-white/[0.04]"
                        : "bg-white/[0.04] hover:bg-white/[0.08] text-[#9e96b4] hover:text-[#aea6c0]"
                    ].join(" ")}
                    title="아래로 이동"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Action Text */}
              <textarea
                value={step.action}
                onChange={(e) => handleActionChange(step.index, e.target.value)}
                className="w-full mb-3 px-3 py-2 bg-[#1a1a1f] border border-white/[0.08] rounded-lg text-sm text-[#e8e8f0] placeholder:text-[#9e96b4] resize-none focus:border-[#a78bfa]/30 focus:outline-none transition-colors"
                rows={2}
                placeholder="행동을 입력하세요..."
                disabled={step.completed || step.discarded}
              />

              {/* Time Selection */}
              <div className="mb-3">
                <label className="text-xs text-[#aea6c0] block mb-2">소요 시간</label>
                <div className="flex gap-2 flex-wrap">
                  {TIME_OPTIONS.map((time) => (
                    <button
                      key={time}
                      onClick={() => handleMinutesChange(step.index, time)}
                      disabled={step.completed || step.discarded}
                      className={[
                        "px-3 py-1.5 text-xs rounded-lg transition-all duration-200",
                        step.minutes === time
                          ? "bg-[#a78bfa] text-white"
                          : "bg-white/[0.04] text-[#aea6c0] hover:bg-white/[0.08] hover:text-[#e8e8f0]",
                        step.completed || step.discarded ? "opacity-40 cursor-not-allowed" : "",
                      ].join(" ")}
                    >
                      {time}분
                    </button>
                  ))}
                </div>
              </div>

              {/* Result Type Selection */}
              <div>
                <label className="text-xs text-[#aea6c0] block mb-2">결과 유형</label>
                <div className="flex gap-2 flex-wrap">
                  {RESULT_TYPE_OPTIONS.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleResultTypeChange(step.index, type)}
                      disabled={step.completed || step.discarded}
                      className={[
                        "px-3 py-1.5 text-xs rounded-lg transition-all duration-200",
                        step.resultType === type
                          ? "bg-[#a78bfa] text-white"
                          : "bg-white/[0.04] text-[#aea6c0] hover:bg-white/[0.08] hover:text-[#e8e8f0]",
                        step.completed || step.discarded ? "opacity-40 cursor-not-allowed" : "",
                      ].join(" ")}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-white/[0.08]">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-[#aea6c0] hover:text-[#e8e8f0] rounded-xl text-sm transition-all duration-200"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 bg-[#a78bfa] hover:bg-[#b89dfc] text-white rounded-xl text-sm transition-all duration-200"
          >
            완료
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
