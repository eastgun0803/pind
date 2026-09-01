# Pind 진행 현황

**Last updated**: 2026-08-02 (Phase 6: 피드/소셜/크리에이터)

> 세션 시작 시 이 파일을 먼저 읽고, 종료 시 갱신할 것.
> Phase별 체크리스트의 완료 항목은 `- [x]`로 표시하고 commit hash를 옆에 적는다.

---

## 의사결정 로그 (ADR)

| 날짜 | 결정 | 비고 |
|------|------|------|
| 2026-05-13 | 모노레포 (pnpm workspace) | CLAUDE.md hierarchy 활용 |
| 2026-05-13 | 영상 소스: YouTube URL only (yt-dlp) | TikTok/IG는 v2 |
| 2026-05-13 | Supabase + FastAPI 분리 (DB/Auth ↔ AI 파이프라인) | Webhook으로 연결 |
| 2026-05-13 | AI: 하이브리드. A안(Gemini 단일 비디오) 구현, B안 인터페이스 분리 | 정확도 부족 시 B안 전환 |
| 2026-05-13 | 비동기: FastAPI `BackgroundTasks` | 동시 5개↑ 시 RQ 검토 |
| 2026-05-13 | Web: Next.js App Router + 단순화 규칙 (모든 페이지 `'use client'`) | v0 호환 우선 |
| 2026-05-13 | UI: Tailwind + shadcn/ui, v0 워크플로우 | 재사용은 `packages/ui` |
| 2026-05-13 | 상태: Zustand + TanStack Query | |
| 2026-05-13 | 지도: Leaflet + OpenStreetMap (무료) | |
| 2026-05-13 | DB: PostgreSQL 15 + PostGIS 3 (Supabase). SRID 4326 | |
| 2026-05-13 | 인증: Supabase Auth (JWT). FastAPI는 JWKS 검증 | |
| 2026-05-13 | 타입 동기화: Pydantic → OpenAPI → `openapi-typescript` 자동 생성 | 손으로 작성 금지 |
| 2026-05-20 | DB 연결: Docker 없이 Supabase Cloud Session Pooler 직접 사용 | IPv6 직접 연결 대신 Session Pooler(:5432) — Alembic/FastAPI 모두 동일 |
| 2026-05-20 | Gemini 모델: `gemini-3.1-flash-lite` 고정 | |
| 2026-06-11 | web 스택: **Next.js 14 + React 18 + Tailwind v3 + shadcn 2.3.0** 고정 | 최신 shadcn(v4)은 Tailwind v4+base-ui 전제라 우리 스택과 충돌 → 2.x(Radix) 사용. 토큰은 tailwind.config.ts(HSL) |
| 2026-06-11 | shadcn 토큰 oklch→HSL 트리플릿 교체 | shadcn 2.3.0이 oklch를 쓰는데 v3 config는 `hsl(var(--x))`로 감싸 무효화됨 → 정통 zinc HSL 팔레트로 globals.css 재작성 |
| 2026-06-11 | RootLayout만 Server Component 예외 허용 | `metadata` export 때문. 데이터 패칭/Server Action 없음. 페이지는 모두 `'use client'` |
| 2026-06-11 | Extension: Plasmo 0.90.5 + React 18 | create-plasmo가 example template을 잡아 package.json 수동 정정. Tailwind는 후속 |
| 2026-06-11 | shared-types `api.ts` 추적(gitignore 해제) | 생성 타입이지만 커밋 → 클론 직후 typecheck 보장. gen-types가 덮어씀 |
| 2026-06-11 | ui lint: eslint 9 flat config + typescript-eslint | next/* import 금지 규칙. 컴포넌트 생기면 eslint-plugin-react 추가 |
| 2026-06-12 | Gemini 모델: `gemini-3.1-flash-lite` → `gemini-2.5-flash` 수정 | 3.x 시리즈 대부분 preview 상태, GA 안정판은 2.5-flash. settings.py `GEMINI_MODEL` 환경변수로 관리 |
| 2026-06-12 | Phase 1 구현: Video/Place SQLAlchemy 모델, Alembic 마이그레이션, Pydantic 스키마, mock 라우터, 단위 테스트 | `feat/phase-1` 브랜치, commit `ceeadf9` |
| 2026-06-12 | PlaceRead geom→lat/lng 변환: `model_validator(mode="before")` 패턴 | ORM 객체와 dict 입력 모두 처리. FastAPI response_model 자동 직렬화 호환 |
| 2026-06-12 | Phase 2 구현: Auth 흐름, VideoForm, Leaflet 지도, mock API 연동 | `feat/phase-2` 브랜치, commit `1b8b723` |
| 2026-06-12 | Leaflet SSR 회피: `dynamic(ssr:false)` + MapWrapper 패턴 | Leaflet이 window 직접 참조 → SSR 렌더 시 오류. Map.tsx를 MapWrapper에서 동적 import |
| 2026-06-12 | gen-types 전 임시 브리지 타입: `apps/web/lib/dto.ts` | shared-types가 placeholder인 동안 PlaceDTO/VideoDTO 정의. gen-types 실행 후 이 파일 삭제하고 shared-types import로 교체 |
| 2026-06-12 | Auth: Supabase 이메일/비밀번호 (+ 회원가입) | OAuth 소셜 로그인은 v2. 현재는 email+password만. useAuth 훅으로 캡슐화 |
| 2026-06-12 | Phase 3+4 구현: AI 파이프라인 + Realtime + Extension | `feat/phase-3-4` 브랜치. Gemini Files API 업로드 → Places API 지오코딩 → Realtime Zustand 상태 연동 |
| 2026-06-12 | Gemini A안: Files API 업로드 + generate_content | client.files.upload → ACTIVE 폴링 → generate_content → files.delete 패턴. asyncio.to_thread로 동기 호출 래핑 |
| 2026-06-12 | PlaceRead에 video_url 추가 | Map 팝업에서 YouTube iframe 삽입 위해 places 쿼리 시 video 관계 eagerly load (selectinload) → video_url 노출 |
| 2026-06-12 | Webhook 인증: Bearer 토큰 (supabase_webhook_secret) | 비어있으면 로컬 dev 모드로 간주하고 통과 |
| 2026-07-01 | Web UI를 `pind_shadcn_map-main`(외부 목업 리포)에서 이식 | `/places`를 히스토리 사이드바+실시간 지도 대시보드(`PindDashboard`)로 승격, `/login` 비주얼 개선. Google 로그인/Google Maps 내보내기 기능은 드롭(ADR 유지: Supabase 이메일/비밀번호만). shadcn 프리미티브 6종(`card/checkbox/input/label/scroll-area/separator`) 추가. `Map`이 `videoIds: string[]`를 받아 다중 영상 마커 병합 지원 |
| 2026-08-02 | `Create UI Prototype`(Figma Make 프로토타입)의 UI를 Bin_pind에 융합, MVP만 실동작 | 홈을 "URL 입력"에서 "분석된 영상 피드"로 교체(브리핑 문서 지시). URL 입력은 `/analyze`로 이동. 구독결제·인구통계추천·크리에이터 상세지표 고급 로직은 브리핑 문서가 스스로 "지금은 틀만"이라 명시 → UI만 이식, 데이터는 목업 유지 |
| 2026-08-02 | RLS: 완료된(`status='completed'`) 영상/장소는 로그인 없이 누구나 조회 가능하도록 정책 변경 | `videos_owner_select`/`places_owner_select` → `..._select_own_or_public`. 본인 소유가 아니어도 완료 상태면 SELECT 허용, 쓰기는 여전히 본인만 |
| 2026-08-02 | 저장/컬렉션/이벤트 로깅은 새 FastAPI 엔드포인트 없이 Supabase 클라이언트 직접 CRUD | 신규 테이블 5개(`saved_places`, `saved_videos`, `collections`, `collection_places`, `place_events`) 전부 Supabase 마이그레이션+RLS로 관리, Alembic/SQLAlchemy 비관여 (관심사 분리 유지) |
| 2026-08-02 | 크리에이터 대시보드 통계 전용으로 FastAPI에 `get_current_user` 최초 구현 | 루트 CLAUDE.md ADR에 "JWKS 검증"이라 적혀있었지만 실제로는 미구현 상태였음. `SUPABASE_JWT_SECRET`로 HS256 디코드하는 최소 구현(`app/deps.py`). `GET /api/v1/creator/videos/{id}/stats`에서만 사용, 본인 소유 아니면 403 |
| 2026-08-02 | `videos` 테이블에 `region/theme/creator_name/thumbnail_url` 컬럼 추가 | `download.py`가 이미 받아오던 yt-dlp 메타데이터(`uploader`, `thumbnail`)를 버리지 않고 저장. `region`/`theme`은 기존 Gemini 분석 호출(`analyze_video.py`) JSON 응답에 최상위 필드 2개를 추가 요청해 같은 호출에서 받음(추가 API 비용 없음) |
| 2026-08-02 | `resolve.py`: Google Places Legacy(`findplacefromtext`) → New API(`places:searchText`)로 마이그레이션 | Legacy API가 프로젝트에서 비활성화되어 지오코딩이 100% 실패(`REQUEST_DENIED`)했던 것을 계기로 전환. 응답의 `status`/`error_message` 파싱해 로그에 실제 원인 노출하도록 에러 핸들링도 개선 |
| 2026-08-02 | `apps/api/pyproject.toml`: `geoalchemy2[shapely]`, `pyjwt` 추가 | shapely 누락으로 `/api/v1/places` 500 에러 발생 이력 → optional extra 명시. pyjwt는 get_current_user용 |
| 2026-08-02 | 장소 타입(카페/맛집/명소/숙소/체험) 배지·핀 색상은 스키마 변경 없이 `category` 자유 텍스트를 클라이언트에서 키워드 매핑 | `apps/web/lib/placeType.ts`. 백엔드 변경 최소화 |
| 2026-08-02 | 크리에이터 모드 진입 = "분석한 영상이 1개 이상 있는가" | 별도 role/플래그 컬럼 없이 `useVideos().length > 0`으로 판단. 채널 URL 연결(`CreatorVerifyModal`)은 부가 표시용 목업(로컬 상태만, 미영속화)이며 게이팅 조건 아님 |

---

## Phase 0: 부트스트랩

- [x] 0-1. pnpm workspace 모노레포 초기화 (`apps/`, `packages/`) — package.json, pnpm-workspace.yaml, packages/{shared-types,ui}, tsconfig.json, .gitignore
- [x] 0-2. 루트 `CLAUDE.md` + 각 디렉토리 `CLAUDE.md` 5개 배치 — 완비 확인
- [x] 0-3. `docker-compose.yml` + `Makefile` 작성 완료 — **Docker 불필요 확정**: DB는 Supabase Cloud 직접 연결(Session Pooler :5432)로 대체. docker-compose는 Phase 5 배포 테스트용으로 보존
- [x] 0-4. Supabase CLI 설정 완료 — `supabase init` + `supabase link` (bin_pind / fqltlhaqmfmnerriellm, Seoul), RLS 마이그레이션 파일 작성 (`supabase/migrations/20260520000001_enable_rls_videos_places.sql`)
- [x] 0-5. `apps/api` 부트스트랩 완료
- [x] 0-6. `apps/web` 부트스트랩 완료
- [x] 0-7. `apps/extension` 부트스트랩 완료
- [x] 0-8. `packages/ui`, `packages/shared-types` 부트스트랩 완료
- [x] 0-9. `Makefile` 정비 완료
- [x] 0-10. pre-commit hook 완료

> **Phase 0 부트스트랩 전체 완료 (0-1 ~ 0-10) ✅**

## Phase 1: DB & DTO (Backend)

- [x] 1-1. `Video`, `Place` SQLAlchemy 모델 (UUID PK, GeoAlchemy2 Geography)
- [x] 1-1. Alembic 환경 + 초기 마이그레이션 (PostGIS extension 포함) — `alembic/versions/20260612_0000_initial_schema.py`
- [x] 1-1. GIST 인덱스 + FK 인덱스
- [x] 1-1. RLS 정책 SQL 작성 (`supabase/migrations/`) — Phase 0에서 완료 (20260520000001)
- [x] 1-2. Pydantic 스키마 (`VideoRead/Create`, `PlaceRead/Create`, `VideoUpdate`)
- [x] 1-2. `GET /api/v1/places` mock 라우터 → **Phase 3에서 실제 DB 쿼리로 교체 완료**
- [ ] 1-2. `make gen:types` 파이프라인 (openapi.json → `packages/shared-types/api.ts`) — FastAPI 실행 후 `make gen-types`로 수동 실행 필요
- [x] 1-2. 단위 테스트: Pydantic 직렬화 (geom ↔ lat/lng 변환) — `tests/unit/test_schemas.py`

> **Phase 1 완료 (gen:types 제외) ✅**

## Phase 2: Frontend 뼈대

- [ ] 2-1. `packages/shared-types/api.ts` 자동 생성 검증 — FastAPI 서버 기동 후 `make gen-types` 필요
- [x] 2-1. `lib/supabase.ts`, `lib/api.ts` wrapper (JWT 자동 첨부) — Phase 0에서 완료
- [x] 2-1. Supabase Auth 흐름 (로그인/로그아웃, 세션 복원) — `hooks/useAuth.ts` + `app/(auth)/login/page.tsx`
- [x] 2-2. URL 입력 폼 컴포넌트 (`apps/web/components/VideoForm`) — YouTube URL 검증 + Supabase INSERT + 상태 표시(Phase 4 연동)
- [x] 2-2. 빈 지도 컴포넌트 (Leaflet, `dynamic` import로 SSR 회피) — `components/Map.tsx` + `MapWrapper.tsx`
- [x] 2-2. 더미 마커 → 실제 API 호출 → YouTube iframe 팝업 (Phase 4에서 확장)
- [x] 2-3. 대시보드 UI 이식 (`pind_shadcn_map-main` 참고) — `HistorySidebar`(영상 목록+VideoForm), `CheckedVideosPanel`(체크된 영상 장소 목록), `MobileOverlay`, `PindDashboard`. `/places`에 배치

> **Phase 2 완료 (gen:types 제외) ✅**

## Phase 3: AI 파이프라인 (Backend)

- [x] 3-1. `pipeline/types.py` (PlaceCandidate, VideoMeta)
- [x] 3-1. `pipeline/cost_guard.py` (비용 캡 — duration + USD 이중 가드)
- [x] 3-1. `pipeline/download.py` (yt-dlp 2-step: dump-json → download, 720p max, mp4)
- [x] 3-1. `pipeline/analyze_video.py` (Gemini Files API 업로드 → ACTIVE 폴링 → generate_content → files.delete. JSON 파싱 + confidence 필터)
- [x] 3-1. 단위 테스트 (`tests/unit/test_pipeline.py` — cost_guard 3케이스, _parse_candidates 5케이스)
- [x] 3-2. `pipeline/resolve.py` (Google Places findplacefromtext 지오코딩 + sentence-transformers 코사인 유사도 dedup, 임계값 0.85)
- [x] 3-3. `pipeline/orchestrator.py` (전체 흐름: download → cost_guard → extract → resolve → insert places → update status)
- [x] 3-3. `webhooks/video_created.py` (POST /api/v1/webhooks/video-created, Bearer 인증, BackgroundTasks)
- [x] 3-3. `GET /api/v1/places` 실제 DB 쿼리 전환 (video_id 필터 지원, selectinload(Place.video))
- [x] 3-3. `PlaceRead`에 `video_url` 필드 추가 (selectinload에서 추출)
- [x] 3-3. `main.py`에 video_webhook_router 등록

> **Phase 3 완료 ✅** (B안 audio/frames/transcribe 스텁은 v2)

## Phase 4: Realtime & UI 완성

- [x] 4-1. `hooks/useVideoStatus.ts` (Supabase Realtime postgres_changes 구독, video_id 필터)
- [x] 4-1. `stores/videoStore.ts` (Zustand — latestVideoId, latestVideoUrl)
- [x] 4-1. `VideoForm` 업데이트: Supabase INSERT 후 video_id 저장 → pipelineStatus 표시 (pending/processing/completed/failed)
- [x] 4-2. `Map` 업데이트: video_url로 YouTube iframe 팝업 (`?start={context_start_sec}`), fitBounds, 5초 폴링(완료 전까지)
- [x] 4-3. Extension `popup.tsx` 전면 구현: 인증 확인, URL 입력, INSERT, Realtime 상태 표시
- [x] 4-3. Extension `contents/youtube.tsx`: YouTube 페이지 플로팅 버튼 주입, 클릭 시 Supabase INSERT
- [x] 4-3. Extension `hooks/useVideoStatus.ts` + `stores/videoStore.ts`

> **Phase 4 완료 ✅** (마커 클러스터링 leaflet.markercluster는 장소 100개↑ 시 Phase 5 전 추가)

## Phase 6: 피드 / 소셜 / 크리에이터 (MVP)

- [x] 6-1. Supabase 마이그레이션: 공개 피드 RLS 전환 + `saved_places/saved_videos/collections/collection_places/place_events` 5개 테이블
- [x] 6-1. `videos`에 `region/theme/creator_name/thumbnail_url` 컬럼 추가 (Alembic) + 파이프라인에서 실제로 채움
- [x] 6-2. `resolve.py` Google Places New API 마이그레이션 (지오코딩 에러 핸들링 개선 포함)
- [x] 6-2. `GET /api/v1/places?ids=` 다중 place_id 필터 추가 (컬렉션 조회용)
- [x] 6-2. `app/deps.py` `get_current_user` 최초 구현 + `GET /api/v1/creator/videos/{id}/stats` (본인 소유 검증, 핀별 이벤트 집계)
- [x] 6-3. 홈을 "URL 입력" → "분석된 영상 피드"(`app/page.tsx`)로 교체, URL 입력은 `app/analyze/page.tsx`로 이동
- [x] 6-3. `app/videos/[id]/page.tsx` — 실제 지도+핀, 장소 체크 후 "내 지도"(컬렉션)에 담기
- [x] 6-3. `app/profile/page.tsx` — 내 지도(컬렉션, 실제 순서 변경 포함)/저장한 영상 탭
- [x] 6-3. `app/creator/dashboard/page.tsx` — 실제 핀별 노출/클릭/저장/행동 퍼널
- [x] 6-3. 훅 7종: `useFeed/useVideo/useMyMaps/useSavedVideos/usePlaceEvents/useCreatorStats/usePlacesByIds`
- [x] 6-3. `Map.tsx` 타입별 색상 핀(`places`/`selectedPlaceId`/`onSelectPlace` prop) 확장
- [ ] 6-4. (v2) 구독 결제 PG 연동, 인구통계 맞춤 추천, 경로 자동 최적화(현재는 수동 순서 변경만 실제 동작)

> **Phase 6 MVP 완료 ✅** — `make verify-js` 통과, 백엔드 `ruff`/`pytest` 통과(mypy는 기존 pre-existing genai 타입 이슈 제외 신규 파일 전부 clean). Playwright로 `/`, `/videos/[id]`, 보호 라우트 리다이렉트 실제 스크린샷 검증 완료

## Phase 5: 보안 & 배포

- [ ] 5-1. RLS 정책 모든 테이블 검증 (Supabase Dashboard에서 직접 테스트)
- [ ] 5-1. service_role 키 서버 사이드 전용 격리 재확인
- [ ] 5-2. tenacity 재시도 로직 점검 + 에러 분기 (4xx vs 5xx)
- [ ] 5-2. structlog + Sentry (무료 티어) 셋업
- [ ] 5-2. Dockerfile (FastAPI) + Render or Fly.io 배포
- [ ] 5-2. Vercel에 web 배포 (환경변수 분리)
- [ ] 5-2. Chrome Web Store 제출 (선택, v1.1)

---

## 진행 중

**Phase 3~6 완료** (`feat/phase-3-4` 브랜치, 전부 미커밋 상태). Phase 6에서 `Create UI Prototype` 기반 피드/영상상세/프로필/분석/크리에이터 대시보드를 실동작으로 이식(위 ADR 2026-08-02 참고). `apps/web` `pnpm typecheck`/`pnpm lint`, 루트 `make verify-js` 통과 확인.

### 로컬 실행 방법

```bash
# 1. API 환경변수 설정
cd apps/api
cp .env.example .env
# .env에 SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
# GEMINI_API_KEY, GOOGLE_PLACES_API_KEY 등 입력

# 2. Python 가상환경 + 의존성 설치
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# 3. DB 마이그레이션 (Supabase Cloud)
alembic upgrade head

# 4. API 서버 실행
uvicorn app.main:app --reload --port 8000

# 5. Web 환경변수 설정
cd apps/web
cp .env.example .env.local
# .env.local에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# NEXT_PUBLIC_API_URL=http://localhost:8000 입력

# 6. Web 서버 실행 (루트에서)
pnpm --filter @pind/web dev

# 7. Supabase Dashboard에서 Database Webhook 설정
# Table: videos, Event: INSERT
# URL: http://<your-api>/api/v1/webhooks/video-created
# Authorization: Bearer <SUPABASE_WEBHOOK_SECRET>
```

## 다음 작업

**Phase 5**: RLS 검증 → Render/Fly.io 배포(FastAPI) → Vercel 배포(web) → Supabase Webhook URL 실제 서버로 교체.

**gen:types 마무리**: API 서버 기동 후 `make gen-types` → `lib/dto.ts` 제거 후 `packages/shared-types/api.ts` import로 교체.

**Phase 6 후속**: 오늘 변경사항 전부 미커밋 — 커밋 단위/시점은 팀 논의 필요. `apps/api/app/pipeline/download.py`/`orchestrator.py`의 기존 ruff format 이슈(오늘 세션과 무관, 이전부터 있던 것)는 아직 미해결.

---

## 알려진 이슈 / 검증 필요

- Gemini Vision의 한글 간판 인식률 — 실측 후 confidence threshold 조정 (현재 0.5)
- Place Resolver의 sentence-transformers dedup 임계값 0.85 — 실험으로 튜닝
- yt-dlp가 YouTube 봇 차단에 막힐 가능성 — cookies/proxy 전략 필요할 수도
- Supabase Realtime 구독이 Extension popup 닫힘 이후에도 유지되는지 확인 필요 (Service Worker 수명)
- `make gen:types` 파이프라인 미실행 — `lib/dto.ts` 임시 타입 사용 중
- 영상 목록(History)은 `/api/v1/videos` 엔드포인트가 없어 프런트에서 Supabase `videos` 테이블 직접 조회로 대체 중(`hooks/useVideos.ts`). 체크된 영상들의 장소는 `/api/v1/places?video_id=`를 영상별로 병렬 호출해 병합(`hooks/usePlacesByVideo.ts`) — 체크 수가 많아지면 N+1 호출 비용 검토 필요
- 피드의 "좋아요"는 영속화 안 됨(로컬 state만, 새로고침 시 초기화) — 브리핑 문서에 명시된 기능이 아니라 의도적으로 미저장
- `MyMapPanel`의 교통편별 소요시간/현지 버스 정보는 실제 좌표 기반 계산이 아닌 데모용 목업 텍스트 (경로 순서 변경 자체는 실제 DB에 저장됨)
- `place_events` 테이블은 SELECT를 클라이언트에 열지 않고 FastAPI(service_role)에서만 집계 — RLS INSERT는 `WITH CHECK (true)`라 스팸성 이벤트 삽입을 막는 별도 rate limit 없음, Phase 5 보안 검증 때 같이 점검 필요
- 오래된(2026-08-02 이전) 영상들은 `region/theme/creator_name`이 `null` — 소급 반영 안 됨, 재분석해야 채워짐. 단 `thumbnail_url`은 `lib/youtube.ts`의 `youtubeThumbnailUrl()`로 영상 URL에서 즉석 유도(YouTube의 예측 가능한 공개 썸네일 URL 패턴 이용, API 키 불필요)해 null이어도 항상 표시됨
- 장소 클릭 시 새 탭으로 구글맵 연결만 함(사진/별점/리뷰는 미표시) — 인앱 상세 패널을 만들려면 Places "Place Details" + "Photo" API 추가 호출(비용 발생, 캐싱 전략 필요) + 새 UI가 필요해 이번엔 보류하기로 결정(2026-08-02)

## 차후 검토 (v2 후보)

- 장소 클릭 시 인앱 상세 패널 (사진·별점·리뷰·영업시간) — Google Places Details/Photo API 연동 필요
- TikTok/Instagram 영상 지원
- 멀티모달 앙상블(B안) vs A안 정확도 비교 실험 (학회/논문 거리)
- 사용자 영상 직접 업로드
- 다중 사용자 공유 지도
- React Native 모바일 앱
- leaflet.markercluster 도입 (100개↑ 마커)
- Edge Function으로 일부 파이프라인 이전 (cold start 허용 영역)
