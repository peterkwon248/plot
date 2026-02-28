# Session Notepad (Updated: 2026-02-28 01:30)

## Critical Context
- Plot = 개인용 Linear + Zettelkasten + Todo. 노드끼리 협업(체인).
- shadcn/ui 마이그레이션 완료 + circle 사이드바 이식 완료 (빌드 성공)
- Dev server: port 3002 (eager-roentgen worktree)
- 사용자가 사이드바 CSS 렌더링 안 된다고 보고 — 포트 혼동 또는 캐시 문제 추정

## Active Tasks
- [ ] localhost:3002 사이드바 렌더링 확인 (유저에게 Ctrl+Shift+R 안내)
- [ ] 사이드바 디자인 미세 조정 (Linear과의 gap 최소화)
- [ ] circle-temp 임시 디렉토리 정리

## Blockers
- .next 캐시 corruption 간헐 발생 → 삭제 후 재시작 필요
- 포트 3000/3001 다른 worktree 점유
