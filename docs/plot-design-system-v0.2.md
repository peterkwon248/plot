# Plot Design System v0.2 — 구현 명세서

> **확정 방향**: Cool Cyan + 좌표 마커 아이콘 + ✦ 로고마크
> **기준 코드**: `app/globals.css`, `components/items/ItemStatusIcon.tsx`, `components/layout/SidebarItem.tsx`

---

## 1. 컬러 토큰 변경

### `app/globals.css` — @theme 블록 전체 교체

```css
@theme {
  /* ─── Background (미세한 cyan tint) ─── */
  --color-bg-primary: #0A0D0F;       /* was #0D0D0D — 순수 무채색에서 극미세 청록 */
  --color-bg-secondary: #0E1215;     /* was #141414 */
  --color-bg-surface: #141A1E;       /* was #1A1A1A */
  --color-bg-elevated: #1C2428;      /* was #222222 */

  /* ─── Border ─── */
  --color-border-default: #1E2A30;   /* was #2A2A2A — cyan tint */
  --color-border-subtle: #151D22;    /* was #1F1F1F */
  --color-border-focus: #22D3EE;     /* was #5E6AD2 */

  /* ─── Text (변경 없음 — 가독성 유지) ─── */
  --color-text-primary: #E8E8E8;
  --color-text-secondary: #8A8A8A;
  --color-text-tertiary: #555555;
  --color-text-disabled: #3A3A3A;

  /* ─── Accent ─── */
  --color-accent: #22D3EE;           /* was #5E6AD2 — LINEAR 보라 → PLOT 시안 */
  --color-accent-hover: #34E0F8;     /* was #6E7AE2 */
  --color-accent-muted: rgba(34, 211, 238, 0.12);  /* was rgba(94, 106, 210, 0.15) */

  /* ─── Status (아이콘 전용 — 아래 아이콘 섹션 참조) ─── */
  --color-status-inbox: #555555;     /* was #8A8A8A — 더 희미하게 */
  --color-status-todo: #D4D4D8;      /* was #E8E8E8 — 약간 톤다운 */
  --color-status-in-progress: #22D3EE;  /* was #F2C94C — 액센트와 통일 */
  --color-status-done: #52525B;      /* was #5E6AD2 — 완료는 조용히 물러남 */

  /* ─── Priority (유지 — 시맨틱 컬러와 충돌 없음) ─── */
  --color-priority-urgent: #EB5757;
  --color-priority-high: #F2994A;
  --color-priority-medium: #F2C94C;
  --color-priority-low: #8A8A8A;

  /* ─── Font (유지) ─── */
  --font-sans: "Pretendard Variable", Pretendard, -apple-system,
    BlinkMacSystemFont, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;

  /* ─── Spacing (유지) ─── */
  --spacing-sidebar: 220px;
  --spacing-detail: 420px;
}
```

### Body 배경 업데이트

```css
body {
  background: #0A0D0F;    /* was #0D0D0D */
  /* 나머지 동일 */
}
```

### Selection 색상

```css
::selection {
  background: rgba(34, 211, 238, 0.25);   /* was rgba(94, 106, 210, 0.3) */
  color: #E8E8E8;
}
```

### Focus

```css
:focus-visible {
  outline: 2px solid #22D3EE;   /* was #5E6AD2 */
  outline-offset: -2px;
  border-radius: 4px;
}
```

### Scrollbar

```css
::-webkit-scrollbar-thumb {
  background: #1E2A30;   /* was #2A2A2A — cyan tint */
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #2A3840;   /* was #3A3A3A */
}
```

---

## 2. 상태 아이콘 — 좌표 마커 시스템

### `components/items/ItemStatusIcon.tsx` — 전체 교체

```tsx
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
```

**디자인 의도**:
- Inbox: 십자 조준선. "아직 좌표를 안 찍었다." 가장 희미함.
- Todo: 점이 찍힘. "위치는 정했다." 밝은 도트.
- In Progress: 점 + 파동. "에너지가 발산 중." 액센트 시안.
- Done: 체크 하나. "끝." 가장 조용한 회색. 완료는 물러나야 함.

---

## 3. 사이드바 뷰 아이콘

### `components/layout/SidebarItem.tsx` — ViewIcon 함수 교체

```tsx
function ViewIcon({ viewType, active }: { viewType: ViewType; active: boolean }) {
  const color = active ? "var(--color-accent)" : undefined;

  switch (viewType) {
    // Inbox — 십자 조준선 (작게)
    case "inbox":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0">
          <circle cx="8" cy="8" r="2" fill="none"
            stroke={color || "var(--color-status-inbox)"} strokeWidth="1" />
          <line x1="8" y1="2" x2="8" y2="5"
            stroke={color || "var(--color-status-inbox)"} strokeWidth="1" />
          <line x1="8" y1="11" x2="8" y2="14"
            stroke={color || "var(--color-status-inbox)"} strokeWidth="1" />
          <line x1="2" y1="8" x2="5" y2="8"
            stroke={color || "var(--color-status-inbox)"} strokeWidth="1" />
          <line x1="11" y1="8" x2="14" y2="8"
            stroke={color || "var(--color-status-inbox)"} strokeWidth="1" />
        </svg>
      );

    // Active — 점 + 확산 링
    case "active":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0">
          <circle cx="8" cy="8" r="5.5" fill="none"
            stroke={color || "var(--color-status-in-progress)"} strokeWidth="1" opacity="0.35" />
          <circle cx="8" cy="8" r="2.5"
            fill={color || "var(--color-status-in-progress)"} />
        </svg>
      );

    // All — 3개 점 (다수의 좌표)
    case "all":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0">
          <circle cx="5" cy="8" r="1.8"
            fill={color || "var(--color-text-secondary)"} />
          <circle cx="8" cy="4.5" r="1.8"
            fill={color || "var(--color-text-secondary)"} opacity="0.6" />
          <circle cx="11" cy="8" r="1.8"
            fill={color || "var(--color-text-secondary)"} opacity="0.35" />
        </svg>
      );

    // Done — 체크
    case "done":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0">
          <path
            d="M4 8L7 11L12 5"
            fill="none"
            stroke={color || "var(--color-status-done)"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}
```

---

## 4. 로고 마크

### `components/layout/Sidebar.tsx` — 헤더 변경

```tsx
<span className="text-[14px] leading-[20px] tracking-[-0.006em] font-semibold text-text-primary">
  <span className="text-accent">✦</span> Plot
</span>
```

**변경사항**: `◆ Plot` → `✦ Plot` (✦에 액센트 컬러 적용)

---

## 5. 커맨드 바 터치업

### `components/command-bar/CommandBar.tsx`

**Placeholder 변경**:
```tsx
placeholder="Plot a thought..."
// was: "Type a command or search..."
```

**Backdrop blur 추가** (오버레이):
```tsx
<div
  className="absolute inset-0"
  style={{ background: "rgba(10, 13, 15, 0.6)", backdropFilter: "blur(12px)" }}
  onClick={() => toggleCommandBar(false)}
/>
// was: className="absolute inset-0 bg-black/60"
```

---

## 6. TipTap 에디터 색상 매핑

### `components/editor/TipTapEditor.tsx` — 스타일 업데이트

```css
/* 하이라이트 */
.tiptap-editor .tiptap mark {
  background: rgba(34, 211, 238, 0.2);   /* was rgba(94, 106, 210, 0.3) */
  border-radius: 2px;
}

/* 링크 */
.tiptap-editor .tiptap a {
  color: #22D3EE;                         /* was #5E6AD2 */
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* 체크박스 accent */
.tiptap-editor .tiptap ul[data-type="taskList"] li input[type="checkbox"] {
  margin-top: 4px;
  accent-color: #22D3EE;                  /* was #5E6AD2 */
}

/* 코드 블록 배경 — cyan tint */
.tiptap-editor .tiptap pre {
  background: #0E1215;                    /* was #1A1A1A */
  border: 1px solid #1E2A30;              /* was #2A2A2A */
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
}

/* 인라인 코드 */
.tiptap-editor .tiptap code {
  background: #1C2428;                    /* was #222222 */
  border-radius: 4px;
  padding: 2px 4px;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 12px;
}

/* 블록쿼트 */
.tiptap-editor .tiptap blockquote {
  border-left: 3px solid #1E2A30;         /* was #2A2A2A */
  padding-left: 12px;
  color: #8A8A8A;
  margin-bottom: 4px;
}
```

---

## 7. 행 밀도 조정 (선택적)

### `components/items/ItemRow.tsx`

현재 행 높이 약 44px → **52px**로 조정.

```tsx
// 변경: py-2 → py-3
className={cn(
  "w-full flex items-start gap-3 px-4 py-3 border-b border-border-subtle ...",
  // ...
)}
```

타임스탬프를 타이틀 우측이 아닌 **서브라인**으로 이동:

```tsx
{/* Content */}
<div className="flex-1 min-w-0">
  <span className={cn(
    "text-[15px] leading-[22px] tracking-[-0.01em] font-medium truncate block",
    isDone ? "text-text-secondary line-through" : "text-text-primary"
  )}>
    {item.title}
  </span>
  {/* 타임스탬프 서브라인 (note 프리뷰가 없을 때) */}
  {displayType === "task" && (
    <span className="text-[12px] leading-[16px] text-text-tertiary mt-0.5 block">
      {timeAgo(item.updated_at)}
    </span>
  )}
  {/* Note preview */}
  {displayType === "note" && item.body_plain && (
    <p className="text-[13px] leading-[20px] text-text-secondary mt-1 line-clamp-2">
      {item.body_plain}
    </p>
  )}
</div>
```

---

## 8. Empty State 아이콘

### `components/items/ItemList.tsx` — EmptyState 교체

```tsx
function EmptyState({ view }: { view: ViewType }) {
  const msg = emptyMessages[view];
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      {/* 좌표 마커 스타일 빈 상태 */}
      <svg width="48" height="48" viewBox="0 0 48 48" className="text-text-disabled">
        {/* 십자선 */}
        <line x1="24" y1="8" x2="24" y2="18"
          stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <line x1="24" y1="30" x2="24" y2="40"
          stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <line x1="8" y1="24" x2="18" y2="24"
          stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <line x1="30" y1="24" x2="40" y2="24"
          stroke="currentColor" strokeWidth="1" opacity="0.4" />
        {/* 중심 점선 원 */}
        <circle cx="24" cy="24" r="6"
          fill="none" stroke="currentColor" strokeWidth="1"
          strokeDasharray="3 3" opacity="0.3" />
      </svg>
      <div className="text-center">
        <p className="text-text-secondary text-[14px] leading-[20px] font-medium">
          {msg.title}
        </p>
        <p className="text-text-tertiary text-[12px] leading-[16px] mt-1">
          {msg.desc}
        </p>
      </div>
    </div>
  );
}
```

---

## 9. 배경 도트 그리드 (선택적 — Phase 1.5)

캔버스 모드나 Hub 뷰 배경에 적용할 수 있는 극미세 그리드:

```css
.plot-grid-bg {
  background-image: radial-gradient(
    circle,
    rgba(34, 211, 238, 0.06) 1px,
    transparent 1px
  );
  background-size: 24px 24px;
}
```

**적용 위치**: Hub 뷰 빈 상태, 캔버스 모드 배경. 일반 리스트 뷰에서는 사용하지 않음.

---

## 10. 변경 파일 체크리스트

| # | 파일 | 변경 내용 | 소요 |
|---|---|---|---|
| 1 | `app/globals.css` | 전체 컬러 토큰 교체 + 스크롤바 + 선택 + 포커스 | 15분 |
| 2 | `components/items/ItemStatusIcon.tsx` | 좌표 마커 아이콘으로 전체 교체 | 30분 |
| 3 | `components/layout/SidebarItem.tsx` | ViewIcon 함수 교체 | 20분 |
| 4 | `components/layout/Sidebar.tsx` | ◆ → ✦ + 액센트 컬러 | 2분 |
| 5 | `components/command-bar/CommandBar.tsx` | placeholder + backdrop-blur | 5분 |
| 6 | `components/editor/TipTapEditor.tsx` | 인라인 스타일 색상 매핑 | 10분 |
| 7 | `components/items/ItemRow.tsx` | 행 밀도 + 타임스탬프 서브라인 | 20분 |
| 8 | `components/items/ItemList.tsx` | EmptyState 아이콘 교체 | 10분 |
| 9 | `components/ui/StatusDropdown.tsx` | 상태 라벨은 유지, 아이콘만 자동 반영됨 | 0분 |
| 10 | `components/ui/PriorityDropdown.tsx` | 변경 없음 | 0분 |

**총 예상 소요: 약 2시간**

---

## 11. 시각적 정체성 요약

```
LINEAR                          PLOT
─────────────────────────────────────────────
#5E6AD2 보라                    #22D3EE 시안
원형 진행도                      좌표 마커
순수 무채색 배경                  cyan-tinted 배경
팀의 무기                        나만의 좌표계
수술실                           청사진/별자리 지도
모션 최소                        촉감 있는 마이크로 모션
```

---

*이 명세서의 모든 코드는 현재 레포 (2026-02-27) 기준이며, 파일 경로와 기존 코드를 정확히 참조합니다. 클로드 코드에 이 파일을 넘기면 바로 작업 가능합니다.*
