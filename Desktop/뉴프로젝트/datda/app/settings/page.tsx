"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDatdaStore } from "@/lib/store";
import { TIMER_PRESETS, RESULT_TYPES } from "@/lib/constants";

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const getTimerPresets = useDatdaStore((s) => s.getTimerPresets);
  const getResultTypes = useDatdaStore((s) => s.getResultTypes);
  const addTimerPreset = useDatdaStore((s) => s.addTimerPreset);
  const removeTimerPreset = useDatdaStore((s) => s.removeTimerPreset);
  const addResultType = useDatdaStore((s) => s.addResultType);
  const removeResultType = useDatdaStore((s) => s.removeResultType);
  const resetSettings = useDatdaStore((s) => s.resetSettings);

  const [showTimerAdd, setShowTimerAdd] = useState(false);
  const [showResultAdd, setShowResultAdd] = useState(false);
  const [newMinutes, setNewMinutes] = useState("");
  const [newResultType, setNewResultType] = useState("");
  const [backupMessage, setBackupMessage] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-pulse" />
      </div>
    );
  }

  const timerPresets = getTimerPresets();
  const resultTypes = getResultTypes();

  const handleAddTimer = () => {
    const val = parseInt(newMinutes, 10);
    if (isNaN(val) || val < 5 || val > 180) return;
    addTimerPreset(val);
    setNewMinutes("");
    setShowTimerAdd(false);
  };

  const handleAddResultType = () => {
    const trimmed = newResultType.trim();
    if (trimmed.length === 0 || trimmed.length > 10) return;
    addResultType(trimmed);
    setNewResultType("");
    setShowResultAdd(false);
  };

  const handleExport = () => {
    const raw = localStorage.getItem("datda-storage");
    if (!raw) {
      setBackupMessage("내보낼 데이터가 없습니다.");
      return;
    }
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `datda-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMessage("완료");
    setTimeout(() => setBackupMessage(""), 2000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.state) {
          setBackupMessage("올바른 파일이 아닙니다.");
          return;
        }
        localStorage.setItem("datda-storage", text);
        setBackupMessage("복원 완료. 새로고침합니다.");
        setTimeout(() => window.location.reload(), 1000);
      } catch {
        setBackupMessage("읽을 수 없는 파일입니다.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="w-full max-w-md mx-auto py-8 px-4">
      <h1 className="text-2xl font-light tracking-wide text-[#e8e8f0] mb-10">설정</h1>

      {/* ============================================
          Section 1: Timer Presets
          ============================================ */}
      <section className="card-glass rounded-2xl p-6 mb-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm text-[#e8e8f0]">세션 시간</h2>
          <button
            onClick={() => setShowTimerAdd(!showTimerAdd)}
            className="text-xs text-[#a78bfa] hover:text-[#b89dfc] transition-colors cursor-pointer"
          >
            {showTimerAdd ? "취소" : "+ 추가"}
          </button>
        </div>
        <p className="text-xs text-[#4a4a58] mb-5">세션을 시작할 때 선택할 수 있는 시간</p>

        <div className="flex flex-wrap gap-2">
          {timerPresets.map((minutes) => (
            <div
              key={minutes}
              className="group relative flex items-center px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-[#e8e8f0]"
            >
              {minutes}분
              {timerPresets.length > 1 && (
                <button
                  onClick={() => removeTimerPreset(minutes)}
                  className="ml-2 w-4 h-4 flex items-center justify-center rounded-full bg-white/[0.06] text-[#6a6a7a] hover:bg-[#f87171]/20 hover:text-[#f87171] transition-all text-xs cursor-pointer"
                  aria-label={`${minutes}분 삭제`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <AnimatePresence>
          {showTimerAdd && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 mt-4 pt-4 border-t border-white/[0.06]">
                <input
                  type="number"
                  value={newMinutes}
                  onChange={(e) => setNewMinutes(e.target.value)}
                  placeholder="5 ~ 180"
                  min={5}
                  max={180}
                  className="w-28 input-base"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddTimer(); }}
                  autoFocus
                />
                <button
                  onClick={handleAddTimer}
                  disabled={!newMinutes || isNaN(parseInt(newMinutes, 10))}
                  className="px-4 py-2 text-sm rounded-xl bg-[#a78bfa] text-white hover:bg-[#b89dfc] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  추가
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ============================================
          Section 2: Result Types
          ============================================ */}
      <section className="card-glass rounded-2xl p-6 mb-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm text-[#e8e8f0]">결과 유형</h2>
          <button
            onClick={() => setShowResultAdd(!showResultAdd)}
            className="text-xs text-[#a78bfa] hover:text-[#b89dfc] transition-colors cursor-pointer"
          >
            {showResultAdd ? "취소" : "+ 추가"}
          </button>
        </div>
        <p className="text-xs text-[#4a4a58] mb-5">닫힘의 결과를 분류하는 태그</p>

        <div className="flex flex-wrap gap-2">
          {resultTypes.map((type) => (
            <div
              key={type}
              className="group relative flex items-center px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-[#e8e8f0]"
            >
              {type}
              {resultTypes.length > 1 && (
                <button
                  onClick={() => removeResultType(type)}
                  className="ml-2 w-4 h-4 flex items-center justify-center rounded-full bg-white/[0.06] text-[#6a6a7a] hover:bg-[#f87171]/20 hover:text-[#f87171] transition-all text-xs cursor-pointer"
                  aria-label={`${type} 삭제`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <AnimatePresence>
          {showResultAdd && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 mt-4 pt-4 border-t border-white/[0.06]">
                <input
                  type="text"
                  value={newResultType}
                  onChange={(e) => setNewResultType(e.target.value)}
                  placeholder="유형 이름 (10자 이내)"
                  maxLength={10}
                  className="flex-1 input-base"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddResultType(); }}
                  autoFocus
                />
                <button
                  onClick={handleAddResultType}
                  disabled={newResultType.trim().length === 0}
                  className="px-4 py-2 text-sm rounded-xl bg-[#a78bfa] text-white hover:bg-[#b89dfc] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  추가
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ============================================
          Section 3: Data
          ============================================ */}
      <section className="card-glass rounded-2xl p-6 mb-4">
        <h2 className="text-sm text-[#e8e8f0] mb-1">데이터</h2>
        <p className="text-xs text-[#4a4a58] mb-5">닫힘 기록과 목표를 백업하거나 복원합니다</p>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.1] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#9898a8]">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span className="text-sm text-[#e8e8f0]">내보내기</span>
            </div>
            <span className="text-xs text-[#4a4a58] group-hover:text-[#9898a8] transition-colors">.json</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.1] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#9898a8]">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-sm text-[#e8e8f0]">가져오기</span>
            </div>
            <span className="text-xs text-[#4a4a58] group-hover:text-[#9898a8] transition-colors">복원</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        {backupMessage && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-[#a78bfa] mt-3"
          >
            {backupMessage}
          </motion.p>
        )}
      </section>

      {/* ============================================
          Section 4: Reset
          ============================================ */}
      <section className="card-glass rounded-2xl p-6">
        <h2 className="text-sm text-[#e8e8f0] mb-1">초기화</h2>
        <p className="text-xs text-[#4a4a58] mb-5">세션 시간과 결과 유형을 기본값으로 되돌립니다</p>

        {showResetConfirm ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={() => {
                resetSettings();
                setShowResetConfirm(false);
              }}
              className="px-4 py-2 text-sm rounded-xl bg-[#f87171]/10 text-[#f87171] hover:bg-[#f87171]/20 transition-colors cursor-pointer"
            >
              확인
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="text-xs text-[#6a6a7a] hover:text-[#9898a8] transition-colors cursor-pointer"
            >
              취소
            </button>
            <span className="text-xs text-[#4a4a58]">
              {[...TIMER_PRESETS].join(', ')}분 / {[...RESULT_TYPES].join(', ')}
            </span>
          </motion.div>
        ) : (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-sm text-[#9898a8] hover:text-[#f87171] transition-colors cursor-pointer"
          >
            기본값으로 되돌리기
          </button>
        )}
      </section>
    </div>
  );
}
