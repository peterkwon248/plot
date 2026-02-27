# Plot 개발을 위한 Linear 참고 리소스 종합 조사

> 조사일: 2026-02-27
> 목적: Plot(플롯) 앱 개발 시 활용할 수 있는 Linear 클론, 디자인 시스템, 컴포넌트 라이브러리 종합 정리
> **상태: 미검증 — 코드베이스 전체 대조 및 레포 실제 코드 확인 필요**

---

## TODO (내일 작업)

- [ ] Plot 코드베이스 전체 파일을 빠짐없이 읽고 현재 구현 상태 정확히 파악
- [ ] 보고서에 나온 GitHub 레포들 실제 코드를 깊이 살펴보고 활용 가능성 검증
- [ ] 위 두 결과를 바탕으로 보고서 내용의 정확성/적합성 최종 판단
- [ ] UI 오버홀 명세서 (plot-ui-overhaul-spec.md) Phase 1 작업 시작

---

## 1. GitHub — Linear UI 클론 프로젝트 (코드 참조용)

### tuan3w/linearapp_clone
| 항목 | 내용 |
|------|------|
| URL | https://github.com/tuan3w/linearapp_clone |
| 데모 | https://linearapp-demo-ten.vercel.app/ |
| 스택 | React + Tailwind CSS + Redux + TypeScript |
| Stars | 299 |
| 라이선스 | MIT |
| 상태 | 2년 전 마지막 커밋 (유지보수 중단) |

포함 컴포넌트:
- 사이드바 (팀, 뷰, 프로젝트 계층)
- 이슈 리스트 (상태별 그루핑, 행 구조)
- 보드 뷰 (칸반)
- 필터/정렬 UI
- 이슈 디테일 패널

Plot 활용 포인트:
- 사이드바 구조와 레이아웃 비율 직접 확인 가능
- 이슈 행 컴포넌트의 Tailwind 클래스 참조 (패딩, 간격, 폰트 사이즈)
- Redux 상태 관리 패턴 → Plot의 Zustand로 변환 참고
- CodeSandbox에서도 실행 가능: https://codesandbox.io/s/linearapp-clone-q8cb0

### ElectricSQL/Linearlite (Plot과 기술 철학 동일)
| 항목 | 내용 |
|------|------|
| URL | https://github.com/electric-sql/electric/tree/main/examples/linearlite |
| 블로그 | https://electric-sql.com/blog/2023/10/12/linerlite-local-first-with-react |
| 스택 | React + Tailwind + PGlite (브라우저 내 Postgres) + ElectricSQL 동기화 |
| 라이선스 | Apache 2.0 |

핵심 특징 — Plot과의 공통점:
- 로컬-퍼스트 아키텍처: 로컬 DB에 직접 쿼리 → 네트워크 지연 없음
- SQLite/PGlite 기반: Plot의 localStorage/Supabase와 유사한 철학
- 오프라인 지원: DB가 로컬에 있으므로 자연스럽게 오프라인 동작
- CRDT 기반 충돌 해결: 동시 편집 시 last-write-wins
- 10만 건 이슈 로드 테스트: 대규모 데이터셋에서의 성능 검증 완료

포함 컴포넌트:
- Linear 스타일 이슈 리스트 (tuan3w 클론 기반, 간소화)
- 칸반 보드 (드래그 앤 드롭, fractional index 기반 정렬)
- 전문 검색 (Postgres tsvector/tsquery)
- 이슈 디테일 뷰

Plot 활용 포인트:
- 로컬 DB ↔ UI 바인딩 패턴 직접 참고
- "Write through the database" 패턴 (로컬 먼저 쓰고, 이후 동기화)
- fractional index 기반 드래그 정렬 (Plot의 sort_order 필드에 바로 적용 가능)

### thenameiswiiwin/linear-clone
| 항목 | 내용 |
|------|------|
| URL | https://github.com/thenameiswiiwin/linear-clone |
| 스택 | Next.js 13 + Tailwind + TypeScript |
| 라이선스 | 미명시 |

### Zrital3265/Linear.app
| 항목 | 내용 |
|------|------|
| URL | https://github.com/Zrital3265/Linear.app |
| 스택 | Tailwind CSS |
| 라이선스 | MIT |

---

## 2. Figma — Linear 디자인 시스템 / UI 킷

### Linear Design System (가장 상세)
| 항목 | 내용 |
|------|------|
| URL | https://www.figma.com/community/file/1222872653732371433 |
| 제작자 | 커뮤니티 (비공식) |

포함 요소:
- 컬러 시스템 (다크/라이트 모드 변수)
- 타이포그래피 스케일
- 스페이싱/그리드 시스템
- 컴포넌트 라이브러리 (버튼, 인풋, 드롭다운, 모달 등)
- 주요 화면 템플릿 (이슈 리스트, 보드, 디테일 등)

### Linear UI - Free UI Kit (Recreated)
| 항목 | 내용 |
|------|------|
| URL | https://www.figma.com/community/file/1279162640816574368 |

### Linear App Style Landing Page Collection
| 항목 | 내용 |
|------|------|
| URL | https://www.figma.com/community/file/1367670334751609522 |

### Linear Website Recreation (Desktop)
| 항목 | 내용 |
|------|------|
| URL | https://www.figma.com/community/file/1078379163108478708 |

---

## 3. 컴포넌트 라이브러리 — Plot에 직접 사용 가능

### cmdk (pacocoursey) — 커맨드 팔레트
| 항목 | 내용 |
|------|------|
| URL | https://github.com/pacocoursey/cmdk |
| npm | cmdk |
| Stars | 10K+ |
| 데모 | https://cmdk.paco.me |

- Linear, Vercel, Raycast가 실제 사용
- Unstyled → 완전 커스텀 가능
- Radix UI Dialog 기반 → 접근성 보장

### kbar — 대안 커맨드 팔레트
| 항목 | 내용 |
|------|------|
| URL | https://github.com/timc1/kbar |
| 데모 | https://kbar.vercel.app |

- Provider 패턴, 액션 등록 방식
- g+i 같은 시퀀스 단축키 네이티브 지원

### shadcn/ui Command (cmdk 래퍼)
| 항목 | 내용 |
|------|------|
| URL | https://ui.shadcn.com/docs/components/radix/command |

### Linear-style Data Table Filter (bazza/ui)
| 항목 | 내용 |
|------|------|
| URL | https://ui.bazza.dev/docs/data-table-filter |

- Linear의 필터 UI를 정확히 모방
- TanStack Table + nuqs 통합
- 다국어 지원 (i18n)

### Advanced Shadcn Table (sadmann7/tablecn)
| 항목 | 내용 |
|------|------|
| URL | https://github.com/sadmann7/tablecn |

- Notion-like 고급 필터 + Linear-like 플로팅 바

---

## 4. Linear 공식 리소스

| 항목 | URL |
|------|-----|
| 공식 GitHub | https://github.com/linear |
| 리디자인 블로그 | https://linear.app/now/how-we-redesigned-the-linear-ui |

---

## 5. 튜토리얼 / 가이드

| 항목 | URL |
|------|-----|
| React Command Palette (LogRocket) | https://blog.logrocket.com/react-command-palette-tailwind-css-headless-ui/ |
| Awesome Command Palette | https://github.com/stefanjudis/awesome-command-palette |
| Linearlite 아키텍처 블로그 | https://electric-sql.com/blog/2023/10/12/linerlite-local-first-with-react |

---

> 이 문서는 2026-02-27 기준으로 조사되었습니다.
> **미검증 상태** — 내일 코드베이스 전체 대조 + 레포 실제 코드 확인 후 업데이트 예정
