# Plot → Linear UI 폴리시 명세서 (Phase 9~12)

Phase 1~8 완료 후 폴리시 작업. 기존 linear-ui-spec.md에 이어서 사용. 모든 Phase의 규칙(수정 금지 파일, 로직 미변경 등)은 동일하게 적용.

## Phase 9: 디테일 패널 슬라이드 + 레이아웃

수정 파일: `components/layout/DetailPanel.tsx`, `app/globals.css`

### 현재 문제점
- absolute inset-0 z-30 — 메인 영역 전체를 덮어서 리스트가 완전히 가려짐
- detailPanelIn 애니메이션이 translateX(8px)만 — 슬라이드 느낌 약함
- 닫을 때 애니메이션 없음 (즉시 사라짐)
- 속성 패널(w-[280px])이 좁아서 드롭다운이 잘림

### 목표
Linear처럼 우측에서 슬라이드 인, 리스트와 나란히 공존

### 9-A: 패널 컨테이너 변경
```tsx
// 변경 전 (DetailPanel.tsx:117)
<div className="absolute inset-0 z-30 bg-bg-primary flex flex-col"
     style={{ animation: "detailPanelIn 150ms ease forwards" }}>

// 변경 후
<div className="absolute right-0 top-0 bottom-0 w-[62%] min-w-[480px] z-30
     bg-bg-primary border-l border-border-default flex flex-col shadow-2xl"
     style={{ animation: "detailSlideIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
```

### 9-B: globals.css 애니메이션 추가
```css
/* 기존 detailPanelIn 유지 (다른 곳에서 쓸 수 있음), 새로 추가 */
@keyframes detailSlideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

### 9-C: 상단 바 개선
```tsx
// 상단 바 — 현재 h-12 px-6 유지
// 좌측 breadcrumb: 간격 개선
<div className="flex items-center gap-1.5"> {/* gap-2 → gap-1.5 */}
  {/* 뒤로 버튼: 크기 키움 */}
  <button className="p-1.5 -ml-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors">
    {/* 기존 SVG 유지 */}
  </button>
  <span className="text-[12px] text-text-tertiary">{viewLabels[currentView]}</span>
  <svg width="12" height="12" viewBox="0 0 12 12" className="text-text-disabled">
    <path d="M4.5 2.5L7.5 6L4.5 9.5" fill="none" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
  <span className="text-[13px] text-text-primary font-medium truncate max-w-[240px]">
    {item.title}
  </span>
</div>
```

### 9-D: 2-column 레이아웃 조정
```tsx
// 본문 영역 — 패딩 축소, max-width 조정
<div className="flex-1 overflow-y-auto px-10 py-6"> {/* px-16→px-10, py-8→py-6 */}

// 타이틀 — mb 축소
<h1 className="text-[24px] leading-[32px] tracking-[-0.02em] font-semibold mb-4 ..."> {/* mb-8→mb-4 */}

// 속성 패널 — 폭 확대
<div className="w-[260px] shrink-0 border-l border-border-default overflow-y-auto p-5"> {/* w-280→260, p-6→p-5 */}
```

### 9-E: PropertyRow 개선
```tsx
function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center h-9 hover:bg-bg-surface/50 -mx-2 px-2 rounded-md transition-colors">
      <span className="text-[13px] leading-[20px] text-text-tertiary w-[72px] shrink-0">
        {label}
      </span>
      <div className="flex-1 flex items-center min-w-0">
        {children}
      </div>
    </div>
  );
}
```

### 기존 로직 유지
- 모든 상태 관리 (editingTitle, saveTitle 등)
- StatusDropdown, PriorityDropdown, HubDropdown, DatePicker, TagEditor 호출
- ChainSection, ActivityTimeline 렌더링
- goToPrev, goToNext, handleDelete
- TipTapEditor key={item.id} + onChange

---

## Phase 10: 사이드바 디자인 디테일

수정 파일: `components/layout/Sidebar.tsx` (스타일만)

### 현재 문제점
- 메인 네비(메모/진행/전체/완료) 아이콘이 Linear 대비 너무 추상적
- 워크스페이스 섹션과 프로젝트 섹션 사이 시각적 구분 약함
- SidebarHeader 높이(h-12)가 메인 영역 헤더(h-11)와 안 맞음
- 프로젝트(Hub) 항목의 컬러 dot이 작고 임팩트 부족
- 하단 설정 영역에 Notion "N" 아이콘이 보임 (버그 가능성)

### 10-A: 헤더 높이 + 스타일
```tsx
// h-12 → h-11로 통일 (메인 영역 헤더와 높이 맞춤)
<SidebarHeader className="h-11 flex-row items-center justify-between px-3 gap-2">
  <span className="text-[14px] leading-[20px] tracking-[-0.006em] font-semibold text-text-primary flex items-center gap-2">
    <span className="text-accent text-[18px] leading-none">✦</span>
    Plot
  </span>
</SidebarHeader>
```

### 10-B: 네비 아이콘 교체 (ViewIcon)
```tsx
// inbox → Linear의 Inbox 트레이 아이콘
case "inbox":
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0"
         fill="none" stroke={color || "var(--color-text-secondary)"} strokeWidth="1.5"
         strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8.5h3.5L7 10.5h2l1.5-2H14" />
      <path d="M3 4.5l-1 4v4.5a1 1 0 001 1h10a1 1 0 001-1V8.5l-1-4H3z" />
    </svg>
  );

// active → 원 + 반시계 화살표 (My Issues / In Progress 느낌)
case "active":
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0"
         fill="none" stroke={color || "var(--color-status-in-progress)"} strokeWidth="1.5">
      <circle cx="8" cy="8" r="5.5" strokeDasharray="17.3 17.3" strokeDashoffset="-4.3" />
      <circle cx="8" cy="8" r="2" fill={color || "var(--color-status-in-progress)"} stroke="none" />
    </svg>
  );

// all → 3줄 리스트 아이콘
case "all":
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0"
         fill="none" stroke={color || "var(--color-text-secondary)"} strokeWidth="1.5"
         strokeLinecap="round">
      <line x1="3" y1="4" x2="13" y2="4" />
      <line x1="3" y1="8" x2="13" y2="8" />
      <line x1="3" y1="12" x2="10" y2="12" />
    </svg>
  );

// done → 원 + 체크마크 (Linear Done 아이콘)
case "done":
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0">
      <circle cx="8" cy="8" r="6" fill="none"
              stroke={color || "var(--color-status-done)"} strokeWidth="1.5" />
      <path d="M5.5 8L7.2 9.7L10.5 6.3" fill="none"
            stroke={color || "var(--color-status-done)"} strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
```

### 10-C: 섹션 간격 + 구분선
```tsx
<SidebarSeparator className="my-2 opacity-50" />
```

### 10-D: 프로젝트(Hub) 항목 컬러 개선
```tsx
<div className="inline-flex size-5 items-center justify-center rounded shrink-0 text-[10px] font-bold"
     style={{
       backgroundColor: `${getHubColorHex(hub.color)}25`,
       color: getHubColorHex(hub.color),
     }}>
  {hub.name.charAt(0)}
</div>
```

### 10-E: 하단 Footer 정리
```tsx
<SidebarFooter className="border-t border-border-subtle p-2">
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton onClick={() => toggleSettings()} tooltip="설정">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
             stroke="currentColor" strokeWidth="1.2">
          <circle cx="8" cy="8" r="3" />
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" />
        </svg>
        <span>설정</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
</SidebarFooter>
```

### 기존 로직 유지
- 모든 스토어 호출, 이벤트 핸들러
- Hub Collapsible + DropdownMenu 구조
- CustomViewEditor 모달 연동
- sidebar-primitives 컴포넌트 자체 수정 금지

---

## Phase 11: ItemRow 폴리시

수정 파일: `components/items/ItemRow.tsx`

### 현재 문제점
- hover 시 3-dot 메뉴만 표시됨 — 인라인 상태 변경 없음
- ID 표시(item.id.slice(0,4))가 너무 짧고 font-mono가 아닌 경우 있음
- border-b + border-l 동시 사용이 시각적으로 복잡
- 좌우 패딩(px-4)이 헤더 영역(px-4)과 같아서 계층감 부족
- 선택/포커스 상태의 시각적 구분이 border-l 색상에만 의존

### 11-A: 행 레이아웃 재구성
```
현재:  [3-dot] [drag] [status] [ID] [title+preview] ─── [hub] [priority] [due] [updated]
목표:  [priority] [ID] [status] [title] ─────────── [hub] [due/updated] [hover:actions]
```

### 11-B: 선택/포커스 스타일 단순화
```
- border-l 제거 → 배경색만으로 구분
- isSelected: bg-accent-muted
- isFocused: bg-bg-surface/60
- hover: bg-bg-surface/40
- border-b 제거 → 행 사이 구분은 자연스러운 간격으로
```

### 11-C: 노트 프리뷰 제거 고려
- Linear은 이슈 행에 프리뷰를 보여주지 않음 (단일 행)

### 기존 로직 유지
- selectItem 클릭 핸들러
- ItemContextMenu 래핑
- SortableItemRow / useSortable 구조
- data-focused, data-item-row 어트리뷰트

---

## Phase 12: 전체 Spacing / 애니메이션 폴리시

수정 파일: `app/globals.css`, `components/items/ItemList.tsx` (GroupHeader), 기타 필요시 1~2개

### 12-A: globals.css 애니메이션 추가
```css
@keyframes toastSlideIn {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes listItemIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes detailSlideOut {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}
```

### 12-B: GroupHeader 스타일 개선
```tsx
function GroupHeader({ status, count, collapsed, onToggle }: {...}) {
  const statusColor = {
    inbox: "var(--color-status-inbox)",
    todo: "var(--color-status-todo)",
    in_progress: "var(--color-status-in-progress)",
    done: "var(--color-status-done)",
  }[status] || "var(--color-text-tertiary)";

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 h-10 px-6 text-left
                 sticky top-0 z-10 backdrop-blur-sm
                 hover:brightness-110 transition-all group"
      style={{ backgroundColor: `color-mix(in srgb, ${statusColor} 6%, var(--color-bg-primary))` }}
    >
      {/* 기존 화살표 + 아이콘 + 라벨 + 카운트 + "+" 버튼 동일 */}
    </button>
  );
}
```

### 12-C: 탭 바 spacing
```tsx
<div className="flex items-center gap-1 px-6 h-9 border-b border-border-subtle">
```

### 12-D: TabButton 밑줄 스타일
```tsx
function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative px-2 py-1.5 text-[12px] leading-[16px] font-medium transition-colors",
        active ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary"
      )}
    >
      {label}
      {active && (
        <div className="absolute bottom-0 left-1 right-1 h-[2px] bg-accent rounded-full" />
      )}
    </button>
  );
}
```

### 12-E: 스크롤바 + 선택 하이라이트
```css
::-webkit-scrollbar {
  width: 5px;
}
::-webkit-scrollbar-thumb {
  background: #1E2A30;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #2A3840;
}

:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.3);
  border-radius: 4px;
}
```

### 기존 로직 유지
- 모든 상태 관리, 핸들러
- GroupHeader의 toggleGroup, collapsedGroups
- TabButton의 activeTab, setActiveTab

---

## 실행 순서
Phase 9 (디테일 패널) → Phase 10 (사이드바) → Phase 11 (ItemRow) → Phase 12 (전체 폴리시)

## 매 Phase 규칙 (기존과 동일)
1. 시작 전 수정 대상 파일 읽기
2. Circle 레포 해당 컴포넌트 참고
3. JSX 구조 + Tailwind 클래스만 수정. 로직 건드리지 마
4. npm run dev로 빌드 확인
5. 완료 후 요약 보고 + 스크린샷 요청

## 절대 금지 (기존과 동일)
- stores/, types/, hooks/, lib/supabase/ 파일 수정
- sidebar-primitives.tsx, command.tsx 수정
- 새 npm 패키지 설치
- 한 Phase에서 3개 이상 파일 수정
- 기존 핸들러(onClick, onChange, onDragEnd 등) 수정
