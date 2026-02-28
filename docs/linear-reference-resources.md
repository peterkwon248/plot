# Plot 개발을 위한 Linear 참고 리소스 종합 조사

> 조사일: 2026-02-27
> 검증일: 2026-02-28 (코드베이스 전체 대조 + 레포 실제 코드 확인 완료)
> 목적: Plot(플롯) 앱 개발 시 활용할 수 있는 Linear 클론, 디자인 시스템, 컴포넌트 라이브러리 종합 정리
> **상태: 검증 완료 (정확도 85~90%)**

---

## 검증 결과 요약

| 항목 | 결과 | 비고 |
|------|------|------|
| tuan3w/linearapp_clone | ✅ 정확 | Stars 303 (보고서 299), 데모/CodeSandbox 모두 작동 |
| ElectricSQL/Linearlite | ⚠️ 부분 일치 | 10만건 로드 맞음, "CRDT 기반"은 과장 (실제: fractional indexing + compensations) |
| thenameiswiiwin/linear-clone | ✅ 정확 | 58 stars, Next.js 13 + Tailwind + TS 확인 |
| Zrital3265/Linear.app | ✅ 정확 | 20 stars, Next.js + Tailwind + TS, 데모 작동 |
| cmdk | ⚠️ 부분 일치 | 12.3K stars, "Linear이 사용한다"는 **README에 없음** (외부 정보) |
| kbar | ✅ 정확 | 5.2K stars, "Linear의 ⌘K를 영감으로" README에 명시 |
| bazza/ui | ✅ 정확 | "Linear 디자인에서 영감" 명시, 문서 우수 |
| tablecn | ✅ 정확 | 6K stars, "Linear-like filter menu" 명시 |
| linear/linear | ✅ 정확 | 1.2K stars, 공식 SDK 모노레포 |
| 리디자인 블로그 | ✅ 정확 | 접속 가능, LCH 컬러 마이그레이션 등 내용 일치 |

### Plot 코드베이스 대조 결과

| 보고서 제안 | Plot 현재 상태 | 적용 가치 |
|------------|--------------|----------|
| `@dnd-kit` 사용 | ✅ 이미 사용 중 (core + sortable + utilities) | — |
| `TipTap` 에디터 | ✅ 이미 사용 중 (7개 패키지) | — |
| `Zustand` 상태관리 | ✅ 이미 사용 중 (v5) | — |
| `cmdk` 도입 | 자체 CommandBar 구현 중 (277줄) | ⭐⭐ 현재 잘 동작, 교체 이점 적음 |
| `kbar` 도입 | 미사용 | ⭐⭐ 시퀀스 단축키가 필요할 때 고려 |
| `shadcn/ui` 도입 | 미사용 | ⭐⭐ 컴포넌트 수 늘어날 때 고려 |
| `bazza/ui` 필터 | 미사용 (필터 버튼 껍데기만 존재) | ⭐⭐⭐ Phase 2 필터 구현 시 참고 |
| `lucide-react` 제거 | Search 아이콘 1개만 사용 | ✅ 즉시 제거 가능 |
| Linearlite fractional indexing | ✅ 이미 유사 구현 (itemStore.reorderItem) | ⭐⭐⭐ 알고리즘 비교 참고 |

---

## 1. GitHub — Linear UI 클론 프로젝트 (코드 참조용)

### tuan3w/linearapp_clone ✅
| 항목 | 내용 |
|------|------|
| URL | https://github.com/tuan3w/linearapp_clone |
| 데모 | https://linearapp-demo-ten.vercel.app/ ✅ 작동 |
| 스택 | React + Tailwind CSS + Redux + TypeScript ✅ 확인 |
| Stars | 303 (보고서 299 → 최근 증가) |
| 라이선스 | MIT ✅ |
| 상태 | 2021년 생성, 2023년 12월 마지막 수정, 8개 커밋 |
| 참고 | 작성자가 "완전한 클론 아님, Tailwind 학습용 데모"라고 명시 |

Plot 활용 포인트:
- 사이드바 구조와 레이아웃 비율 직접 확인 가능
- 이슈 행 컴포넌트의 Tailwind 클래스 참조 (패딩, 간격, 폰트 사이즈)
- CodeSandbox: https://codesandbox.io/s/linearapp-clone-q8cb0 ✅ 작동

### ElectricSQL/Linearlite ⚠️
| 항목 | 내용 |
|------|------|
| URL | https://github.com/electric-sql/electric/tree/main/examples/linearlite ✅ 존재 |
| 블로그 | https://electric-sql.com/blog/2023/10/12/linerlite-local-first-with-react ✅ 접속 가능 |
| 스택 | React + Vite + Tailwind + PGlite + ElectricSQL ✅ |
| 라이선스 | Apache 2.0 ✅ |

핵심 특징:
- ✅ 로컬-퍼스트 아키텍처 확인
- ✅ 10만 건 이슈 로드: README에 "loads 100,000 issues (~150MB)" 명시
- ⚠️ ~~CRDT 기반 충돌 해결~~ → **정정**: README에 CRDT 직접 언급 없음. 실제로는 fractional indexing + compensations 사용. 블로그에서 "Rich-CRDTs" 개념을 언급하지만 직접 구현은 아님
- ✅ fractional index 기반 드래그 정렬
- ✅ Write-through-database 패턴

Plot 활용 포인트:
- fractional indexing 알고리즘 (Plot의 reorderItem과 비교 참고)
- 로컬 DB ↔ UI 바인딩 패턴

### thenameiswiiwin/linear-clone ✅
| 항목 | 내용 |
|------|------|
| URL | https://github.com/thenameiswiiwin/linear-clone ✅ |
| 스택 | Next.js 13 + Tailwind + TypeScript ✅ (TS 96.4%) |
| Stars | 58, 10 forks, 98 commits |
| 추가 | CVA, clsx, Commitizen, Husky, Commitlint 설정 |

### Zrital3265/Linear.app ✅
| 항목 | 내용 |
|------|------|
| URL | https://github.com/Zrital3265/Linear.app ✅ |
| 스택 | Next.js + React + Tailwind + TypeScript ✅ (TS 98.9%) |
| Stars | 20, pnpm 사용 |
| 라이선스 | MIT ✅ |
| 데모 | https://linearapp-clone-ruby.vercel.app ✅ 작동 |

---

## 2. Figma — Linear 디자인 시스템 / UI 킷

> Figma 파일은 로그인 필요로 내부 내용 미검증. URL 존재 여부만 확인.

| 항목 | URL |
|------|-----|
| Linear Design System | https://www.figma.com/community/file/1222872653732371433 |
| Linear UI Kit | https://www.figma.com/community/file/1279162640816574368 |
| Landing Pages | https://www.figma.com/community/file/1367670334751609522 |
| Website Recreation | https://www.figma.com/community/file/1078379163108478708 |

---

## 3. 컴포넌트 라이브러리 — Plot에 직접 사용 가능

### cmdk (pacocoursey) ⚠️
| 항목 | 내용 |
|------|------|
| URL | https://github.com/pacocoursey/cmdk |
| Stars | 12.3K ✅ |
| 데모 | https://cmdk.paco.me |

- ⚠️ ~~Linear, Vercel, Raycast가 실제 사용~~ → **정정**: README에 이 언급 없음. 외부 정보원에서 온 것으로 추정
- ✅ Unstyled → 완전 커스텀 가능
- ✅ Radix UI Dialog 기반 → 접근성 보장
- **Plot 적용**: 현재 자체 CommandBar(277줄)가 잘 동작하므로 교체 이점 적음

### kbar ✅
| 항목 | 내용 |
|------|------|
| URL | https://github.com/timc1/kbar |
| Stars | 5.2K |
| 데모 | https://kbar.vercel.app |

- ✅ "Linear의 ⌘K를 영감으로" README에 명시
- ✅ 40+ 사용 기업 목록
- g+i 같은 시퀀스 단축키 네이티브 지원

### shadcn/ui Command (cmdk 래퍼)
| 항목 | 내용 |
|------|------|
| URL | https://ui.shadcn.com/docs/components/radix/command |

### Linear-style Data Table Filter (bazza/ui) ✅
| 항목 | 내용 |
|------|------|
| URL | https://ui.bazza.dev/docs/data-table-filter ✅ 접속 가능 |

- ✅ "Linear 디자인에서 영감" 명시
- ✅ 5가지 컬럼 타입, Client/Server 필터링, TanStack Table + nuqs
- ✅ 5개 언어 지원 (en, fr, zh, nl, de)
- **Plot 적용**: Phase 2 필터 UI 구현 시 참고 가치 높음

### Advanced Shadcn Table (sadmann7/tablecn) ✅
| 항목 | 내용 |
|------|------|
| URL | https://github.com/sadmann7/tablecn |
| Stars | 6K+ |

- ✅ "Linear-like filter menu" 명시
- ✅ Notion-like 고급 필터 + 플로팅 액션 바
- MIT 라이선스

---

## 4. Linear 공식 리소스

| 항목 | URL | 검증 |
|------|-----|------|
| 공식 GitHub | https://github.com/linear | ✅ 1.2K stars, TypeScript SDK 모노레포 |
| 리디자인 블로그 | https://linear.app/now/how-we-redesigned-the-linear-ui | ✅ HSL→LCH 컬러 마이그레이션, 98개 변수→3개 단순화, 6주 완료 |

---

## 5. 튜토리얼 / 가이드

| 항목 | URL |
|------|-----|
| React Command Palette (LogRocket) | https://blog.logrocket.com/react-command-palette-tailwind-css-headless-ui/ |
| Awesome Command Palette | https://github.com/stefanjudis/awesome-command-palette |
| Linearlite 아키텍처 블로그 | https://electric-sql.com/blog/2023/10/12/linerlite-local-first-with-react |

---

## 6. Plot 적용 우선순위

| 리소스 | 적용 가치 | 시기 | 이유 |
|--------|----------|------|------|
| Linear 리디자인 블로그 | ⭐⭐⭐⭐⭐ | 즉시 | LCH 컬러, 변수 최소화, 디자인 의사결정 |
| tuan3w/linearapp_clone | ⭐⭐⭐ | Phase 1 | 사이드바/행 Tailwind 클래스 참고 |
| Linearlite | ⭐⭐⭐⭐ | Phase 2 | fractional indexing, 로컬-퍼스트 패턴 비교 |
| bazza/ui 필터 | ⭐⭐⭐ | Phase 2 | 필터 UI 구현 시 참고 |
| cmdk | ⭐⭐ | 보류 | 자체 CommandBar 잘 동작 중 |
| kbar | ⭐⭐ | 보류 | 시퀀스 단축키 필요할 때 고려 |

---

> 이 문서는 2026-02-27 기준으로 조사, 2026-02-28 코드베이스 전체 대조 및 레포 실제 코드 확인 완료.
