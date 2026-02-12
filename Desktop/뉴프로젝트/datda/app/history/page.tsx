"use client";

import Link from "next/link";
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

export default function HistoryPage() {
  const sessions = useDatdaStore((state) => state.sessions);

  // Reverse chronological order - newest first
  const sortedSessions = [...sessions].sort((a, b) => b.completedAt - a.completedAt);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e4e4e7] p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">닫힌 것들</h1>
        </div>

        {/* Empty State */}
        {sortedSessions.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#71717a] mb-6">아직 닫힌 것이 없습니다.</p>
            <Link
              href="/chat"
              className="inline-block px-6 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-[#e4e4e7] hover:border-[#a78bfa]/50 hover:text-[#a78bfa] transition-all duration-300"
            >
              첫 세션 시작하기 →
            </Link>
          </div>
        )}

        {/* Sessions List */}
        {sortedSessions.length > 0 && (
          <div className="space-y-3">
            {sortedSessions.map((session) => (
              <div
                key={session.id}
                className="bg-[#141416] border border-[#27272a] rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-[#e4e4e7] mb-1">
                      {session.taskTitle}
                    </h3>
                    <p className="text-sm text-[#71717a]">
                      {formatRelativeTime(session.completedAt)}
                    </p>
                  </div>
                  {session.resultType && (
                    <span className="px-3 py-1 rounded-full bg-[#a78bfa]/10 text-[#a78bfa] text-xs font-medium whitespace-nowrap">
                      {session.resultType}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total Count */}
        {sortedSessions.length > 0 && (
          <div className="mt-8 text-center text-sm text-[#71717a]">
            총 {sortedSessions.length}개의 세션을 닫았습니다
          </div>
        )}
      </div>
    </div>
  );
}
