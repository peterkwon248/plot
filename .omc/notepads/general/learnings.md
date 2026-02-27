# Technical Learnings — Plot

## 2026-02-27
- Next.js 15 + git worktree 환경에서 Turbopack `TurbopackInternalError` 간헐 발생 → `tsc --noEmit`으로 타입 체크 대체
- Windows bash에서 `app/(main)/layout.tsx` 같은 괄호 경로는 반드시 따옴표로 감싸야 함
- `taskkill /PID`가 git bash에서 작동하지 않음 → `cmd.exe /c "taskkill /PID X /F"` 필요
- 좀비 Node 프로세스가 포트를 점유할 때 다른 포트로 우회하는 것이 가장 빠른 해결책
- 병렬 에이전트가 같은 파일을 수정하지 않도록 파일 소유권 분리 필수
