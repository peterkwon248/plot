"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDatdaStore } from "@/lib/store";

const SLIDES = [
  {
    title: "닫다",
    body: "할 일 앱이 아닙니다.\n종료 장치입니다.",
    gradient: "radial-gradient(circle at 50% 30%, rgba(167, 139, 250, 0.08) 0%, transparent 60%)",
  },
  {
    title: "매일 하나",
    body: "큰 목표를 잘게 쪼개고,\n하루에 하나씩 닫습니다.",
    gradient: "radial-gradient(circle at 70% 40%, rgba(196, 181, 253, 0.08) 0%, transparent 60%)",
  },
  {
    title: "느리지만 분명하게",
    body: "급하지 않아도 괜찮습니다.\n닫힌 것들이 쌓이면,\n그것이 곧 당신의 기록입니다.",
    gradient: "radial-gradient(circle at 30% 50%, rgba(167, 139, 250, 0.1) 0%, transparent 60%)",
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
      className="fixed inset-0 z-50 flex flex-col items-center bg-[#1a1a1f] px-8"
      onClick={handleNext}
    >
      {/* Animated radial gradient background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${current}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: slide.gradient }}
        />
      </AnimatePresence>

      {/* Content - takes up available space, centered */}
      <div className="flex-1 flex items-center justify-center w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center text-center max-w-sm relative z-10"
          >
            <h1 className="text-4xl font-extralight tracking-widest text-[#e8e8f0] mb-8">
              {slide.title}
            </h1>
            <p className="text-base text-[#9898a8] leading-loose whitespace-pre-line">
              {slide.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom area - fixed at bottom, never overlaps */}
      <div className="flex flex-col items-center gap-6 pb-16 relative z-10">
        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={[
                "h-1.5 rounded-full transition-all duration-300",
                i === current ? "w-6 bg-[#a78bfa]" : "w-1.5 bg-[#2d2d38]",
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
            "px-8 py-3 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer relative",
            isLast
              ? "bg-[#a78bfa] text-white hover:bg-[#b89dfc] animate-glow-pulse"
              : "text-[#9898a8] hover:underline underline-offset-4",
          ].join(" ")}
        >
          {isLast ? "시작하기" : "다음"}
        </button>
      </div>
    </div>
  );
}
