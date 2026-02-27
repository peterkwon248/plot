import type { ItemStatus } from "@/types";

interface Props {
  status: ItemStatus;
  size?: number;
}

export function ItemStatusIcon({ status, size = 16 }: Props) {
  const s = size;
  const cx = s / 2;
  const r = s / 2 - 2;

  switch (status) {
    case "inbox":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke="#8A8A8A"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />
        </svg>
      );
    case "todo":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke="#E8E8E8"
            strokeWidth="1.5"
          />
        </svg>
      );
    case "in_progress":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke="#F2C94C"
            strokeWidth="1.5"
          />
          <path
            d={`M${cx} ${cx - r}A${r} ${r} 0 0 1 ${cx} ${cx + r}`}
            fill="#F2C94C"
          />
        </svg>
      );
    case "done":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <circle cx={cx} cy={cx} r={r} fill="#5E6AD2" />
          <path
            d={`M${cx - 3} ${cx}L${cx - 1} ${cx + 2}L${cx + 3} ${cx - 2}`}
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}
