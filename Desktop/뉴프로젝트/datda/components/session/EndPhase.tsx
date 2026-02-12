"use client";

import { useState } from "react";
import { useDatdaStore } from "@/lib/store";
import { STATUS_OPTIONS } from "@/lib/constants";
import type { StatusType } from "@/lib/constants";
import Button from "@/components/ui/Button";

const STATUS_EMOJI: Record<StatusType, string> = {
  "가볍다": "\uD83D\uDE0C",
  "보통": "\uD83D\uDE10",
  "피곤": "\uD83D\uDE2E\u200D\uD83D\uDCA8",
};

export default function EndPhase() {
  const { setNextAction, setStatus, finalClose } = useDatdaStore();

  const [nextActionInput, setNextActionInput] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<StatusType | "">("");

  const handleFinalClose = () => {
    if (nextActionInput.trim()) {
      setNextAction(nextActionInput.trim());
    }
    finalClose();
  };

  return (
    <div className="flex flex-col items-center gap-10 w-full max-w-md mx-auto">
      {/* Section 1: Next Action */}
      <div className="w-full flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-[#e8e8f0]">내일 첫 행동</span>
          <span className="text-xs text-[#9898a8]">
            실행만 허용. 조사/공부/생각 금지.
          </span>
        </div>
        <input
          type="text"
          value={nextActionInput}
          onChange={(e) => setNextActionInput(e.target.value)}
          placeholder="업로드하기, 보내기, 만들기..."
          className="w-full px-4 py-3 bg-[#252530] border border-[#2d2d38] rounded-xl text-[#e8e8f0] placeholder:text-[#9898a8]/50 focus:border-[#a78bfa] transition-colors duration-300"
        />
      </div>

      {/* Section 2: Status Check */}
      <div className="w-full flex flex-col gap-3">
        <span className="text-sm text-[#e8e8f0]">지금 상태</span>
        <div className="flex items-center gap-2">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => {
                setSelectedStatus(status);
                setStatus(status);
              }}
              className={[
                "flex-1 px-3 py-3 text-sm rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2",
                "border",
                selectedStatus === status
                  ? "bg-[#a78bfa]/10 border-[#a78bfa] text-[#a78bfa]"
                  : "bg-[#252530] border-[#2d2d38] text-[#9898a8] hover:border-[#4a4a58]",
              ].join(" ")}
            >
              <span>{STATUS_EMOJI[status]}</span>
              <span>{status}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Section 3: Final Close */}
      <Button
        variant="primary"
        onClick={handleFinalClose}
        className="w-full text-base mt-4"
      >
        오늘은 여기까지
      </Button>
    </div>
  );
}
