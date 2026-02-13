"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDatdaStore } from "@/lib/store";

// ============================================================
// Helpers
// ============================================================

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_LABELS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDow = firstDay.getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length < 42) cells.push(null);
  return cells;
}

function getIntensity(count: number): string {
  if (count === 0) return "bg-white/[0.03]";
  if (count === 1) return "bg-[#a78bfa]/20";
  if (count === 2) return "bg-[#a78bfa]/40";
  if (count === 3) return "bg-[#a78bfa]/60";
  return "bg-[#a78bfa]/80";
}

function getGrowthMessage(total: number): string {
  if (total === 0) return "씨앗을 심어보세요";
  if (total < 3) return "작은 싹이 올라오고 있습니다";
  if (total < 8) return "줄기가 자라고 있습니다";
  if (total < 15) return "가지가 뻗어가고 있습니다";
  if (total < 25) return "잎이 펼쳐지고 있습니다";
  if (total < 40) return "첫 열매가 맺혔습니다";
  if (total < 60) return "열매가 영글고 있습니다";
  if (total < 100) return "정원이 풍성해지고 있습니다";
  return "당신의 정원은 무성합니다";
}

// ============================================================
// Tree SVG - grows with closure count
// ============================================================

// Fixed fruit positions on the tree canopy (max 30 visible)
const FRUIT_POSITIONS = [
  { x: 120, y: 68 }, { x: 155, y: 55 }, { x: 90, y: 50 },
  { x: 140, y: 40 }, { x: 105, y: 75 }, { x: 170, y: 70 },
  { x: 75, y: 65 }, { x: 130, y: 30 }, { x: 160, y: 85 },
  { x: 85, y: 40 }, { x: 145, y: 95 }, { x: 100, y: 90 },
  { x: 175, y: 50 }, { x: 70, y: 80 }, { x: 135, y: 60 },
  { x: 110, y: 45 }, { x: 165, y: 35 }, { x: 80, y: 55 },
  { x: 150, y: 75 }, { x: 95, y: 35 }, { x: 125, y: 85 },
  { x: 180, y: 60 }, { x: 65, y: 70 }, { x: 140, y: 25 },
  { x: 110, y: 95 }, { x: 155, y: 45 }, { x: 88, y: 60 },
  { x: 168, y: 90 }, { x: 78, y: 45 }, { x: 132, y: 50 },
];

// Leaf cluster positions
const LEAF_POSITIONS = [
  { x: 120, y: 55, r: 28 }, { x: 90, y: 60, r: 22 }, { x: 150, y: 60, r: 24 },
  { x: 105, y: 40, r: 20 }, { x: 140, y: 38, r: 22 }, { x: 75, y: 70, r: 18 },
  { x: 170, y: 68, r: 20 }, { x: 120, y: 30, r: 18 }, { x: 95, y: 80, r: 16 },
  { x: 155, y: 80, r: 18 },
];

function GardenTree({ count, fruitRipeness, selectedFruit, onFruitTap }: {
  count: number;
  fruitRipeness: boolean[]; // true = belongs to completed goal (ripe/big), false = normal
  selectedFruit: number | null;
  onFruitTap: (index: number) => void;
}) {
  // Growth stages based on total sessions (tree body grows with effort)
  const stage = count === 0 ? 0 : count < 3 ? 1 : count < 8 ? 2 : count < 15 ? 3 : count < 25 ? 4 : 5;

  // Fruits = sessions (max 30)
  const fruitCount = Math.min(fruitRipeness.length, FRUIT_POSITIONS.length);

  // How many leaf clusters to show
  const leafCount = stage <= 1 ? 0 : stage === 2 ? 2 : stage === 3 ? 5 : stage === 4 ? 8 : LEAF_POSITIONS.length;

  // Trunk height grows with stage
  const trunkTop = stage === 0 ? 190 : stage === 1 ? 160 : stage === 2 ? 130 : stage === 3 ? 110 : 100;

  // Branch paths appear at higher stages
  const showBranches = stage >= 3;
  const showFlowers = stage >= 5 && count >= 40;

  return (
    <svg width="240" height="240" viewBox="0 0 240 240" className="mx-auto">
      {/* Ground */}
      <ellipse cx="120" cy="220" rx="80" ry="8" fill="rgba(167, 139, 250, 0.04)" />
      <line x1="40" y1="220" x2="200" y2="220" stroke="rgba(167, 139, 250, 0.1)" strokeWidth="0.5" />

      {/* Stage 0: Seed */}
      {stage === 0 && (
        <motion.circle
          cx="120" cy="215" r="3"
          fill="#a78bfa"
          opacity={0.3}
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}

      {/* Trunk */}
      {stage >= 1 && (
        <motion.line
          x1="120" y1="220" x2="120" y2={trunkTop}
          stroke="#8888a0"
          strokeWidth={stage <= 2 ? 1.5 : stage <= 3 ? 2 : 2.5}
          strokeLinecap="round"
          initial={{ y2: 220 }}
          animate={{ y2: trunkTop }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        />
      )}

      {/* Stage 1: Tiny sprout leaves */}
      {stage === 1 && (
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <ellipse cx="115" cy={trunkTop - 2} rx="4" ry="7" fill="#a78bfa" opacity={0.25} transform={`rotate(-30 115 ${trunkTop - 2})`} />
          <ellipse cx="125" cy={trunkTop - 2} rx="4" ry="7" fill="#a78bfa" opacity={0.25} transform={`rotate(30 125 ${trunkTop - 2})`} />
        </motion.g>
      )}

      {/* Branches */}
      {showBranches && (
        <g>
          <motion.path
            d={`M120 ${trunkTop + 20} Q100 ${trunkTop + 5} 85 ${trunkTop - 10}`}
            stroke="#8888a0" strokeWidth="1.5" fill="none" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          />
          <motion.path
            d={`M120 ${trunkTop + 20} Q140 ${trunkTop + 5} 160 ${trunkTop - 5}`}
            stroke="#8888a0" strokeWidth="1.5" fill="none" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
          {stage >= 4 && (
            <>
              <motion.path
                d={`M120 ${trunkTop + 35} Q90 ${trunkTop + 20} 70 ${trunkTop + 5}`}
                stroke="#8888a0" strokeWidth="1" fill="none" strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.7 }}
              />
              <motion.path
                d={`M120 ${trunkTop + 35} Q150 ${trunkTop + 15} 175 ${trunkTop + 5}`}
                stroke="#8888a0" strokeWidth="1" fill="none" strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.9 }}
              />
            </>
          )}
        </g>
      )}

      {/* Leaf clusters */}
      {LEAF_POSITIONS.slice(0, leafCount).map((leaf, i) => (
        <motion.circle
          key={`leaf-${i}`}
          cx={leaf.x} cy={leaf.y} r={leaf.r}
          fill="#a78bfa"
          opacity={0.06 + (stage >= 5 ? 0.04 : 0)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.06 + (stage >= 5 ? 0.04 : 0) }}
          transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
        />
      ))}

      {/* Fruits (tappable) */}
      {FRUIT_POSITIONS.slice(0, fruitCount).map((pos, i) => {
        const isSelected = selectedFruit === i;
        const isRipe = fruitRipeness[i] ?? false;
        const baseR = isRipe ? 5 : 3;
        const r = isSelected ? baseR + 1 : baseR;

        return (
          <g key={`fruit-${i}`} style={{ cursor: "pointer" }} onClick={() => onFruitTap(i)}>
            {/* Larger invisible hit area */}
            <circle cx={pos.x} cy={pos.y} r={12} fill="transparent" />
            {/* Ripe glow */}
            {isRipe && (
              <circle cx={pos.x} cy={pos.y} r={9} fill="#a78bfa" opacity={0.08} />
            )}
            {/* Selected ring */}
            {isSelected && (
              <motion.circle
                cx={pos.x} cy={pos.y} r={r + 4}
                fill="none" stroke="#a78bfa" strokeWidth={0.5}
                opacity={0.5}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              />
            )}
            {/* Fruit dot */}
            <motion.circle
              cx={pos.x} cy={pos.y}
              r={r}
              fill={isRipe ? "#a78bfa" : "#a78bfa"}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: isRipe ? 1 : 0.4 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.08 }}
            />
          </g>
        );
      })}

      {/* Flowers (stage 5+, count 40+) */}
      {showFlowers && [
        { x: 98, y: 48 }, { x: 148, y: 42 }, { x: 125, y: 28 },
        { x: 78, y: 62 }, { x: 168, y: 58 },
      ].map((pos, i) => (
        <motion.g
          key={`flower-${i}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 + i * 0.15 }}
        >
          <circle cx={pos.x} cy={pos.y} r={2} fill="#FFD166" opacity={0.6} />
          <circle cx={pos.x} cy={pos.y} r={5} fill="#FFD166" opacity={0.1} />
        </motion.g>
      ))}

      {/* Glow behind tree at high stages */}
      {stage >= 4 && (
        <motion.circle
          cx="120" cy="80" r="60"
          fill="url(#treeGlow)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        />
      )}

      <defs>
        <radialGradient id="treeGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// ============================================================
// Page Component
// ============================================================

export default function GardenPage() {
  const sessions = useDatdaStore((s) => s.sessions);
  const goals = useDatdaStore((s) => s.goals);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedFruit, setSelectedFruit] = useState<number | null>(null);

  // Sort sessions oldest-first for fruit ordering
  const sortedSessions = useMemo(() =>
    [...sessions].sort((a, b) => a.completedAt - b.completedAt),
    [sessions]
  );

  // Completed goal IDs (all steps completed/discarded, at least one completed)
  const completedGoalTitles = useMemo(() => {
    const titles = new Set<string>();
    for (const g of goals) {
      if (g.steps.length === 0) continue;
      const completedSteps = g.steps.filter((s) => s.completed);
      const discardedSteps = g.steps.filter((s) => s.discarded);
      if (completedSteps.length > 0 &&
        completedSteps.length + discardedSteps.length === g.steps.length) {
        titles.add(g.title);
      }
    }
    return titles;
  }, [goals]);

  // fruitRipeness: true if session's task belongs to a completed goal
  const fruitRipeness = useMemo(() =>
    sortedSessions.map((s) => completedGoalTitles.has(s.taskTitle)),
    [sortedSessions, completedGoalTitles]
  );

  const selectedSession = selectedFruit !== null ? sortedSessions[selectedFruit] ?? null : null;

  const dayCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const session of sessions) {
      const d = new Date(session.completedAt);
      if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
        const day = d.getDate();
        counts[day] = (counts[day] || 0) + 1;
      }
    }
    return counts;
  }, [sessions, viewYear, viewMonth]);

  const grid = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const monthStats = useMemo(() => {
    const total = Object.values(dayCounts).reduce((a, b) => a + b, 0);
    const activeDays = Object.keys(dayCounts).length;
    const maxDay = Math.max(0, ...Object.values(dayCounts));
    return { total, activeDays, maxDay };
  }, [dayCounts]);

  const bestWeekday = useMemo(() => {
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    for (const session of sessions) {
      const dow = new Date(session.completedAt).getDay();
      weekdayCounts[dow]++;
    }
    const max = Math.max(...weekdayCounts);
    if (max === 0) return null;
    const idx = weekdayCounts.indexOf(max);
    return { day: WEEKDAY_LABELS[idx], count: max };
  }, [sessions]);

  const goToPrev = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };

  const goToNext = () => {
    const isCurrent = viewYear === now.getFullYear() && viewMonth === now.getMonth();
    if (isCurrent) return;
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const today = now.getDate();

  return (
    <div className="w-full max-w-md mx-auto py-8 px-4">
      {/* Header */}
      <h1 className="text-2xl font-light tracking-wide text-[#e8e8f0] mb-2">
        정원
      </h1>
      <p className="text-xs text-[#8888a0] mb-6">
        {getGrowthMessage(sessions.length)}
      </p>

      {/* Tree Visualization */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="mb-4"
      >
        <GardenTree
          count={sessions.length}
          fruitRipeness={fruitRipeness}
          selectedFruit={selectedFruit}
          onFruitTap={(i) => setSelectedFruit(selectedFruit === i ? null : i)}
        />
      </motion.div>

      {/* Selected fruit detail (session) */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="card-glass rounded-xl p-4 mb-4 cursor-pointer"
            onClick={() => setSelectedFruit(null)}
          >
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                fruitRipeness[selectedFruit!] ? "bg-[#a78bfa]" : "bg-[#a78bfa]/40"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#e8e8f0] leading-relaxed mb-1">
                  {selectedSession.taskTitle}
                </p>
                <div className="flex items-center gap-2 text-xs text-[#66667a]">
                  <span>{new Date(selectedSession.completedAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}</span>
                  <span>·</span>
                  <span>{selectedSession.timerMinutes}분</span>
                  <span>·</span>
                  <span className={
                    selectedSession.closeType === "완료" ? "text-[#a78bfa]" :
                    selectedSession.closeType === "보류" ? "text-[#FFD166]" :
                    "text-[#8888a0]"
                  }>
                    {selectedSession.closeType}
                  </span>
                  {fruitRipeness[selectedFruit!] && (
                    <span className="text-[#a78bfa]">목표 완성</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Counter under tree */}
      <div className="flex flex-col items-center mb-10">
        <span className="text-3xl font-extralight text-[#a78bfa]/30 tabular-nums">
          {sessions.length}
        </span>
        <span className="text-xs tracking-[0.3em] text-[#66667a] mt-1">
          번의 닫힘
        </span>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={goToPrev}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8888a0] hover:text-[#9898a8] transition-colors cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="text-sm text-[#e8e8f0] tracking-wider">
          {viewYear}년 {MONTH_LABELS[viewMonth]}
        </span>
        <button
          onClick={goToNext}
          disabled={isCurrentMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8888a0] hover:text-[#9898a8] transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Calendar heatmap */}
      <motion.div
        key={`${viewYear}-${viewMonth}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="card-glass rounded-2xl p-5 mb-6"
      >
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="text-center text-xs text-[#66667a] tracking-wider">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {grid.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />;

            const count = dayCounts[day] || 0;
            const isToday = isCurrentMonth && day === today;
            const isFuture = isCurrentMonth && day > today;

            return (
              <div
                key={day}
                className={[
                  "aspect-square rounded-md flex items-center justify-center relative transition-all duration-300",
                  isFuture ? "bg-transparent" : getIntensity(count),
                  isToday ? "ring-1 ring-[#a78bfa]/40" : "",
                ].join(" ")}
              >
                <span className={[
                  "text-xs tabular-nums",
                  isFuture ? "text-[#66667a]/30" : count > 0 ? "text-[#e8e8f0]/80" : "text-[#66667a]/60",
                ].join(" ")}>
                  {day}
                </span>
                {count > 1 && !isFuture && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#a78bfa] text-[6px] text-white flex items-center justify-center font-medium">
                    {count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Month stats */}
      {monthStats.total > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card-glass rounded-xl p-3 text-center">
            <p className="text-lg font-extralight text-[#e8e8f0] tabular-nums">{monthStats.total}</p>
            <p className="text-xs text-[#66667a] mt-0.5 tracking-wider">이번 달</p>
          </div>
          <div className="card-glass rounded-xl p-3 text-center">
            <p className="text-lg font-extralight text-[#a78bfa] tabular-nums">{monthStats.activeDays}</p>
            <p className="text-xs text-[#66667a] mt-0.5 tracking-wider">활동일</p>
          </div>
          <div className="card-glass rounded-xl p-3 text-center">
            <p className="text-lg font-extralight text-[#FFD166] tabular-nums">{monthStats.maxDay}</p>
            <p className="text-xs text-[#66667a] mt-0.5 tracking-wider">최고 기록</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <span className="text-xs text-[#66667a]">적음</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((level) => (
            <div key={level} className={`w-3 h-3 rounded-sm ${getIntensity(level)}`} />
          ))}
        </div>
        <span className="text-xs text-[#66667a]">많음</span>
      </div>

      {/* Best weekday */}
      {bestWeekday && (
        <div className="text-center">
          <p className="text-xs text-[#8888a0]">
            <span className="text-[#a78bfa]">{bestWeekday.day}요일</span>에 가장 많이 닫았습니다
          </p>
        </div>
      )}
    </div>
  );
}
