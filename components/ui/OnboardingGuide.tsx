"use client";

import { useState, useEffect } from "react";

const STEPS = [
  {
    title: "메모 작성",
    description: "⌘K를 눌러 커맨드 바를 열고\n새 메모를 빠르게 만들어보세요.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="8" y="6" width="24" height="28" rx="3" stroke="#22D3EE" strokeWidth="1.5" />
        <line x1="13" y1="14" x2="27" y2="14" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="13" y1="20" x2="24" y2="20" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <line x1="13" y1="26" x2="20" y2="26" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      </svg>
    ),
  },
  {
    title: "상태 변경",
    description: "S키로 상태를 순환하거나\n숫자 1~4로 직접 변경할 수 있어요.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="12" stroke="#22D3EE" strokeWidth="1.5" />
        <path d="M15 20l3 3 7-7" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "노드 연결",
    description: "체인 기능으로 메모끼리 연결하세요.\n상세 페이지에서 '+ 연결'을 클릭합니다.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="14" cy="14" r="5" stroke="#22D3EE" strokeWidth="1.5" />
        <circle cx="26" cy="26" r="5" stroke="#22D3EE" strokeWidth="1.5" />
        <line x1="18" y1="18" x2="22" y2="22" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
      </svg>
    ),
  },
];

export function OnboardingGuide() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem("plot-onboarding-done");
    if (!done) {
      // Small delay for initial render
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("plot-onboarding-done", "true");
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(10, 13, 15, 0.75)", backdropFilter: "blur(16px)" }}
      />

      {/* Card */}
      <div
        className="relative w-[360px] bg-bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: "commandBarIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pt-6 pb-2">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                idx === step ? "bg-accent" : idx < step ? "bg-accent/40" : "bg-text-tertiary/30"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-col items-center px-8 py-6 text-center">
          <div className="mb-5">{current.icon}</div>
          <h3 className="text-[16px] leading-[24px] font-semibold text-text-primary mb-2">
            {current.title}
          </h3>
          <p className="text-[13px] leading-[20px] text-text-secondary whitespace-pre-line">
            {current.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 pb-6">
          <button
            onClick={handleDismiss}
            className="text-[13px] leading-[20px] text-text-tertiary hover:text-text-secondary transition-colors"
          >
            건너뛰기
          </button>
          <button
            onClick={handleNext}
            className="text-[13px] leading-[20px] px-4 py-1.5 bg-accent text-bg-primary font-medium rounded-lg hover:bg-accent-hover transition-colors"
          >
            {step < STEPS.length - 1 ? "다음" : "시작하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
