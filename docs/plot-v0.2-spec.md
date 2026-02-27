# Plot v0.2 — 구현 명세서

> **작성 기준**: 2026-02-27 현재 코드베이스 (Next.js + Supabase + Zustand + TipTap)
> **핵심 원칙**: 개념은 전부 구현하되, UI에서는 보이지 않게. 유저는 행동만 하고, 구조는 뒤에서 만들어진다.

---

## 1. 용어 이중 체계 (Internal vs UI)

| 내부 개념 (코드/DB) | UI 표시 | 설명 |
|---|---|---|
| **Node** | *표시 안 함* (그냥 아이템) | Item 엔티티의 내부 명칭. UI에 "노드"라는 단어 노출 금지 |
| **Memory** | **Inbox** | 가공 전 1차 수집 공간. 현재 inbox 상태 그대로 유지 |
| **Class** | *자동 추론* | Task/Note 구분. 현재 `inferDisplayType()` 유지. UI에 라벨 노출 안 함 |
| **Tier** | 우선순위 아이콘만 | priority 필드 매핑. 텍스트 라벨 최소화, 아이콘/색상으로 전달 |
| **Level** | *자동 렌더링* | 본문 밀도에 따른 카드 높이 변화. 현재 `line-clamp-2` 로직 확장 |
| **Hub** | 사이드바 섹션명 | 프로젝트/폴더 대체. UI에서는 그냥 "이름"만 보임 |
| **Chain** | *시각적 연결선* | 노드 간 관계. "체인을 만드세요" 같은 문구 없이, 드래그/단축키로 연결 |

**규칙**: `PHILOSOPHY.md`에만 내부 용어를 정의한다. 코드 주석과 변수명에서는 사용 가능하지만, 유저에게 렌더링되는 모든 문자열에서는 사용 금지.

---

## 2. 데이터 모델 확장

### 2-1. 현재 상태 (v0.1)

```
items (단일 테이블)
├── id, user_id, title, body, body_plain
├── status (inbox | todo | in_progress | done)
├── priority (none | low | medium | high | urgent)
├── item_type (auto | note | task)
├── tags, sort_order
├── created_at, updated_at, completed_at, deleted_at
```

### 2-2. 추가 마이그레이션: `002_create_hubs.sql`

```sql
-- =====================================================
-- Plot v0.2 — Hub (프로젝트/공간)
-- =====================================================

CREATE TABLE hubs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  color       TEXT DEFAULT '#5E6AD2',
  icon        TEXT DEFAULT 'folder',
  sort_order  FLOAT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX idx_hubs_user ON hubs(user_id) WHERE archived_at IS NULL;

-- RLS
ALTER TABLE hubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own hubs"
  ON hubs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- updated_at 트리거
CREATE TRIGGER hubs_updated_at
  BEFORE UPDATE ON hubs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE hubs;

-- items 테이블에 hub_id 추가 (nullable — 허브에 속하지 않는 노드 허용)
ALTER TABLE items ADD COLUMN hub_id UUID REFERENCES hubs(id) ON DELETE SET NULL;
CREATE INDEX idx_items_hub ON items(hub_id) WHERE deleted_at IS NULL;
```

**설계 결정**:
- 아이템은 **하나의 Hub에만** 소속 (nullable `hub_id`). 다대다는 v0.3에서 검토.
- Hub 미지정 아이템은 Inbox/Active/Done 뷰에서 정상 표시.
- Hub는 아카이브 가능 (soft archive). 삭제 시 소속 아이템의 `hub_id`는 NULL로.

### 2-3. 추가 마이그레이션: `003_create_chains.sql`

```sql
-- =====================================================
-- Plot v0.2 — Chain (노드 간 관계/연결)
-- =====================================================

CREATE TABLE item_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  source_id   UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  target_id   UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  link_type   TEXT NOT NULL DEFAULT 'related'
              CHECK (link_type IN ('related', 'depends_on', 'parent')),
  sort_order  FLOAT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 동일 방향 중복 방지
  UNIQUE(source_id, target_id)
);

-- 양방향 조회 인덱스
CREATE INDEX idx_links_source ON item_links(source_id);
CREATE INDEX idx_links_target ON item_links(target_id);

-- RLS
ALTER TABLE item_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own links"
  ON item_links FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE item_links;
```

**link_type 설명**:
- `related`: 단순 연관 (양방향). A↔B
- `depends_on`: 의존성 (단방향). A가 완료돼야 B 시작 가능
- `parent`: 부모-자식. A가 B의 상위 항목

**"Chain"은 뷰 레벨 개념**: DB에는 `item_links` 테이블만 존재. `depends_on` 타입의 link가 연쇄적으로 이어진 것을 UI에서 "체인"으로 렌더링하는 것이지, chain 테이블이 별도로 존재하지 않음. 이 설계가 유연성을 극대화함.

---

## 3. TypeScript 타입 확장

### `types/index.ts` 추가 사항

```typescript
// ─── Hub ───
export interface Hub {
  id: string;
  user_id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface CreateHubInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

// ─── Item Link (Chain의 단위) ───
export type LinkType = "related" | "depends_on" | "parent";

export interface ItemLink {
  id: string;
  user_id: string;
  source_id: string;
  target_id: string;
  link_type: LinkType;
  sort_order: number;
  created_at: string;
}

export interface CreateLinkInput {
  source_id: string;
  target_id: string;
  link_type?: LinkType;
}

// ─── Item 확장 ───
// 기존 Item 인터페이스에 추가:
//   hub_id: string | null;

// ─── View 확장 ───
// 기존 ViewType에 hub 뷰 추가:
export type ViewType = "inbox" | "active" | "all" | "done" | "hub";
```

---

## 4. Store 확장

### 4-1. `stores/hubStore.ts` (신규)

```typescript
interface HubState {
  hubs: Hub[];
  activeHubId: string | null;

  setHubs: (hubs: Hub[]) => void;
  addHub: (input: CreateHubInput) => Hub;
  updateHub: (id: string, updates: Partial<Hub>) => void;
  archiveHub: (id: string) => void;
  setActiveHub: (id: string | null) => void;
}
```

### 4-2. `stores/linkStore.ts` (신규)

```typescript
interface LinkState {
  links: ItemLink[];

  setLinks: (links: ItemLink[]) => void;
  addLink: (input: CreateLinkInput) => ItemLink;
  removeLink: (id: string) => void;
  getLinksForItem: (itemId: string) => ItemLink[];
  getChain: (itemId: string) => Item[];  // depends_on 체인 추적
}
```

### 4-3. `stores/viewStore.ts` 확장

```typescript
// 추가 상태
interface ViewState {
  // ... 기존 ...
  activeHubId: string | null;        // 현재 선택된 Hub
  viewMode: "focus" | "canvas";      // 포커스 모드 / 캔버스 모드
  canvasPanels: string[];            // 캔버스에 열린 아이템 ID들 (최대 4개)

  setActiveHub: (id: string | null) => void;
  setViewMode: (mode: "focus" | "canvas") => void;
  openInCanvas: (itemIds: string[]) => void;
  closeCanvasPanel: (itemId: string) => void;
}
```

### 4-4. `stores/itemStore.ts` 수정

```typescript
// getByStatus 확장 — Hub 필터링 지원
getByStatus: (filter, hubId?) => {
  let items = get().items.filter(item => !item.deleted_at);

  // Hub 필터링
  if (hubId) {
    items = items.filter(item => item.hub_id === hubId);
  }

  // ... 기존 status 필터링 로직 ...
}

// 아이템을 Hub에 할당
assignToHub: (itemId: string, hubId: string | null) => {
  get().updateItem(itemId, { hub_id: hubId });
}
```

---

## 5. 구현 단계 (Phases)

### Phase 1: Hub — "묶을 수 있게"

**목표**: 사이드바에 Hub 섹션 추가. 아이템을 Hub로 분류 가능.

**DB**: `002_create_hubs.sql` 실행. items에 `hub_id` 컬럼 추가.

**UI 변경사항**:

#### 5-1a. Sidebar 확장

```
◆ Plot          ⌘K
─────────────────
  Inbox          3
  Active         5
  All           12
  Done           8
─────────────────   ← 구분선
  유튜브 기획      4   ← Hub 목록
  투자 리서치      2
  ─ ─ ─ ─ ─ ─ ─
  + New          ← Hub 생성 (호버 시만 표시)
```

- Hub 목록은 사이드바 하단에 자연스럽게 배치
- 각 Hub 왼쪽에 color dot (6px 원)
- Hub 클릭 시: `currentView = "hub"`, `activeHubId = hub.id`
- Hub 뷰에서는 해당 Hub 소속 아이템만 필터링 (status 서브필터 가능)
- "+ New" 버튼은 평소 `text-text-tertiary`로 희미하게, 호버 시 표시

#### 5-1b. Hub 뷰 헤더

```
[color dot] 유튜브 기획                    ⚙ (설정)
──────────────────────────────────────────
  [status icon] 대본 작성 방법론 정리         2시간 전
  [status icon] 썸네일 디자인 레퍼런스         어제
  ...
```

- 헤더에 Hub 이름 + 색상 dot
- 우측 설정(⚙) 클릭 시 Hub 이름/색상/설명 편집 드롭다운
- 아이템 리스트는 기존 ItemList 컴포넌트 재사용 (hubId 필터 prop 추가)

#### 5-1c. 아이템 → Hub 할당

**방법 1 — 커맨드 바 (⌘K)**:
- 아이템 선택 상태에서 ⌘K → "Move to..." 타이핑 → Hub 목록 표시 → 선택
- 또는: 아이템 선택 → `m` 키 → Hub 목록 드롭다운

**방법 2 — 디테일 패널**:
- DetailPanel에 "Hub" 프로퍼티 행 추가 (Status, Priority 아래)
- 클릭 시 Hub 선택 드롭다운

**방법 3 — 드래그 앤 드롭**:
- 아이템을 사이드바의 Hub 항목으로 드래그하면 할당
- (Phase 1에서는 방법 1, 2만 구현. 드래그는 Phase 1.5)

#### 5-1d. 키보드 단축키 추가

| 키 | 조건 | 동작 |
|---|---|---|
| `m` | 아이템 포커스/선택 상태 | Hub 할당 드롭다운 열기 |
| `⌘K` → "move" | 커맨드 바 | Hub 할당 |
| `H` | 아무 때나 | 사이드바 Hub 섹션으로 포커스 이동 |

---

### Phase 2: Chain — "연결할 수 있게"

**목표**: 노드 간 관계 생성/시각화. DetailPanel에서 연결 표시.

**DB**: `003_create_chains.sql` 실행.

**UI 변경사항**:

#### 5-2a. DetailPanel에 "연결된 항목" 섹션

```
Title: 파이썬 스크립트 작성
─────────────────────────
Status:    In Progress
Priority:  !!
Hub:       투자 리서치
─────────────────────────
  ↗ n8n 웹훅 연결           ← depends_on (이 항목 완료 후)
  ↔ API 문서 정리            ← related
─────────────────────────
[본문 에디터]
```

- Properties 영역 아래, 에디터 위에 "연결" 섹션
- 연결이 없으면 이 섹션 자체를 숨김 (빈 공간 없음)
- 각 연결 항목 클릭 시 해당 아이템으로 전환
- `↗` = depends_on, `↔` = related, `↑` = parent

#### 5-2b. 연결 생성 방법

**방법 1 — 커맨드 바**:
- 아이템 선택 상태에서 ⌘K → "Link to..." 타이핑 → 아이템 검색 → 선택
- link_type 선택: 기본값 `related`. Shift+Enter로 `depends_on`.

**방법 2 — 단축키**:
- 아이템 포커스 상태에서 `l` (link) → 아이템 검색 미니 팝업 → 선택

**방법 3 — 멀티 선택 (Phase 3 캔버스 모드에서)**

#### 5-2c. 연결 삭제

- DetailPanel의 연결 항목에 호버 시 `✕` 버튼 표시
- 클릭하면 즉시 삭제 (확인 없음, undo 가능하면 좋지만 v0.2에서는 생략)

#### 5-2d. ItemRow 연결 힌트

- 연결이 있는 아이템의 우측 메타 영역에 작은 link 아이콘 표시 (🔗 대신 SVG)
- 아이콘 옆에 연결 수 (예: `·2`)
- depends_on 관계에서 선행 아이템이 미완료면, 해당 아이템 행에 미세한 시각적 블로킹 힌트 (opacity 0.7 등)

#### 5-2e. 키보드 단축키 추가

| 키 | 조건 | 동작 |
|---|---|---|
| `l` | 아이템 포커스/선택 상태 | 연결 생성 검색 팝업 |
| `⌘K` → "link" | 커맨드 바 | 연결 생성 |

---

### Phase 3: Canvas Mode — "펼쳐서 볼 수 있게"

**목표**: 포커스 모드 ↔ 캔버스 모드 전환. 멀티 패널 작업 공간.

> ⚠️ **Phase 3는 Phase 1, 2가 실사용 안정화된 후 착수.** 이 섹션은 설계 방향만 정의.

#### 5-3a. 모드 전환

**트리거**:
- `⌘.` (Cmd+Period) → 모드 토글
- Hub 뷰 헤더 우측에 모드 전환 아이콘 (Focus ↔ Canvas)
- 리스트에서 `Shift+Click`으로 2개 이상 선택 후 `Space` → 캔버스로 열기

**전환 애니메이션**:
- 포커스 → 캔버스: 리스트가 좌측으로 축소되며 넓은 공간이 열림
- 캔버스 → 포커스: 패널들이 접히며 리스트 복귀
- `cubic-bezier(0.16, 1, 0.3, 1)` 300ms (현재 앱의 애니메이션 커브 통일)

#### 5-3b. 캔버스 레이아웃

```
┌─────────┬──────────────────────────────────────────┐
│ Sidebar │  [A 노드]          [B 노드]              │
│         │  ┌──────────┐     ┌──────────┐           │
│ (축소)   │  │ Title    │────→│ Title    │           │
│         │  │ Body...  │     │ Body...  │           │
│         │  └──────────┘     └──────────┘           │
│         │                                          │
│         │         [새 노드 작성 영역]                 │
│         │                                          │
└─────────┴──────────────────────────────────────────┘
```

- 최대 4개 패널 동시 표시 (2x2 그리드 또는 횡렬)
- 각 패널은 독립적인 TipTapEditor 인스턴스
- 패널 간 연결선 SVG 렌더링 (link_type에 따라 선 스타일 차이)
- 패널 하단 `+` 버튼으로 새 노드 생성 (자동으로 현재 Hub에 할당 + 선행 노드와 link 생성)

#### 5-3c. 캔버스에서의 연결 생성

- 패널 우측 엣지에서 드래그 시작 → 다른 패널로 드롭 = `depends_on` 링크 생성
- 패널 선택 후 `l` 키 = 기존 link 생성 플로우
- 연결선에 호버하면 link_type 표시 + 삭제 버튼

#### 5-3d. 포커스 모드에서 캔버스의 존재감

**완전히 0이어야 함.** 포커스 모드에서는:
- 캔버스 관련 UI 요소 없음
- 캔버스 관련 상태가 렌더링에 영향 안 줌
- 유일한 힌트: Hub 뷰 헤더 우측의 작은 아이콘 1개

---

## 6. 컴포넌트 신규/수정 목록

### 신규 컴포넌트

| 컴포넌트 | Phase | 설명 |
|---|---|---|
| `components/layout/HubSection.tsx` | 1 | 사이드바 Hub 리스트 |
| `components/layout/HubHeader.tsx` | 1 | Hub 뷰 헤더 (이름, 색상, 설정) |
| `components/ui/HubDropdown.tsx` | 1 | Hub 선택 드롭다운 (아이템 할당용) |
| `components/ui/HubCreateDialog.tsx` | 1 | Hub 생성 미니 다이얼로그 |
| `components/items/ItemLinks.tsx` | 2 | DetailPanel 내 연결 목록 |
| `components/ui/LinkSearchPopup.tsx` | 2 | 연결 대상 아이템 검색 팝업 |
| `components/canvas/CanvasView.tsx` | 3 | 캔버스 모드 메인 컨테이너 |
| `components/canvas/CanvasPanel.tsx` | 3 | 캔버스 내 개별 노드 패널 |
| `components/canvas/CanvasLinks.tsx` | 3 | 패널 간 연결선 SVG |

### 수정 컴포넌트

| 컴포넌트 | Phase | 수정 내용 |
|---|---|---|
| `components/layout/Sidebar.tsx` | 1 | Hub 섹션 추가 |
| `components/layout/DetailPanel.tsx` | 1+2 | Hub 프로퍼티 행 추가 (P1), 연결 섹션 추가 (P2) |
| `components/items/ItemRow.tsx` | 1+2 | Hub 색상 dot 표시 (P1), link 아이콘 표시 (P2) |
| `components/items/ItemList.tsx` | 1 | Hub 필터링 prop 추가 |
| `components/command-bar/CommandBar.tsx` | 1+2 | "Move to hub", "Link to" 커맨드 추가 |
| `hooks/useKeyboardNavigation.ts` | 1+2 | `m`, `l`, `H` 단축키 추가 |
| `app/(main)/layout.tsx` | 3 | viewMode에 따른 조건부 렌더링 |

---

## 7. 커맨드 바 확장 (⌘K)

### Phase 1 추가 커맨드

```
Actions
  Create new item                C
  Move to hub...                 M     ← NEW
  Create new hub...                    ← NEW

Navigation
  Go to Inbox                    1
  Go to Active                   2
  Go to All                      3
  Go to Done                     4

Hubs                                   ← NEW SECTION
  유튜브 기획
  투자 리서치
  ...
```

### Phase 2 추가 커맨드

```
Actions
  Create new item                C
  Move to hub...                 M
  Link to...                     L     ← NEW
  Create new hub...
```

---

## 8. Supabase Sync 확장

### `hooks/useSupabaseSync.ts` 수정

기존 items 동기화에 추가:
- `hubs` 테이블 초기 로드 + 실시간 구독
- `item_links` 테이블 초기 로드 + 실시간 구독
- Hub CRUD 메서드 (createHub, updateHub, archiveHub)
- Link CRUD 메서드 (createLink, removeLink)

동기화 우선순위: `hubs` → `items` → `item_links` (외래키 의존성 순서)

---

## 9. 디자인 토큰 추가

### `globals.css` 추가

```css
@theme {
  /* ... 기존 ... */

  /* Hub 기본 색상 팔레트 (유저 선택용) */
  --color-hub-purple: #5E6AD2;
  --color-hub-blue: #4C9EEB;
  --color-hub-green: #4CAF50;
  --color-hub-yellow: #F2C94C;
  --color-hub-orange: #F2994A;
  --color-hub-red: #EB5757;
  --color-hub-pink: #E91E8F;
  --color-hub-gray: #8A8A8A;

  /* Canvas */
  --color-canvas-bg: #0A0A0A;
  --color-canvas-grid: #1A1A1A;
  --color-link-line: #3A3A3A;
  --color-link-line-active: #5E6AD2;
}
```

---

## 10. 우선순위 체크리스트

### Phase 1 (Hub) — 예상 작업량: 2-3일

- [ ] `002_create_hubs.sql` 마이그레이션 실행
- [ ] `types/index.ts` — Hub, CreateHubInput 타입 추가, Item에 hub_id 추가
- [ ] `stores/hubStore.ts` 생성
- [ ] `stores/itemStore.ts` — getByStatus에 hubId 필터 추가, assignToHub 메서드
- [ ] `stores/viewStore.ts` — activeHubId 상태 추가
- [ ] `components/layout/HubSection.tsx` 생성
- [ ] `components/layout/Sidebar.tsx` — Hub 섹션 통합
- [ ] `components/ui/HubDropdown.tsx` 생성
- [ ] `components/layout/DetailPanel.tsx` — Hub 프로퍼티 행 추가
- [ ] `components/layout/HubHeader.tsx` 생성
- [ ] `components/items/ItemList.tsx` — Hub 필터링
- [ ] `components/command-bar/CommandBar.tsx` — "Move to hub" 커맨드
- [ ] `hooks/useKeyboardNavigation.ts` — `m` 단축키
- [ ] `hooks/useSupabaseSync.ts` — hubs 동기화
- [ ] 동작 테스트: Hub 생성 → 아이템 할당 → Hub 뷰 필터링 → ⌘K로 이동

### Phase 2 (Chain) — 예상 작업량: 2-3일

- [ ] `003_create_chains.sql` 마이그레이션 실행
- [ ] `types/index.ts` — ItemLink, LinkType 타입 추가
- [ ] `stores/linkStore.ts` 생성
- [ ] `components/items/ItemLinks.tsx` 생성
- [ ] `components/ui/LinkSearchPopup.tsx` 생성
- [ ] `components/layout/DetailPanel.tsx` — 연결 섹션 통합
- [ ] `components/items/ItemRow.tsx` — link 아이콘 힌트
- [ ] `components/command-bar/CommandBar.tsx` — "Link to" 커맨드
- [ ] `hooks/useKeyboardNavigation.ts` — `l` 단축키
- [ ] `hooks/useSupabaseSync.ts` — item_links 동기화
- [ ] 동작 테스트: 연결 생성 → DetailPanel 표시 → 연결 탐색 → 삭제

### Phase 3 (Canvas) — 예상 작업량: 5-7일 (Phase 1, 2 안정화 후)

- [ ] `stores/viewStore.ts` — viewMode, canvasPanels 상태
- [ ] `components/canvas/CanvasView.tsx` 생성
- [ ] `components/canvas/CanvasPanel.tsx` 생성
- [ ] `components/canvas/CanvasLinks.tsx` 생성 (SVG 연결선)
- [ ] `app/(main)/layout.tsx` — 모드 분기 렌더링
- [ ] 모드 전환 애니메이션
- [ ] `hooks/useKeyboardNavigation.ts` — `⌘.` 모드 토글
- [ ] 캔버스 내 드래그로 연결 생성

---

## 11. 절대 하지 않는 것 (Anti-patterns)

1. **UI에 "Node", "Chain", "Hub" 텍스트 노출** — 사이드바 Hub 이름은 유저가 지은 이름만 표시
2. **빈 Hub 뷰에서 "허브에 노드를 추가하세요" 같은 문구** — 대신 "No items yet. Press C to add one."
3. **연결 생성 시 "체인을 만드세요" 문구** — 대신 검색 팝업의 placeholder: "Search items to link..."
4. **강제 분류** — Hub 할당은 항상 선택적. 아이템은 Hub 없이도 완전히 기능
5. **캔버스 모드 온보딩 팝업** — 모드 전환 아이콘만 두고, 클릭하면 바로 전환. 설명 없음
6. **link_type을 유저에게 명시적으로 선택하게 하기** — 기본값 `related`. 고급 유저만 커맨드로 변경

---

## 12. PHILOSOPHY.md (레포 루트에 추가)

```markdown
# Plot — Design Philosophy

## Core Lexicon (Internal Only)

이 용어들은 코드와 내부 문서에서만 사용한다. UI에 노출하지 않는다.

- **Node**: 좌표 위의 점. 독립된 생각 하나. (UI: item)
- **Chain**: 점과 점이 이어진 선. 논리적 흐름. (UI: linked items)
- **Hub**: 점과 선이 모인 면. 하나의 작업 공간. (UI: project name)
- **Memory**: 가공 전 수집 공간. (UI: Inbox)
- **Class**: Node의 태생적 성질 — Task 또는 Note. (UI: 자동 추론)
- **Tier**: 처리 중요도. (UI: priority icon)
- **Level**: 시각적 밀도. (UI: card height auto)

## Design Principles

1. 개념이 UI에서 보이면 실패, 행동만 보이면 성공
2. 설득하지 않고 느끼게 한다
3. 구조는 유저가 만드는 게 아니라 쓰다 보면 만들어진다
4. 첫 화면은 항상: 입력창 + 리스트. 끝.
```

---

*이 명세서는 현재 코드베이스 (2026-02-27 기준 30 commits, Next.js 15 + Supabase + Zustand 5 + TipTap 2)를 기반으로 작성되었으며, Phase 순서를 준수하여 구현한다.*
