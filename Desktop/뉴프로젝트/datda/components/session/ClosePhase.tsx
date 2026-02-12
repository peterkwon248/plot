"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useDatdaStore } from "@/lib/store";
import Button from "@/components/ui/Button";

export default function ClosePhase() {
  const { taskTitle, completeClose, completeLock, setNextAction, finalClose } =
    useDatdaStore();

  const [reason, setReason] = useState("");
  const [location, setLocation] = useState("");
  const [nextActionInput, setNextActionInput] = useState("");

  const handleClose = () => {
    completeClose(reason.trim());
    completeLock(location.trim());
    if (nextActionInput.trim()) {
      setNextAction(nextActionInput.trim());
    }
    finalClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-8 w-full max-w-md mx-auto"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold text-[#e4e4e7]">마무리</h1>
        <p className="text-sm text-[#71717a]">{taskTitle}</p>
      </div>

      {/* 1. Close reason */}
      <div className="w-full flex flex-col gap-2">
        <label className="text-sm text-[#e4e4e7]">
          오늘 더 하지 않는 이유
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="충분히 했으니까"
          className="w-full px-4 py-3 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl text-[#e4e4e7] placeholder:text-[#71717a]/50 text-sm focus:border-[#a78bfa]/50 focus:outline-none transition-all duration-300"
        />
      </div>

      {/* 2. Result location */}
      <div className="w-full flex flex-col gap-2">
        <label className="text-sm text-[#e4e4e7]">
          결과를 어디에 남겼나요?
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="링크, 파일명, 폴더..."
          className="w-full px-4 py-3 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl text-[#e4e4e7] placeholder:text-[#71717a]/50 text-sm focus:border-[#a78bfa]/50 focus:outline-none transition-all duration-300"
        />
      </div>

      {/* 3. Next action */}
      <div className="w-full flex flex-col gap-2">
        <label className="text-sm text-[#e4e4e7]">내일 첫 행동</label>
        <input
          type="text"
          value={nextActionInput}
          onChange={(e) => setNextActionInput(e.target.value)}
          placeholder="업로드하기, 보내기, 만들기..."
          className="w-full px-4 py-3 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-xl text-[#e4e4e7] placeholder:text-[#71717a]/50 text-sm focus:border-[#a78bfa]/50 focus:outline-none transition-all duration-300"
        />
      </div>

      {/* Close button */}
      <Button
        variant="primary"
        onClick={handleClose}
        className="w-full text-base mt-2"
      >
        닫기
      </Button>
    </motion.div>
  );
}
