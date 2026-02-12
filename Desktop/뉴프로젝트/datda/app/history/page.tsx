"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDatdaStore } from "@/lib/store";
import type { CloseType } from "@/lib/constants";

// ============================================================
// Helpers
// ============================================================

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - target.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const period = h < 12 ? "오전" : "오후";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${hour}:${m}`;
}

function getDateKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

const CLOSE_TYPE_STYLE: Record<string, { dot: string; text: string }> = {
  "완료": { dot: "bg-[#a78bfa]", text: "text-[#a78bfa]" },
  "보류": { dot: "bg-[#FFD166]", text: "text-[#FFD166]" },
  "폐기": { dot: "bg-[#6a6a7a]", text: "text-[#6a6a7a]" },
};

type FilterType = "전체" | CloseType;

// ============================================================
// Component
// ============================================================

export default function HistoryPage() {
  const sessions = useDatdaStore((s) => s.sessions);
  const [filter, setFilter] = useState<FilterType>("전체");

  // --- Stats ---
  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 6 * 86400000;

    const thisWeek = sessions.filter((s) => s.completedAt >= weekStart).length;

    // Streak: consecutive days with at least one closure (from today backward)
    let streak = 0;
    let checkDate = todayStart;
    while (true) {
      const dayEnd = checkDate + 86400000;
      const hasSession = sessions.some((s) => s.completedAt >= checkDate && s.completedAt < dayEnd);
      if (hasSession) {
        streak++;
        checkDate -= 86400000;
      } else {
        break;
      }
    }

    // Completion rate
    const completedCount = sessions.filter((s) => s.closeType === "완료").length;

    return { total: sessions.length, thisWeek, streak, completedCount };
  }, [sessions]);

  // --- Filtered + grouped ---
  const grouped = useMemo(() => {
    const filtered = filter === "전체"
      ? sessions
      : sessions.filter((s) => s.closeType === filter);

    const sorted = [...filtered].sort((a, b) => b.completedAt - a.completedAt);

    const groups: { label: string; sessions: typeof sorted }[] = [];
    let currentKey = "";
    for (const session of sorted) {
      const key = getDateKey(session.completedAt);
      if (key !== currentKey) {
        currentKey = key;
        groups.push({ label: formatDate(session.completedAt), sessions: [session] });
      } else {
        groups[groups.length - 1].sessions.push(session);
      }
    }
    return groups;
  }, [sessions, filter]);

  const totalFiltered = grouped.reduce((sum, g) => sum + g.sessions.length, 0);

  const filters: FilterType[] = ["전체", "완료", "보류", "폐기"];

  return (
    <div className="w-full max-w-md mx-auto py-8 px-4">
      {/* Header */}
      <h1 className="text-2xl font-light tracking-wide text-[#e8e8f0] mb-8">
        닫힌 것들
      </h1>

      {/* Stats */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card-glass rounded-xl p-4 text-center">
            <p className="text-2xl font-extralight text-[#e8e8f0] tabular-nums">{stats.total}</p>
            <p className="text-[10px] text-[#4a4a58] mt-1 tracking-wider">전체</p>
          </div>
          <div className="card-glass rounded-xl p-4 text-center">
            <p className="text-2xl font-extralight text-[#a78bfa] tabular-nums">{stats.thisWeek}</p>
            <p className="text-[10px] text-[#4a4a58] mt-1 tracking-wider">이번 주</p>
          </div>
          <div className="card-glass rounded-xl p-4 text-center">
            <p className="text-2xl font-extralight text-[#FFD166] tabular-nums">{stats.streak}</p>
            <p className="text-[10px] text-[#4a4a58] mt-1 tracking-wider">연속일</p>
          </div>
        </div>
      )}

      {/* Filter */}
      {sessions.length > 0 && (
        <div className="flex gap-1.5 mb-6">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={[
                "px-3 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer",
                filter === f
                  ? "bg-[#a78bfa]/20 text-[#a78bfa]"
                  : "bg-white/[0.04] text-[#6a6a7a] hover:text-[#9898a8]",
              ].join(" ")}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-1.5 h-1.5 rounded-full bg-[#a78bfa]/30 animate-breathe-subtle mb-6" />
          <p className="text-sm text-[#6a6a7a]">아직 닫힌 것이 없습니다</p>
        </div>
      )}

      {/* Filtered empty */}
      {sessions.length > 0 && totalFiltered === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-[#4a4a58]">{filter} 기록이 없습니다</p>
        </div>
      )}

      {/* Grouped List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={filter}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {grouped.map((group) => (
            <div key={group.label}>
              {/* Date label */}
              <p className="text-[10px] tracking-[0.2em] text-[#4a4a58] uppercase mb-3 pl-1">
                {group.label}
              </p>

              <div className="space-y-2">
                {group.sessions.map((session, i) => {
                  const style = CLOSE_TYPE_STYLE[session.closeType] || CLOSE_TYPE_STYLE["폐기"];

                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}
                      className="card-glass rounded-xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        {/* Close type dot */}
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`} />

                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <p className="text-sm text-[#e8e8f0] leading-relaxed mb-1.5">
                            {session.taskTitle}
                          </p>

                          {/* Meta row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-[#4a4a58]">
                              {formatTime(session.completedAt)}
                            </span>
                            <span className="text-[10px] text-[#4a4a58]">·</span>
                            <span className="text-[10px] text-[#4a4a58]">
                              {session.timerMinutes}분
                            </span>
                            <span className={`text-[10px] ${style.text}`}>
                              {session.closeType}
                            </span>
                          </div>

                          {/* Close reason (if exists) */}
                          {session.closeReason && (
                            <p className="text-[11px] text-[#6a6a7a] mt-2 leading-relaxed">
                              {session.closeReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Bottom count */}
      {totalFiltered > 0 && (
        <p className="text-center text-[10px] text-[#4a4a58] mt-8 tracking-wider">
          {totalFiltered}개의 기록
        </p>
      )}
    </div>
  );
}
