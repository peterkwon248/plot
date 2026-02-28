# Architectural Decisions — Plot

## 2026-02-27
- **Plot 컨셉 확정**: "개인을 위한 Linear" — 사람 간 협업 대신 노드 간 협업(체인). Zettelkasten + Todo.
- **UI 언어**: 전체 한국어. Inbox→메모, Active→진행, All→전체, Done→완료.
- **디자인 시스템**: Cool Cyan (#22D3EE) 액센트, #0A0D0F 배경, Pretendard 폰트.
- **DetailPanel 방식**: 420px 슬라이드인 패널 → 전체 페이지 오버레이 (리니어 이슈 상세 방식).
- **리소스 보고서**: cmdk, shadcn, kbar 등 도입 검토 중이나, 현재 자체 구현 유지. 내일 깊이 검증 후 결정.

## 2026-02-28
- **shadcn/ui 전면 도입 결정**: cmdk (CommandBar), Radix primitives (Dialog, DropdownMenu, ContextMenu, Popover, Select, Tooltip), sonner (toast)
- **sidebar-primitives**: circle 프로젝트 기반, cookie → localStorage (`plot-sidebar-state`) 변환
- **Sidebar 라우팅**: Next.js `<Link>` 대신 Zustand viewStore (`setView()`, `setActiveHub()`, `setCustomView()`) 사용
- **사이드바 5섹션 구조 확정**: Header(로고+검색+생성) / Nav(4뷰) / Workspace(커스텀뷰) / Projects(허브트리) / Footer(설정)
