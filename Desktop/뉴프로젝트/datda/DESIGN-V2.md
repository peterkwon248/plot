# datda v2 설계 문서

## 방향: Overthinking-Safe Achievement System

> "당신은 게으른 게 아닙니다. 너무 많이 생각합니다."

v1은 "종료 장치"였다.
v2는 "과잉사고를 안전하게 다루면서 성취를 쌓는 시스템"이다.
기존 철학의 연장선이다. 닫기는 수단, 성취가 목적.

---

## 현재 코드 구조 (v1 분석 결과)

### 실제 사용자 흐름 (page.tsx 기준)
```
idle → [목표 입력 / 오늘 닫을 것 카드] → make → close → final
```
- open/lock/end phase는 코드에 정의되어 있지만, page.tsx에서 make/close/final만 렌더링
- ClosePhase가 close+lock+nextAction을 한 화면에서 처리
- EndPhase는 존재하지만 미사용

### Store 구조
- SessionState: phase, taskTitle, resultType, timerMinutes, closeReason, lockLocation, nextAction, status
- VaultState: goals[], lastVaultAccess
- HistoryState: sessions[]
- SettingsState: userTimerPresets, userResultTypes, hasSeenOnboarding

### 현재 닫기 흐름 (ClosePhase.tsx)
1. "오늘 더 하지 않는 이유" (텍스트 입력)
2. "결과를 어디에 남겼나요?" (텍스트 입력)
3. "내일 첫 행동" (텍스트 입력)
4. [닫기] 버튼

**문제**: 입력 3개를 한꺼번에 보여줌 → 과잉사고형에게 인지 부담

---

## v2 변경사항

### 1. 닫기 타입 3종: 완료 / 보류 / 폐기

**왜 필요한가:**
과잉사고형이 가장 못하는 것이 "포기"다. "폐기"라는 선택지를 주는 것 자체가 치료적이다.
현재는 "닫기" 하나뿐이라 모든 닫기가 "완료"를 의미한다.

**설계:**

```typescript
// constants.ts에 추가
export const CLOSE_TYPES = ['완료', '보류', '폐기'] as const;
export type CloseType = (typeof CLOSE_TYPES)[number];
```

| 타입 | 의미 | 아이콘 | 후속 메시지 | 목표 처리 |
|------|------|--------|------------|----------|
| **완료** | 형태가 남았다 | ✓ | "닫힘." | step.completed = true |
| **보류** | 아직은 아니다 | ⏸ | "괜찮다. 내일의 나에게 넘긴다." | step 유지, 다음에 다시 제안 |
| **폐기** | 이건 내 일이 아니다 | × | "잘 내려놓았습니다." | step.discarded = true, 다음 step으로 |

**ClosePhase UI 변경:**

```
Step 1: 닫기 타입 선택 (3개 버튼, 한 화면)
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │    ✓     │  │    ⏸     │  │    ×     │
  │   완료    │  │   보류    │  │   폐기    │
  │ 형태가    │  │ 아직은    │  │ 이건 더   │
  │ 남았다    │  │ 아니다    │  │ 이상 내   │
  │          │  │          │  │ 일이 아니다│
  └──────────┘  └──────────┘  └──────────┘

Step 2 (완료 시만): 간단한 기록
  - "결과를 어디에 남겼나요?" (선택 입력)
  - [닫기]

Step 2 (보류 시): 즉시 닫힘
  → "괜찮다. 내일의 나에게 넘긴다."

Step 2 (폐기 시): 확인 한 번
  - "정말 내려놓으시겠습니까?"
  - [네, 내려놓겠습니다]
  → "잘 내려놓았습니다."
```

**Store 변경:**
```typescript
// CompletedSession에 추가
closeType: CloseType;  // '완료' | '보류' | '폐기'

// GoalStep에 추가
discarded: boolean;     // 폐기 여부
discardedAt: number | null;
```

---

### 2. 열림 과부하 경고

**왜 필요한가:**
과잉사고형은 목표를 계속 추가한다. 7개 이상이면 인지 소음 과부하.

**설계:**

```typescript
// constants.ts에 추가
export const OVERLOAD_CONFIG = {
  maxActiveGoals: 7,
  warningMessage: '지금 당신은 생각이 과부하 상태입니다.',
  actionMessage: '하나를 닫고 다시 오세요.',
} as const;
```

**트리거 조건:**
- 활성 목표(완료되지 않은 goal) 수 >= 7
- 새 목표 추가 시 체크

**UI:**
```
┌─────────────────────────────────────┐
│                                     │
│   지금 당신은 생각이                  │
│   과부하 상태입니다.                  │
│                                     │
│   열린 목표: 8개                     │
│                                     │
│   하나를 닫고 다시 오세요.            │
│                                     │
│   [서랍함에서 정리하기]               │
│                                     │
└─────────────────────────────────────┘
```

**위치:**
- 홈 화면(State A)에서 목표 입력 시 검증
- 서랍함에서 새 목표 추가 시 검증
- 경고는 차단이 아닌 안내 (무시 가능하되, 매번 보여줌)

---

### 3. ClosePhase 단순화

**현재 문제:**
- 입력 3개가 한 화면에 동시에 보임 (인지 부담)
- "오늘 더 하지 않는 이유"는 닫기 타입으로 대체 가능
- "내일 첫 행동"은 AI가 이미 다음 step을 알고 있음

**변경:**
- "오늘 더 하지 않는 이유" → 닫기 타입 3종으로 대체 (제거)
- "결과를 어디에 남겼나요?" → 완료 시에만 표시 (선택 입력)
- "내일 첫 행동" → 제거 (AI가 다음 step을 자동 제안)

**결과:** 입력 3개 → 버튼 1개 (닫기 타입 선택)

---

### 4. PhaseIndicator 단순화

**현재:** MAKE → CLOSE → FINAL (영어)
**변경:** 하기 → 닫기 → 끝 (한국어, 더 직관적)

```typescript
// PhaseIndicator에 표시되는 라벨
const PHASE_LABELS = {
  make: '하기',
  close: '닫기',
  final: '끝',
} as const;
```

---

### 5. 메시지 톤 정립: "단호하되 따뜻하게"

**원칙:** 명령형, 비난 없음, 선택지 최소

| 현재 | v2 |
|------|-----|
| "형태가 생겼어요" (MakePhase 버튼) | "닫으러 가기" |
| "오늘은 여기까지" (EndPhase 버튼) | (제거, ClosePhase로 통합) |
| placeholder "충분히 했으니까" | (제거, 닫기 타입으로 대체) |
| "닫힘." (FinalScreen) | "닫힘." (유지) |
| "괜찮다." (보류 시 추가) | 새로 추가 |
| "잘 내려놓았습니다." (폐기 시 추가) | 새로 추가 |

**FinalScreen 메시지 분기:**
```
완료 → "닫힘."  +  "{목표명} — N번째 닫힘"
보류 → "괜찮다."  +  "내일의 나에게 넘겼다."
폐기 → "잘 내려놓았습니다."  +  "하나가 가벼워졌다."
```

---

## 변경 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `lib/constants.ts` | CloseType, OVERLOAD_CONFIG 추가 |
| `lib/store.ts` | closeType 필드, discarded 필드, 과부하 체크 함수 추가 |
| `components/session/ClosePhase.tsx` | 닫기 타입 3종 UI로 전면 개편 |
| `components/session/FinalScreen.tsx` | closeType별 메시지 분기 |
| `components/session/MakePhase.tsx` | 버튼 텍스트 변경 |
| `components/ui/PhaseIndicator.tsx` | 한국어 라벨 |
| `app/page.tsx` | 과부하 경고 UI 추가 |

**변경하지 않는 파일:**
- `app/layout.tsx` (변경 없음)
- `app/vault/page.tsx` (v2 범위 외)
- `app/chat/page.tsx` (v2 범위 외)
- `lib/gemini.ts` (변경 없음)

---

## 구현 순서

```
1단계: constants.ts + store.ts (타입/상태 추가)
2단계: ClosePhase.tsx (닫기 타입 3종 UI)
3단계: FinalScreen.tsx (메시지 분기)
4단계: MakePhase.tsx + PhaseIndicator.tsx (톤 변경)
5단계: page.tsx (과부하 경고)
6단계: 빌드 확인 + 테스트
```

---

## 변경하지 않는 것 (v2 범위 밖)

- OMCL 세션 구조 자체 (make→close→final 유지)
- AI 목표 쪼개기 로직
- 서랍함 접근 제한
- Vercel 배포
- 인증/계정 시스템
