"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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

  const [newMinutes, setNewMinutes] = useState("");
  const [newResultType, setNewResultType] = useState("");
  const [backupMessage, setBackupMessage] = useState("");
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
  };

  const handleAddResultType = () => {
    const trimmed = newResultType.trim();
    if (trimmed.length === 0 || trimmed.length > 10) return;
    addResultType(trimmed);
    setNewResultType("");
  };

  const handleReset = () => {
    resetSettings();
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
    setBackupMessage("내보내기 완료.");
    setTimeout(() => setBackupMessage(""), 3000);
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
          setBackupMessage("올바른 백업 파일이 아닙니다.");
          return;
        }
        localStorage.setItem("datda-storage", text);
        setBackupMessage("가져오기 완료. 새로고침합니다.");
        setTimeout(() => window.location.reload(), 1000);
      } catch {
        setBackupMessage("파일을 읽을 수 없습니다.");
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  return (
    <div className="w-full max-w-md mx-auto py-8 px-4">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-[#e4e4e7] mb-2">설정</h1>
        <p className="text-sm text-[#71717a]">
          세션을 나에게 맞게 조정합니다.
        </p>
      </div>

      {/* Timer Presets */}
      <section className="mb-10">
        <h2 className="text-sm font-medium text-[#e4e4e7] tracking-wide mb-4">
          세션 시간
        </h2>

        <div className="flex flex-wrap gap-2 mb-4">
          {timerPresets.map((minutes) => (
            <div
              key={minutes}
              className="group flex items-center gap-1.5 px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-[#e4e4e7]"
            >
              <span>{minutes}분</span>
              {timerPresets.length > 1 && (
                <button
                  onClick={() => removeTimerPreset(minutes)}
                  className="text-[#52525b] hover:text-red-400/80 transition-colors cursor-pointer ml-1 opacity-40 hover:opacity-100"
                  aria-label={`${minutes}분 삭제`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            value={newMinutes}
            onChange={(e) => setNewMinutes(e.target.value)}
            placeholder="분"
            min={5}
            max={180}
            className="w-24 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[#e4e4e7] placeholder:text-[#71717a]/50 text-sm focus:border-[#a78bfa]/50 focus:outline-none transition-all duration-300"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddTimer();
            }}
          />
          <button
            onClick={handleAddTimer}
            disabled={!newMinutes || isNaN(parseInt(newMinutes, 10))}
            className="px-4 py-2 text-sm rounded-xl bg-white/[0.03] border border-white/[0.06] text-[#71717a] hover:text-[#e4e4e7] hover:border-white/[0.1] transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            추가
          </button>
        </div>
      </section>

      {/* Result Types */}
      <section className="mb-10">
        <h2 className="text-sm font-medium text-[#e4e4e7] tracking-wide mb-4">
          결과 유형
        </h2>

        <div className="flex flex-wrap gap-2 mb-4">
          {resultTypes.map((type) => (
            <div
              key={type}
              className="group flex items-center gap-1.5 px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-[#e4e4e7]"
            >
              <span>{type}</span>
              {resultTypes.length > 1 && (
                <button
                  onClick={() => removeResultType(type)}
                  className="text-[#52525b] hover:text-red-400/80 transition-colors cursor-pointer ml-1 opacity-40 hover:opacity-100"
                  aria-label={`${type} 삭제`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newResultType}
            onChange={(e) => setNewResultType(e.target.value)}
            placeholder="새 유형"
            maxLength={10}
            className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[#e4e4e7] placeholder:text-[#71717a]/50 text-sm focus:border-[#a78bfa]/50 focus:outline-none transition-all duration-300"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddResultType();
            }}
          />
          <button
            onClick={handleAddResultType}
            disabled={newResultType.trim().length === 0}
            className="px-4 py-2 text-sm rounded-xl bg-white/[0.03] border border-white/[0.06] text-[#71717a] hover:text-[#e4e4e7] hover:border-white/[0.1] transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            추가
          </button>
        </div>
      </section>

      {/* Data Backup */}
      <section className="mb-10">
        <h2 className="text-sm font-medium text-[#e4e4e7] tracking-wide mb-2">
          데이터 백업
        </h2>
        <p className="text-xs text-[#52525b] mb-4">
          모든 기록을 파일로 저장하거나 복원합니다.
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 text-sm rounded-xl bg-white/[0.03] border border-white/[0.06] text-[#e4e4e7] hover:border-white/[0.1] transition-all duration-300 cursor-pointer"
          >
            내보내기
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 text-sm rounded-xl bg-white/[0.03] border border-white/[0.06] text-[#71717a] hover:text-[#e4e4e7] hover:border-white/[0.1] transition-all duration-300 cursor-pointer"
          >
            가져오기
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
          <p className="text-xs text-[#a78bfa] mt-3">{backupMessage}</p>
        )}
      </section>

      {/* Reset */}
      <div className="pt-6 border-t border-white/[0.04]">
        <button
          onClick={handleReset}
          className="text-xs text-[#52525b] hover:text-[#71717a] transition-colors duration-300 cursor-pointer"
        >
          기본값으로 되돌리기
        </button>
        <p className="text-xs text-[#3f3f46] mt-2">
          세션 시간: {[...TIMER_PRESETS].join(', ')}분 · 결과 유형: {[...RESULT_TYPES].join(', ')}
        </p>
      </div>
    </div>
  );
}
