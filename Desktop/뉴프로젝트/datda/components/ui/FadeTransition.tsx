"use client";

import { motion, AnimatePresence } from "framer-motion";

interface FadeTransitionProps {
  children: React.ReactNode;
  keyValue: string;
  direction?: "up" | "down";
}

export default function FadeTransition({
  children,
  keyValue,
  direction = "up",
}: FadeTransitionProps) {
  const yOffset = direction === "up" ? 20 : -20;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={keyValue}
        initial={{ opacity: 0, y: yOffset }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -yOffset }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
