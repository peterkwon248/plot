# Plot → Linear UI 리플리케이션 명세서

> **이 문서를 Claude Code에게 주고 "이 문서 따라 해"라고 하면 됨.**
> Circle 레포(`../circle/`)를 UI 레퍼런스로 참고.

---

## 0. 프로젝트 컨텍스트

### 스택
- Next.js 15, React 19, TypeScript, Zustand 5, TipTap, Tailwind 4
- shadcn/ui (Radix 기반 프리미티브), cmdk (커맨드바), dnd-kit (드래그앤드롭)
- Supabase (선택적 동기화), localStorage (기본)
- Pretendard 폰트, 다크 테마 전용

### 디자인 토큰 (globals.css @theme)
```
Background: bg-primary(#0A0D0F) bg-secondary(#0E1215) bg-surface(#141A1E) bg-elevated(#1C2428)
Border:     border-default(#1E2A30) border-subtle(#151D22) border-focus(#22D3EE)
Text:       text-primary(#E8E8E8) text-secondary(#8A8A8A) text-tertiary(#555555) text-disabled(#3A3A3A)
Accent:     accent(#22D3EE) accent-hover(#34E0F8) accent-muted(rgba(34,211,238,0.12))
Status:     inbox(#555555) todo(#D4D4D8) in-progress(#22D3EE) done(#52525B)
Priority:   urgent(#EB5757) high(#F2994A) medium(#F2C94C) low(#8A8A8A)
```

### 폰트 사이즈 체계
```
11px / 16px — 캡션, 타임스탬프, 섹션 라벨 (tracking 0.01~0.04em)
12px / 16px — 탭, 카운트, 뱃지 (font-medium)
13px / 20px — 본문, 메뉴 아이템, 속성 라벨 (기본)
14px / 20px — 서브헤딩, 사이드바 제목 (font-semibold, tracking -0.006em)
24px / 32px — 디테일 타이틀 (font-semibold, tracking -0.02em)
```

### 절대 수정 금지 파일
- `stores/` 전체
- `types/index.ts`
- `hooks/useSupabaseSync.ts`, `hooks/useKeyboardNavigation.ts`, `hooks/use-mobile.ts`
- `lib/supabase/`
- `components/ui/sidebar-primitives.tsx` (Sidebar 기반 컴포넌트)
- `components/ui/command.tsx` (CommandBar 기반 컴포넌트)

### Circle 레퍼런스 경로 (../circle/)
```
사이드바:     components/layout/sidebar/app-sidebar.tsx
              components/layout/sidebar/org-switcher.tsx
              components/layout/sidebar/nav-inbox.tsx
              components/layout/sidebar/nav-workspace.tsx
              components/layout/sidebar/nav-teams.tsx
              mock-data/side-bar-nav.ts
메인 레이아웃: components/layout/main-layout.tsx
헤더/필터:    components/layout/headers/issues/header.tsx
              components/layout/headers/issues/header-nav.tsx
              components/layout/headers/issues/header-options.tsx
              components/layout/headers/issues/filter.tsx
이슈 행:      components/common/issues/issue-line.tsx
              components/common/issues/group-issues.tsx
              components/common/issues/status-selector.tsx
              components/common/issues/priority-selector.tsx
상태 아이콘:   mock-data/status.tsx (SVG 원형 progress 아이콘)
우선순위:      mock-data/priorities.tsx
```

---

## 1. Phase별 실행 명세

### Phase 1: 사이드바 스타일 조정

**수정 파일:** `components/layout/Sidebar.tsx`, `components/layout/SidebarItem.tsx`

**Circle 참고:**
- `../circle/components/layout/sidebar/app-sidebar.tsx` — 전체 구조
- `../circle/components/layout/sidebar/org-switcher.tsx` — 상단 워크스페이스 영역
- `../circle/components/layout/sidebar/nav-inbox.tsx` — Inbox/My issues 네비
- `../circle/components/layout/sidebar/nav-workspace.tsx` — Workspace 섹션
- `../circle/components/layout/sidebar/nav-teams.tsx` — Teams 섹션 (Collapsible)
- `../circle/mock-data/side-bar-nav.ts` — 아이콘 매핑 데이터

**현재 상태:** shadcn sidebar-primitives 기반으로 이미 마이그레이션됨 (624줄).
- `SidebarPrimitive`, `SidebarHeader`, `SidebarContent`, `SidebarFooter` 사용 중
- Collapsible + DropdownMenu로 Hub 섹션 구현됨
- ViewIcon 커스텀 SVG 아이콘 사용 중
- "워크스페이스" 섹션에 커스텀 뷰 + "더보기" 드롭다운 배치됨

**목표:** 기존 shadcn sidebar 구조를 유지하면서 Linear 스타일에 더 가깝게 조정

**수정 범위 (스타일만):**
1. 상단 헤더: 높이 44px(h-11). 좌측 "✦ Plot" (accent 색상 spark + 14px semibold). 우측 ⌘K 버튼 + "+" 새 항목 버튼 — 현재 구현과 거의 동일, 미세 조정만
2. 네비 아이콘: 현재 ViewIcon 유지하되 Linear 스타일 아이콘으로 교체 가능
3. 메뉴 아이템 스타일: SidebarMenuButton의 기본 스타일 조정 (h-7, px-2.5, gap-2, 13px)
4. 섹션 라벨: SidebarGroupLabel 스타일 — 11px uppercase tracking-[0.04em] text-tertiary
5. hover/active 스타일: `hover:bg-bg-surface`, active `bg-accent-muted text-accent`
6. 하단 Footer: 현재 설정 버튼 유지

**주의:** `SidebarPrimitive`, `SidebarMenuButton` 등 sidebar-primitives 컴포넌트 자체는 수정 금지. className prop으로만 스타일 조정.

**기존 로직 유지:**
- `useViewStore`의 `currentView`, `setView`, `toggleCommandBar`, `setCustomView` 호출 그대로
- `useItemStore`의 `getByStatus` 카운트 로직 그대로
- Hub Collapsible 구조 + DropdownMenu 로직 그대로
- CustomViewEditor 모달 연동 그대로

---

### Phase 2: 메인 레이아웃 셸

**수정 파일:** `app/(main)/layout.tsx`

**Circle 참고:**
- `../circle/components/layout/main-layout.tsx` — 사이드바 + 메인 영역 구조

**현재 상태:** `SidebarProvider`로 전체 래핑. `<main className="flex-1 flex overflow-hidden relative">` 안에 children + DetailPanel.
```tsx
<SidebarProvider>
  <Sidebar />
  <main className="flex-1 flex overflow-hidden relative">
    {children}
    <DetailPanel />
  </main>
  <CommandBar />
  <HubAssignOverlay />
  <ShortcutHelpModal />
  {isSettingsOpen && <SettingsPanel />}
  <OnboardingGuide />
  <Toaster />
</SidebarProvider>
```

**목표:** Circle처럼 메인 영역에 border+rounded 컨테이너 추가

```
┌─────────┬──────────────────────────────┐
│         │ ┌──────────────────────────┐ │
│ Sidebar │ │  rounded-md border       │ │
│         │ │  ┌────────────────────┐  │ │
│         │ │  │ Header (nav+opts)  │  │ │
│         │ │  ├────────────────────┤  │ │
│         │ │  │ Content (scroll)   │  │ │
│         │ │  └────────────────────┘  │ │
│         │ └──────────────────────────┘ │
└─────────┴──────────────────────────────┘
```

**구현:**
```tsx
// SidebarProvider 유지, main 내부에 라운드 컨테이너 추가
<SidebarProvider>
  <Sidebar />
  <main className="flex-1 flex overflow-hidden p-2">
    <div className="flex-1 border border-border-default rounded-lg overflow-hidden flex flex-col bg-bg-primary relative">
      {children}
      <DetailPanel />
    </div>
  </main>
  <CommandBar />
  <HubAssignOverlay />
  <ShortcutHelpModal />
  {isSettingsOpen && <SettingsPanel />}
  <OnboardingGuide />
  <Toaster />
</SidebarProvider>
```

**기존 로직 유지:** 모든 훅 호출, 오버레이 렌더링 동일. SidebarProvider 래핑 유지.

---

### Phase 3: 리스트 헤더 + 탭바

**수정 파일:** `components/items/ItemList.tsx` (헤더 영역만)

**Circle 참고:**
- `../circle/components/layout/headers/issues/header.tsx` — 2단 헤더 구조
- `../circle/components/layout/headers/issues/header-nav.tsx` — 상단 네비바
- `../circle/components/layout/headers/issues/header-options.tsx` — 하단 필터/디스플레이 바

**현재 상태:** 이미 2단 구조 구현됨
- Title Row (h-11): 뷰명 + FilterDropdown + DisplayDropdown
- Tab Bar: pill 스타일 탭 (bg-bg-elevated, rounded)
- FilterDropdown/DisplayDropdown 컴포넌트는 `components/ui/`에 이미 존재

**목표 레이아웃:**
```
┌──────────────────────────────────────────┐
│ 메모                    🔍  🔔           │  ← 네비바 (h-10, border-b) — 검색 아이콘 추가
├──────────────────────────────────────────┤
│ Filter ▾              Display ▾          │  ← 옵션바 (h-10, border-b) — 기존 드롭다운 재배치
├──────────────────────────────────────────┤
│ 전체  할일  진행중  완료                   │  ← 탭바 (스타일만 개선)
└──────────────────────────────────────────┘
```

**구현 디테일:**

**네비바 (리팩토링):**
- 기존 Title Row를 네비바로 개선
- 좌측: 뷰 타이틀 (14px semibold text-primary)
- 우측: 검색 아이콘 (lucide `Search`, 28px 버튼) + FilterDropdown + DisplayDropdown 재배치

**옵션바 (선택적 — 필터 활성화 시만):**
- FilterDropdown/DisplayDropdown을 별도 행으로 분리할 수도 있음
- 높이: h-10, border-b border-border-default

**탭바 개선 (TabButton 컴포넌트):**
- 현재: pill 스타일 (`rounded bg-bg-elevated`)
- 목표: Linear 스타일 밑줄 탭
- 활성 탭: text-primary + border-b-2 border-accent
- 비활성 탭: text-tertiary hover:text-secondary
- 탭바 영역: px-6 h-10 flex items-center gap-4

**기존 로직 유지:**
- 모든 상태(activeTab, collapsedGroups 등)
- DnD, 정렬, 필터링 로직 전부
- GroupHeader, EmptyState, renderItems 등
- FilterDropdown, DisplayDropdown 컴포넌트 자체는 수정하지 않음 (배치만 변경)

---

### Phase 4: 이슈 행 (ItemRow)

**수정 파일:** `components/items/ItemRow.tsx`

**Circle 참고:**
- `../circle/components/common/issues/issue-line.tsx` — 핵심 레퍼런스
- `../circle/components/common/issues/status-selector.tsx` — 상태 아이콘 셀렉터
- `../circle/components/common/issues/priority-selector.tsx` — 우선순위 셀렉터

**현재 ItemRow 구조:**
```
[3-dot hover] [drag-handle?] [상태아이콘] [ID?] [제목+프리뷰] ── [허브뱃지] [우선순위바] [마감일] [수정일]
```
- ItemContextMenu으로 래핑됨 (우클릭 메뉴)
- showProperties 설정으로 id/priority/hub/date/preview 표시 토글 가능
- DueDateLabel 컴포넌트 (마감일 표시, 색상 분기)
- PriorityBarIcon 컴포넌트 (바 형태 아이콘)
- HubLabel 컴포넌트 (컬러 dot + 이름)

**목표 레이아웃 (Circle의 issue-line과 동일):**
```
[우선순위] [식별자] [상태아이콘] [제목] ──── [허브뱃지] [날짜] [아바타]
```

**구현 디테일:**
1. 행 높이: h-11 (44px). 좌우 패딩 px-6
2. hover: `hover:bg-bg-surface/50`
3. 좌측 그룹 (flex items-center gap-0.5):
   - 우선순위 아이콘 (PriorityBarIcon 기존 사용, subtle 14px)
   - 식별자 텍스트 (text-tertiary 12px font-medium, w-[60px] truncate) — item.id.slice(0, 6).toUpperCase()
   - 상태 아이콘 (기존 ItemStatusIcon 사용, 14px)
4. 제목 (flex-1, truncate):
   - text-sm(13px) font-medium, text-primary
   - 좌측 ml-1
5. 우측 그룹 (flex items-center gap-2 ml-auto):
   - Hub 뱃지: 기존 HubLabel 컴포넌트 사용
   - 날짜: 기존 DueDateLabel + timeAgo 로직 유지
   - 아바타 영역: 작은 원(20px) bg-bg-elevated (개인용이라 빈 원)

**기존 로직 유지:**
- 클릭 → `selectItem(item.id)` 호출
- ItemContextMenu 래핑 유지
- 포커스 상태 (`isFocused` prop, `data-focused` attribute)
- DnD (`isDraggable` prop, `useSortable`) — SortableItemRow 구조 유지
- 선택/포커스 스타일 (isSelected, isFocused)
- showProperties 설정 기반 조건부 렌더링

---

### Phase 5: 그룹 헤더

**수정 파일:** `components/items/ItemList.tsx` 내 `GroupHeader` 컴포넌트

**Circle 참고:**
- `../circle/components/common/issues/group-issues.tsx` — 그룹 헤더 + collapse

**현재 GroupHeader:** button + 화살표(12px SVG) + ItemStatusIcon + 라벨 + 카운트 + hover시 + 버튼. 별도 배경 없음.

**목표:**
```
[▸] [상태아이콘] In Progress  3                          [+]
     ↑ 배경에 상태 색상 tint (status.color + 08 opacity)
```

**구현 디테일:**
1. 높이: h-10 (40px), px-6
2. 배경: `backgroundColor: ${statusColor}08` — Circle의 group-issues 패턴 참고
3. sticky top-0 z-10 (스크롤 시 고정)
4. Collapse 화살표: 12px, transition-transform rotate-90 (기존 로직 유지)
5. 상태 아이콘: 기존 ItemStatusIcon 사용
6. 라벨: 13px font-medium text-primary
7. 카운트: 13px text-muted-foreground
8. "+" 버튼: 우측, hover시에만 표시 (opacity-0 group-hover:opacity-100) — 현재 동일

**기존 로직 유지:** toggleGroup, collapsedGroups, grid collapse 애니메이션

---

### Phase 6: 디테일 패널

**수정 파일:** `components/layout/DetailPanel.tsx`

**현재 상태:**
- `absolute inset-0 z-30 bg-bg-primary` — 전체 화면 덮는 방식
- `detailPanelIn` 애니메이션 사용 (globals.css에 이미 정의됨)
- 상단 바: h-12, 뒤로 + breadcrumb + 카운터 + prev/next 버튼
- 2-column: 본문(TipTapEditor) 좌측 + 속성(status/priority/hub/date/tags/chain/activity) 우측

**목표:** 우측 슬라이드 패널 (60% 너비)

**구현:**
```tsx
// 변경 전
<div className="absolute inset-0 z-30 bg-bg-primary flex flex-col"
     style={{ animation: "detailPanelIn 150ms ease forwards" }}>

// 변경 후
<div className="absolute right-0 top-0 bottom-0 w-[60%] z-30 bg-bg-primary
     border-l border-border-default flex flex-col shadow-2xl"
     style={{ animation: "detailSlideIn 200ms ease forwards" }}>
```

**globals.css에 추가 (기존 detailPanelIn과 별도):**
```css
@keyframes detailSlideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```
> 기존 `detailPanelIn` (translateX(8px) 기반)은 유지해도 됨. 충돌 없음.

**상단 바 개선:**
- 높이: h-12 (48px), border-b — 현재와 동일
- 좌측: ← 뒤로 버튼 + 뷰명(text-secondary) + ">" + 아이템 타이틀(text-primary truncate) — 현재 동일
- 우측: 카운터(1/5) + ◀ ▶ 이전/다음 버튼 — 현재 동일

**나머지:** 기존 2-column 레이아웃(본문 좌측 + 속성 우측) 유지. 삭제 버튼, TipTapEditor, ChainSection, ActivityTimeline 등 모두 유지.

---

### Phase 7: 커맨드바 (⌘K)

**수정 파일:** `components/command-bar/CommandBar.tsx`

**현재 상태:** cmdk + Dialog 기반. 이미 shadcn command 컴포넌트 사용 중.
- Dialog으로 래핑, CommandInput + CommandList + CommandGroup + CommandItem 사용
- 최근 항목, 검색 결과, 새 항목 생성, 네비게이션 등 구현됨

**목표:** Linear 스타일 커맨드 팔레트 — 스타일만 개선

**수정 범위 (스타일만):**
1. DialogContent: 상단 중앙, `max-w-[560px] top-[20%]` — 현재와 유사
2. 검색 인풋: 상단, 높이 48px, 좌측 🔍 아이콘 — CommandInput 스타일 조정
3. 결과 리스트: 각 항목 h-10, 상태아이콘 + 타이틀 — CommandItem 스타일 조정
4. 하단: 키보드 힌트 (↑↓ 이동, Enter 선택, Esc 닫기) — text-xs text-tertiary 추가

**기존 로직 유지:**
- Dialog open/close 로직, cmdk shouldFilter, 모든 핸들러
- command.tsx 수정 금지 — CommandBar.tsx의 className만 조정

---

### Phase 8: 상태 아이콘 SVG 업그레이드

**수정 파일:** `components/items/ItemStatusIcon.tsx`

**Circle 참고:**
- `../circle/mock-data/status.tsx` — Linear 정확한 SVG 아이콘들

**현재 상태:** 커스텀 SVG (십자선/점/링/체크) — 사이즈 prop 기반 동적 계산

**목표:** Circle/Linear의 정확한 상태 아이콘으로 교체
- **inbox(Backlog):** 점선 원 (strokeDasharray="1.4 1.74"), 색상 #555
- **todo:** 빈 원 (실선), 색상 #D4D4D8
- **in_progress:** 반쪽 채워진 원 (progress circle), 색상 #22D3EE(accent)
- **done:** 원 + 체크마크, 색상 #52525B

각 아이콘은 14x14 viewBox, strokeWidth 2. 기존 size prop 호환 유지.

---

## 2. 수정하지 않는 컴포넌트 목록

아래는 Phase 작업 중 건드리지 않는 컴포넌트들:
- `components/detail/ActivityTimeline.tsx` — 활동 타임라인
- `components/detail/ChainLinkPicker.tsx` — Chain 선택기
- `components/detail/ChainSection.tsx` — Chain 섹션
- `components/editor/TipTapEditor.tsx` — 에디터
- `components/items/BoardView.tsx` / `BoardCard.tsx` — 보드 뷰 (별도 Phase 예정)
- `components/settings/SettingsPanel.tsx` — 설정
- `components/views/CustomViewEditor.tsx` — 뷰 에디터
- `components/ui/` 내 shadcn 프리미티브 전체

---

## 3. 실행 순서 & 규칙

### 실행 순서
```
Phase 1 (사이드바 스타일) → Phase 2 (메인 레이아웃) → Phase 3 (리스트 헤더)
→ Phase 4 (이슈 행) → Phase 5 (그룹 헤더) → Phase 6 (디테일 패널)
→ Phase 7 (커맨드바) → Phase 8 (상태 아이콘)
```

### 매 Phase 규칙
1. **시작 전:** 수정 대상 파일을 반드시 읽어라
2. **참고:** Circle 레포의 해당 컴포넌트를 반드시 읽어라
3. **수정 범위:** JSX 구조 + Tailwind 클래스만. 상태 관리 로직 건드리지 마
4. **수정 후:** `npm run dev`로 빌드 확인
5. **완료 후:** 변경 내용 요약 보고하고 멈춰라. 다음 Phase는 내가 시작한다

### 절대 금지
- stores/ 파일 수정
- types/ 파일 수정
- hooks/ 파일 수정
- components/ui/sidebar-primitives.tsx 수정
- components/ui/command.tsx 수정
- 새 npm 패키지 설치
- 한 Phase에서 3개 이상 파일 수정
- 기존에 동작하는 onClick, onChange, onDragEnd 등 핸들러 수정

---

## 4. Claude Code 시작 명령

```
docs/linear-ui-spec.md를 읽고,
../circle/ 레포를 UI 레퍼런스로 참고해서,
Phase 1부터 순서대로 실행해.
한 Phase 끝날 때마다 멈추고 보고해.
```

또는 특정 Phase만:
```
docs/linear-ui-spec.md의 Phase 3만 실행해.
../circle/components/layout/headers/issues/ 를 참고해.
```
