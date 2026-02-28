# Technical Learnings — Plot

## 2026-02-27
- Next.js 15 + git worktree 환경에서 Turbopack `TurbopackInternalError` 간헐 발생 → `tsc --noEmit`으로 타입 체크 대체
- Windows bash에서 `app/(main)/layout.tsx` 같은 괄호 경로는 반드시 따옴표로 감싸야 함
- `taskkill /PID`가 git bash에서 작동하지 않음 → `cmd.exe /c "taskkill /PID X /F"` 필요
- 좀비 Node 프로세스가 포트를 점유할 때 다른 포트로 우회하는 것이 가장 빠른 해결책
- 병렬 에이전트가 같은 파일을 수정하지 않도록 파일 소유권 분리 필수

## 2026-02-28
- `.next` 캐시 corruption (`Cannot find module './331.js'`) → `.next` 폴더 삭제 후 dev server 재시작으로 해결
- `useHubStore((s) => s.hubs)` selector 패턴 필수 — 전체 store 구독 시 무한 리렌더링 발생
- git worktree 환경에서 각 worktree가 별도 포트 사용 — 혼동 주의 (port 3000=awesome-hypatia, 3002=eager-roentgen)
- shadcn sidebar-primitives의 cookie 기반 상태 관리를 localStorage로 변환 시 SSR hydration 문제 없음 (Next.js 클라이언트 컴포넌트)
