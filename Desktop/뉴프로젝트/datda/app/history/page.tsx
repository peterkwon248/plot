"use client";

import { motion } from "framer-motion";
import { useDatdaStore } from "@/lib/store";

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days === 1) return "어제";
  return `${days}일 전`;
}

function getCloseTypeColor(closeType: string | undefined): string {
  if (!closeType) return "bg-[#6a6a7a]";
  if (closeType === "완료") return "bg-[#a78bfa]";
  if (closeType === "보류") return "bg-[#FFD166]";
  if (closeType === "폐기") return "bg-[#6a6a7a]";
  return "bg-[#6a6a7a]";
}

export default function HistoryPage() {
  const sessions = useDatdaStore((state) => state.sessions);

  // Reverse chronological order - newest first
  const sortedSessions = [...sessions].sort((a, b) => b.completedAt - a.completedAt);

  return (
    <div className="w-full max-w-md mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light tracking-wide text-[#e8e8f0] mb-2">
          닫힌 것들
        </h1>
        <p className="text-sm text-[#6a6a7a]">쌓여가는 닫힘의 기록</p>
      </div>

      {/* Empty State */}
      {sortedSessions.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[#6a6a7a]">아직 닫힌 것이 없습니다.</p>
        </div>
      )}

      {/* Sessions List */}
      {sortedSessions.length > 0 && (
        <div className="space-y-3">
          {sortedSessions.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="card-glass p-5"
            >
              <div className="flex items-start gap-3">
                {/* Close Type Indicator */}
                <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${getCloseTypeColor(session.resultType)}`} />

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[#e8e8f0] mb-1 truncate">
                    {session.taskTitle}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-[#9898a8]">
                    <span>{formatRelativeTime(session.completedAt)}</span>
                    {session.timerMinutes && (
                      <>
                        <span className="text-[#6a6a7a]">·</span>
                        <span className="text-[10px] text-[#6a6a7a]">{session.timerMinutes}분</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Result Type Badge */}
                {session.resultType && (
                  <span className="px-2 py-0.5 rounded-full bg-[#a78bfa]/10 text-[#a78bfa] text-[10px] font-medium whitespace-nowrap flex-shrink-0">
                    {session.resultType}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Total Count */}
      {sortedSessions.length > 0 && (
        <div className="mt-8 text-center text-sm text-[#a78bfa]/50">
          {sortedSessions.length}번의 닫힘
        </div>
      )}
    </div>
  );
}
