# Plot — Personal Linear-style Note + Todo App

## 핵심 원칙
- Linear의 UI/UX를 최대한 충실히 재현한다
- 기존 동작하는 기능(CRUD, 스토어, Supabase 동기화)은 절대 건드리지 않는다
- 컴포넌트 하나씩 수정한다. 한 번에 여러 파일을 바꾸지 않는다
- 수정 전에 반드시 현재 파일을 읽고, 기존 구조를 유지하면서 개선한다

## 스택
- Next.js 15, React 19, TypeScript, Zustand 5, TipTap, Tailwind 4
- Supabase (선택적 동기화), localStorage (기본)
- Pretendard 폰트, 다크 테마 전용
- shadcn/ui (Radix 기반 프리미티브), cmdk (커맨드바), dnd-kit (드래그앤드롭)

## 프로젝트 구조
```
app/
  (main)/layout.tsx     — SidebarProvider로 래핑된 메인 레이아웃
  (main)/page.tsx       — ItemList 렌더링
  (auth)/login/page.tsx — 로그인
  globals.css           — 디자인 토큰 + 애니메이션 정의

components/
  layout/               — Sidebar(shadcn sidebar-primitives 기반), DetailPanel,
                          HubSection, HubHeader, SidebarItem
  items/                — ItemList, ItemRow, ItemStatusIcon, BoardView, BoardCard
  detail/               — ActivityTimeline, ChainLinkPicker, ChainSection
  editor/               — TipTapEditor
  command-bar/          — CommandBar (cmdk + Dialog 기반)
  settings/             — SettingsPanel
  views/                — CustomViewEditor
  ui/                   — shadcn 프리미티브 + 커스텀 UI
                          (FilterDropdown, DisplayDropdown, StatusDropdown,
                           PriorityDropdown, HubDropdown, HubAssignOverlay,
                           DatePicker, TagEditor, ContextMenu,
                           OnboardingGuide, ShortcutHelpModal,
                           sidebar-primitives 등)

stores/                 — Zustand 스토어 (수정 금지)
hooks/                  — 커스텀 훅 (수정 금지)
types/                  — 타입 정의 (수정 금지)
lib/supabase/           — Supabase 클라이언트 (수정 금지)
```

## 디자인 토큰
- globals.css의 @theme 변수를 반드시 사용할 것
- 하드코딩된 색상 금지. bg-bg-primary, text-text-secondary 등 토큰 클래스 사용
- 폰트 사이즈: 11px(캡션) / 12px(라벨) / 13px(본문) / 14px(서브헤딩) / 24px(타이틀)

## 참고 레포
- Linear UI 클론: ../circle/ (https://github.com/ln-dev7/circle)
- 파일 수정 시 circle 레포의 같은 역할 컴포넌트를 반드시 참고할 것

## 수정 금지
- `stores/` 폴더 전체
- `types/index.ts`
- `hooks/` 폴더 전체 (useSupabaseSync.ts, useKeyboardNavigation.ts, use-mobile.ts)
- `lib/supabase/` 폴더
- `components/ui/sidebar-primitives.tsx` (Sidebar 전체가 이 위에 동작)
- `components/ui/command.tsx` (CommandBar 기반 컴포넌트)
- 새 npm 패키지 추가 (꼭 필요하면 먼저 물어볼 것)

## 현재 레이아웃 구조
```
SidebarProvider
├── Sidebar (sidebar-primitives 기반, SidebarHeader/Content/Footer)
├── main.flex-1
│   ├── ItemList (children via page.tsx)
│   └── DetailPanel (absolute inset-0 z-30)
├── CommandBar (Dialog + cmdk)
├── HubAssignOverlay
├── ShortcutHelpModal
├── SettingsPanel (조건부)
├── OnboardingGuide
└── Toaster
```

## 용어 매핑 (Plot ↔ Linear)
- Item = Issue
- Hub = Project/Team
- inbox/todo/in_progress/done = Backlog/Todo/In Progress/Done
- active (ViewType) = My Issues (진행 중인 항목 필터)
- Chain = Relation
- CommandBar = Command Palette (⌘K)
- CustomView = Saved Filter/View

## UI 명세
- 구조 명세 (Phase 1~8): docs/linear-ui-spec.md
- 폴리시 명세 (Phase 9~12): docs/linear-ui-spec-polish.md
