"use client";

import { useState } from "react";
import { useDatdaStore } from "@/lib/store";
import Button from "@/components/ui/Button";

export default function LockPhase() {
  const { taskTitle, completeLock } = useDatdaStore();

  const [location, setLocation] = useState("");

  const handleLock = () => {
    completeLock(location.trim());
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto">
      {/* Title */}
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-xl font-semibold text-[#e8e8f0]">
          결과 고정
        </h1>
        <p className="text-sm text-[#a098b4]">
          다시 볼 수 있도록 남겨두세요.
        </p>
      </div>

      {/* Completed Task */}
      <p className="text-[#a098b4] text-center">{taskTitle}</p>

      {/* Location Input */}
      <div className="w-full flex flex-col gap-2">
        <label className="text-xs text-[#a098b4]">
          결과를 어디에 남겼나요?
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="링크, 파일명, 폴더..."
          className="w-full px-4 py-3 bg-[#252530] border border-[#2d2d38] rounded-xl text-[#e8e8f0] placeholder:text-[#a098b4]/50 focus:border-[#a78bfa] transition-colors duration-300"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLock();
          }}
        />
      </div>

      {/* Lock Button */}
      <Button variant="primary" onClick={handleLock} className="w-full">
        고정하기
      </Button>
    </div>
  );
}
