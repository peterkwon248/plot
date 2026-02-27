"use client";

import type { ItemStatus } from "@/types";

interface Props {
  status: ItemStatus;
  size?: number;
}

export function ItemStatusIcon({ status, size = 16 }: Props) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  switch (status) {
    // ─── Inbox: 빈 십자선 (좌표를 아직 안 찍은 상태) ───
    case "inbox":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className="shrink-0">
          {/* 중심 빈 원 */}
          <circle
            cx={cx} cy={cy} r={s * 0.13}
            fill="none"
            stroke="var(--color-status-inbox)"
            strokeWidth="1"
          />
          {/* 십자선 */}
          <line x1={cx} y1={s * 0.15} x2={cx} y2={s * 0.35}
            stroke="var(--color-status-inbox)" strokeWidth="1" />
          <line x1={cx} y1={s * 0.65} x2={cx} y2={s * 0.85}
            stroke="var(--color-status-inbox)" strokeWidth="1" />
          <line x1={s * 0.15} y1={cy} x2={s * 0.35} y2={cy}
            stroke="var(--color-status-inbox)" strokeWidth="1" />
          <line x1={s * 0.65} y1={cy} x2={s * 0.85} y2={cy}
            stroke="var(--color-status-inbox)" strokeWidth="1" />
        </svg>
      );

    // ─── Todo: 점이 찍힘 (좌표 확정, 아직 움직이지 않음) ───
    case "todo":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className="shrink-0">
          <circle
            cx={cx} cy={cy} r={s * 0.19}
            fill="var(--color-status-todo)"
          />
        </svg>
      );

    // ─── In Progress: 점 + 확산 링 (좌표에서 에너지 발산) ───
    case "in_progress":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className="shrink-0">
          {/* 외곽 확산 링 */}
          <circle
            cx={cx} cy={cy} r={s * 0.38}
            fill="none"
            stroke="var(--color-status-in-progress)"
            strokeWidth="1"
            opacity="0.35"
          />
          {/* 내부 채움 */}
          <circle
            cx={cx} cy={cy} r={s * 0.19}
            fill="var(--color-status-in-progress)"
          />
        </svg>
      );

    // ─── Done: 체크 (좌표 완성 — 조용히 물러남) ───
    case "done":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className="shrink-0">
          <path
            d={`M${s * 0.25} ${cy} L${s * 0.42} ${s * 0.63} L${s * 0.75} ${s * 0.33}`}
            fill="none"
            stroke="var(--color-status-done)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}
