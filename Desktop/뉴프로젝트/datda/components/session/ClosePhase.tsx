"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useDatdaStore } from "@/lib/store";
import type { CloseType } from "@/lib/constants";
import { CLOSE_TYPE_CONFIG } from "@/lib/constants";

export default function ClosePhase() {
  const { taskTitle, setCloseType, completeClose, completeLock, finalClose } =
    useDatdaStore();

  const [selectedType, setSelectedType] = useState<CloseType | null>(null);
  const [location, setLocation] = useState("");

  const handleTypeSelect = (type: CloseType) => {
    setSelectedType(type);
    setCloseType(type);

    // 보류: 즉시 닫기
    if (type === '보류') {
      completeClose('');
      completeLock('');
      finalClose();
    }
  };

  const handleComplete = () => {
    completeClose('');
    completeLock(location.trim());
    finalClose();
  };

  const handleDiscard = () => {
    completeClose('');
    completeLock('');
    finalClose();
  };

  // Step 2: 완료 → 결과 위치 입력
  if (selectedType === '완료') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center min-h-[70vh] w-full max-w-md mx-auto"
      >
        <div className="flex flex-col items-center gap-3 text-center mb-8">
          <h1 className="text-2xl font-extralight tracking-wide text-[#e8e8f0]">형태가 남았다</h1>
          <p className="text-xs text-[#66667a] tracking-wider">{taskTitle}</p>
        </div>

        <div className="w-full flex flex-col gap-2 mb-8">
          <label className="text-sm text-[#9898a8]">
            결과를 어디에 남겼나요?
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="링크, 파일명, 폴더..."
            className="input-base py-4"
          />
          <p className="text-xs text-[#66667a]/50 tracking-wider">비워둬도 됩니다</p>
        </div>

        <button
          onClick={handleComplete}
          className="w-full py-4 text-sm tracking-[0.1em] bg-[#a78bfa] text-white rounded-xl hover:bg-[#b89dfc] cursor-pointer transition-all duration-300"
        >
          닫기
        </button>
      </motion.div>
    );
  }

  // Step 2: 폐기 → 확인
  if (selectedType === '폐기') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center min-h-[70vh] w-full max-w-md mx-auto"
      >
        <div className="flex flex-col items-center text-center mb-12">
          <p className="text-xl font-light text-[#e8e8f0]">정말 내려놓으시겠습니까?</p>
          <p className="text-xs text-[#66667a] tracking-wider mt-2">{taskTitle}</p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={handleDiscard}
            className="w-full py-4 text-sm tracking-wider card-glass hover:border-[#f87171]/30 cursor-pointer text-[#e8e8f0] transition-all duration-300"
          >
            네, 내려놓겠습니다
          </button>
          <button
            onClick={() => setSelectedType(null)}
            className="text-xs text-[#66667a] hover:text-[#9898a8] cursor-pointer mt-4 transition-colors duration-300"
          >
            돌아가기
          </button>
        </div>
      </motion.div>
    );
  }

  // Step 1: Close Type Selection
  const borderColors = {
    '완료': 'border-[#a78bfa]',
    '보류': 'border-[#FFD166]',
    '폐기': 'border-[#8888a0]',
  };

  const hoverBorderColors = {
    '완료': 'hover:border-l-[#b89dfc]',
    '보류': 'hover:border-l-[#FFE194]',
    '폐기': 'hover:border-l-[#7a7a8a]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[70vh] w-full max-w-md mx-auto"
    >
      <div className="flex flex-col items-center text-center mb-12">
        <p className="text-xs tracking-[0.3em] text-[#66667a] uppercase mb-4">닫는 방법</p>
        <h1 className="text-xl font-light text-[#e8e8f0]">{taskTitle}</h1>
      </div>

      <div className="flex flex-col gap-4 w-full">
        {(['완료', '보류', '폐기'] as CloseType[]).map((type, idx) => {
          const config = CLOSE_TYPE_CONFIG[type];
          return (
            <motion.button
              key={type}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.15 }}
              onClick={() => handleTypeSelect(type)}
              className={`w-full py-6 px-6 card-glass border-l-2 ${borderColors[type]} ${hoverBorderColors[type]} hover:translate-x-[2px] cursor-pointer transition-all duration-300 group`}
            >
              <div className="flex items-center justify-between">
                <p className="text-lg font-light text-[#e8e8f0]">
                  {config.label}
                </p>
                <p className="text-xs text-[#66667a]">
                  {config.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
