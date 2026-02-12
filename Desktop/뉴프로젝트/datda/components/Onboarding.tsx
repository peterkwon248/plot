"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDatdaStore } from "@/lib/store";

const SLIDES = [
  {
    title: "닫다",
    body: "할 일 앱이 아닙니다.\n종료 장치입니다.",
  },
  {
    title: "매일 하나",
    body: "큰 목표를 잘게 쪼개고,\n하루에 하나씩 닫습니다.",
  },
  {
    title: "느리지만 분명하게",
    body: "급하지 않아도 괜찮습니다.\n닫힌 것들이 쌓이면,\n그것이 곧 당신의 기록입니다.",
  },
];

export default function Onboarding() {
  const [current, setCurrent] = useState(0);
  const completeOnboarding = useDatdaStore((s) => s.completeOnboarding);

  const isLast = current === SLIDES.length - 1;
  const slide = SLIDES[current];

  const handleNext = () => {
    if (isLast) {
      completeOnboarding();
    } else {
      setCurrent((prev) => prev + 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0b] px-8"
      onClick={handleNext}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="flex flex-col items-center text-center max-w-sm"
        >
          <h1 className="text-3xl font-light tracking-widest text-[#e4e4e7] mb-8">
            {slide.title}
          </h1>
          <p className="text-sm text-[#71717a] leading-relaxed whitespace-pre-line">
            {slide.body}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Bottom area */}
      <div className="absolute bottom-16 flex flex-col items-center gap-6">
        {/* Dots */}
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={[
                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                i === current ? "bg-[#a78bfa]" : "bg-[#27272a]",
              ].join(" ")}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className={[
            "px-8 py-3 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer",
            isLast
              ? "bg-[#a78bfa] text-white hover:bg-[#b89dfc]"
              : "text-[#52525b] hover:text-[#71717a]",
          ].join(" ")}
        >
          {isLast ? "시작하기" : "다음"}
        </button>
      </div>
    </div>
  );
}
