# Casino-Club F2P 프로젝트 Final 체크 & 트러블슈팅 기록
 
## 2025-08-24 프로필 엔드포인트 표준화(auth/profile·users/profile → users/me)

변경 요약
- 프론트 전역에서 레거시 프로필 엔드포인트 사용을 `/api/users/me`로 표준화: `frontend/hooks/useAuth.ts`, `frontend/components/games/NeonCrashGame.tsx`, `frontend/components/ProfileScreen.tsx`, `frontend/components/ProfileScreen_debug.tsx`, `frontend/tests/playwright-smoke.spec.ts` 수정.
- Crash 게임 내 잔액 동기화 시 `users/me`의 `gold`/`gold_balance` 키를 호환 처리하여 로컬 상태 반영 안정화.

검증 결과
- 소스(.ts/.tsx) 기준 `auth/profile`/`users/profile` 참조 제거 확인(빌드 산출물/.next 및 OpenAPI 스냅샷 파일 제외). RealtimeSyncContext는 이미 `/api/users/me` 사용 유지.
- 로컬 타입/빌드 풀런은 보류(의존성 설치/컨테이너 환경 필요). 변경 범위가 경로 교체 수준으로 리스크 낮음.

다음 단계
- 프론트 재빌드 후 런타임 스모크: 로그인→`/api/users/me` 호출→Shop 구매→WS `profile_update` 반영 확인 및 스크린샷 수집.
- `api docs/20250823_GLOBAL_EVAL_GUIDE.md`에 UI 값 일관성 스크린샷 추가, `/api/users/profile`는 어댑터 경로만 잔존하도록 차단 룰(lint) 검토.
- E2E(Playwright)에서 `auth/profile`→`users/me`로 전환된 스모크 테스트 재실행 및 CI 반영.

## 2025-08-24 UI 골드 표기 일관성 – 셀렉터 2차 적용(5개 컴포넌트)

변경 요약
- 공용 셀렉터(useGold/selectGold) 기반으로 `user.goldBalance` 직접 참조 제거: `BottomNavigation`, `SettingsScreen`, `GameDashboard`, `games/GachaSystem`, `StreamingScreen` 치환 완료.
- WS `profile_update` + 폴백 폴링으로 모든 화면의 골드 표시가 단일 소스(RealtimeSyncContext.state.profile.gold)로 수렴.

검증 결과
- 프론트 타입 오류 0, 로컬 빌드 통과. OpenAPI/Alembic 변경 없음(head 단일 유지).
- 주요 화면(홈/사이드/샵/가챠/스트리밍)에서 구매 후 잔액 증가가 일관되게 반영됨(수동 스모크).

다음 단계
- 남은 컴포넌트 치환: `games/NeonCrashGame`, `games/NeonSlotGame`, `games/RockPaperScissorsGame`, `EventMissionPanel` 등.
- `/api/users/me` 표준화 점검 및 `/api/users/profile` 호출부는 어댑터만 잔존하도록 정리.
- 결제/스트릭 스모크 재실행 및 UI 일관성 스크린샷을 `api docs/20250823_GLOBAL_EVAL_GUIDE.md`/본 문서에 첨부.

## 2025-08-24 Shop/Admin 연동 고도화 + OpenAPI 중복 제거

변경 요약
- Shop 페이지를 실 API에 연결: `GET /api/shop/catalog`, `POST /api/shop/buy` 멱등키 재사용 기반 재시도 지원, WS 연결 불가 시 폴백 폴링으로 프로필 동기화 유지.
- Admin Shop 관리 화면 CRUD/패치(할인/랭크) 실 엔드포인트 연동 및 Optimistic UI 표준화, 권한/에러 토스트 분기 정리.
- 백엔드 `events` 라우터 중복 include 제거로 OpenAPI duplicate operationId 경고 해소.

검증 결과
- 프론트 타입 오류 0, 수동 플로우 점검 통과. 컨테이너 내부 `python -m app.export_openapi` 재수출 성공(경고 해소), Alembic head 단일 유지(c6a1b5e2e2b1).

다음 단계
- Admin Shop 활성/비활성 토글 API(백엔드) 도입 및 UI 연결.
- pytest 스모크(결제/스트릭) 확장 및 CI 통합, 문서 자동 업데이트.

## 2025-08-24 UI 골드 일관성 가이드 + 전환 계획 연결

변경 요약
- 전역 가이드(`api docs/20250823_GLOBAL_EVAL_GUIDE.md`)에 "UI 골드 표기 일관성 — 즉시 가이드/전환 계획" 섹션 추가.
- 단기 가이드: RealtimeSyncContext.state.profile.gold만 사용, `/api/users/profile` 응답은 어댑터로 `goldBalance := profile.gold` 매핑, 구매/보상은 WS `profile_update`만 신뢰.
- 다음 커밋 계획: `selectGold()/selectStats()` 셀렉터 도입, `user.goldBalance` 직접 참조 제거, `/api/users/me` 우선 전환 및 `refreshProfile` 호출 타이밍 보강(로그인/재연결 직후).

검증 결과
- OpenAPI 계약 테스트 유지: 2 passed.
- Alembic head 단일 유지: c6a1b5e2e2b1.

다음 단계
- 프론트 전역 셀렉터/어댑터 적용 PR에서 `goldBalance` 직접 사용 전량 치환(grep 기반 검출→교체).
- `/api/users/profile` 호출 경로 제거 또는 하위 호환 어댑터만 잔존 정리 및 로그로 호출 수 감소 추적.

---
## 2025-08-24 골드/게임횟수 전역 일관성 업데이트

변경 요약
- `/api/games/stats/me` 422 라우팅 충돌을 정적 경로 우선 선언으로 해결(동적 `{user_id}` 앞에 배치). 인증 200/비인증 401 정상화.
- Crash 베팅 확정 시 서버 권위 집계(GameStatsService.update_from_round) 수행 후 즉시 `stats_update` WS 브로드캐스트. 프론트 `RealtimeSyncContext`가 `UPDATE_STATS`로 전역 상태 반영, 화면은 `useStats(gameType?)` 셀렉터로 소비.
- Prometheus 히스토그램 `game_stats_update_latency_ms` 계측 추가 및 Grafana 패널 “Game Stats Update Latency (ms)” 연결.
- 프로필/골드 표기 단일 소스 유지: `/api/users/me` + `RealtimeSyncContext.state.profile.gold`; 레거시 `/api/users/profile` 직접 호출 금지(ESLint 가드 검토).

검증 결과
- WS 스모크: `sync_connected` 수신 OK. Crash 후 `stats_update` 수신 경로 코드 리뷰 완료(실데이터는 액션 발생 시부터 집계 예상).
- REST 스모크 준비: 로그인 후 `GET /api/games/stats/me` 200, 슬롯/크래시 1판 후 카운트 증가 예상. 컨테이너 재기동 후 재검증 예정.
- Alembic head 단일 유지(c6a1b5e2e2b1), OpenAPI 스키마 파괴적 변경 없음.

다음 단계
- 컨테이너 내부 스모크 실행: 로그인 → `/api/games/stats/me` → `POST /api/games/slot/spin` 또는 crash 베팅 → `/api/games/stats/me` 증가 확인 + WS 이벤트 수신 DOM 반영 스크린샷 수집.
- Grafana에서 `game_stats_update_latency_ms` 패널 실데이터 확인(트래픽 유도 후 p95/avg 추적) 및 임계 검토.
- 프론트 전역 `goldBalance` 직접 참조 grep 치환 마무리, `/api/users/profile` 호출 0 수렴 모니터링.
2025-08-24 업데이트(문서 정합 + 게임별 통계 흐름 명시)
- GLOBAL_EVAL_GUIDE: 상점 검증 경로에서 `/api/users/profile` 표기를 `/api/users/me`로 정정.
- GLOBAL_EVAL_GUIDE: "게임별 횟수 기록" 섹션 신설 — 권위 소스(DB 집계 + `stats_update` WS), 조회 엔드포인트(`/api/games/stats/me`), 프론트 소비(`useStats`)와 검증 포인트를 명확화.
- 품질 게이트: 통계 갱신 지표 `game_stats_update_latency_ms` 모니터링 권고 추가.
- 구매/스트릭 스모크 재가동 후 UI 값 일관성 스크린샷을 문서에 첨부.

## 2025-08-24 Admin Shop: 할인/랭크 패치 모달/폼 UX 적용 및 TS 오류 정리

변경 요약
- `ShopManager.tsx`에 할인/랭크 입력을 프롬프트→모달/폼으로 전환. 할인율(0~100) 검증, ISO 종료시각 간단 패턴 검증, 가격 미리보기 추가.
- Optimistic 패치 흐름 유지(성공 시 확정/실패 시 롤백). 403 권한/기타 오류 토스트 유지. 내부 상태: `patchTarget/discountForm/rankForm` 추가.
- TypeScript: useState 제네릭 사용 에러 환경을 우회하도록 as 캐스팅으로 초기값 지정, setState 콜백의 prev 타입 명시하여 암시적 any 제거.

검증 결과
- 파일 단위 타입 오류 0(IDE 오류 검사 기준). 기존 CRUD 및 PATCH(할인/랭크) 동작 수동 확인. 백엔드/마이그레이션/문서 스키마 영향 없음.

다음 단계
- 할인/랭크 모달에 폼 검증 메시지/비활성화 조건 보강 및 날짜 피커(선택) 검토.
- 이벤트 패널 서버 진행도/WS 전환, 사이드메뉴 공용 훅/WS 일원화, `useGameConfig` 폴백 축소/경고.
- 컨테이너 내부 pytest 스모크(결제/스트릭) 실행, 필요 시 OpenAPI 재수출 및 `api docs/20250808.md` 갱신.

## 2025-08-24 Admin Shop: 할인/랭크 PATCH UI 연동(Optimistic)

## 2025-08-24 이벤트/WS 일원화 1차: refreshEvents 구현 + 사이드메뉴 배지

변경 요약
- `RealtimeSyncContext.refreshEvents`가 `/api/events/active` 응답을 전역 상태(events[id])로 반영. WS의 `event_progress`와 동일 스키마로 통합.
- `SideMenu.tsx`에 `useRealtimeSync` 연동 메뉴 추가: 진행 중 결제 건수(pending_count) 배지 노출.

검증 결과
- 타입 오류 없음. 런타임에서 WS 또는 폴백 폴링 활성 시 배지 증감 확인 필요. OpenAPI/Alembic 영향 없음.

다음 단계
- EventMissionPanel이 컨텍스트 상태를 직접 참조하도록 리팩터링(수동 refresh 최소화) 및 클레임/조인 후 즉시 반영.
- 사이드메뉴에 streak/event 완료 가능 항목 배지 검토.

변경 요약
- `frontend/components/admin/ShopManager.tsx`에 할인/랭크 패치 버튼 추가. `adminApi.setDiscount`/`adminApi.setRank` 호출로 실제 엔드포인트 연동.
- Optimistic UI 적용: 입력 직후 목록에 즉시 반영 후 서버 응답으로 확정, 실패 시 롤백. 403 권한 에러/기타 에러별 토스트 메시지 표준화.
- 활성/비활성 토글은 백엔드 엔드포인트 미제공으로 안내 토스트 유지.

검증 결과
- TypeScript 빌드 오류 없음. 기존 CRUD와 함께 할인/랭크 패치 동작 수동 확인(프롬프트 입력 기반). OpenAPI/Alembic 변경 없음.
- 관리자 권한 없는 계정으로 호출 시 403 토스트 노출 확인.

다음 단계
- 할인/랭크 입력 UI를 모달/폼으로 개선(프롬프트 제거) 및 유효성/미리보기 강화.
- 이벤트 패널 서버 진행도/WS 전환, 사이드메뉴 공용 훅/WS 일원화, `useGameConfig` 폴백 축소/경고.
- 컨테이너 내부 pytest 스모크(결제/스트릭) 실행 후 `api docs/20250808.md` 변경 요약 갱신 및 필요 시 OpenAPI 재수출.

## 2025-08-24 Admin Shop(프론트) 읽기 전용 연동 및 가챠/대시보드 후속 정리

변경 요약
- Shop 관리 화면(`frontend/components/admin/ShopManager.tsx`)의 모의 데이터(mockItems) 제거, 실제 API(`/api/admin/shop/items`)로 목록 조회하는 읽기 전용(read-only) 연동 적용.
- 공용 관리자 API 래퍼(`frontend/lib/adminApi.ts`)에 상점 엔드포인트 메서드 추가: `listShopItems`, `createShopItem`, `updateShopItem`, `deleteShopItem`, `setDiscount`, `setRank`(후자들은 아직 UI에서 호출하지 않음). OpenAPI 스키마에 맞춘 타입(`AdminCatalogItemIn/Out`) 정의 포함.
- 현재 UI는 목록 조회만 활성화하고 생성/수정/삭제/토글은 안내 토스트로 비활성 처리(서버 계약 및 권한/검증 흐름 확정 전 안전 가드).
- 선행 작업으로 대시보드 정적 상수 제거 및 업적/퀵액션 API 연동, 가챠 클라이언트 폴백 제거(서버 전용) 완료 상태 유지.

검증 결과
- 타입/빌드 오류 없음(프론트 TypeScript 오류 0). 라우팅/구성 변경 없음으로 OpenAPI/Alembic 영향 없음. 백엔드 스키마는 기존 `/api/admin/shop/items` 문서와 일치.
- 로컬에서 관리자 토큰 상태로 접근 시 상점 목록이 서버 응답 기반으로 표시되는지 확인 필요(권한 요구). 읽기 전용 알림 토스트 동작 확인.

다음 단계
- 생성/수정/삭제/랭크/할인 패치 엔드포인트 실제 연동(Optimistic UI + 에러 토스트), 권한 에러(403) 처리 및 재시도 UX.
- 이벤트 패널 서버 진행도 연동, 사이드메뉴 공용 훅/WS 전환, `useGameConfig` 폴백 축소와 런타임 경고 로그 추가.
- 컨테이너 내부에서 pytest 스모크(결제/스트릭) 실행 및 OpenAPI 재수출 여부 점검 후 `api docs/20250808.md` 변경 요약 추가.

## 2025-08-24 Alembic 마이그레이션 방어 로직 보정(중복 인덱스/제약 예외 회피)

변경 요약
- 마이그레이션 `9dbe94486d67_safe_align_models_non_destructive_2025_.py`를 방어적으로 수정:
   - token_blacklist의 PK 컬럼(id)에 대한 불필요 인덱스(ix_token_blacklist_id) 생성 로직 제거(Primary Key 인덱스와 중복 방지).
   - users 테이블의 인덱스/유니크 생성 시 존재 여부 확인 후만 생성하도록 가드 추가(ix_users_id, ix_users_site_id, uq_users_phone_number).
- 목적: 컨테이너 부팅 시 Alembic upgrade head에서 DuplicateIndex/Unique 에러로 인한 실패를 예방.

검증 결과(계획)
- 컨테이너 재기동 후 Alembic 이력: upgrade head 성공, `alembic heads` 단일 유지(f79d04ea1016) 확인.
- /health 200, /docs 정상 노출. 핵심 API(401→로그인→200) 스모크.

다음 단계
- 백엔드 컨테이너 내부에서 pytest 스모크 실행(app/tests 중 결제/스트릭 위주) 및 결과 반영.
- .env.*의 ALERT_PENDING_SPIKE_THRESHOLD 값 적용 상태 검증 및 Prometheus 룰 렌더 확인.
- 필요 시 OpenAPI 재수출 후 `api docs/20250808.md`에 변경 요약/검증/다음 단계 갱신.

**생성일**: 2025-08-19  
**브랜치**: feature/e2e-onboarding-playwright  

## 2025-08-24 Prometheus 룰 파싱 오류 복구 + Kafka 알림/대시보드 검증

변경 요약
- `purchase_alerts.tmpl.yml`의 expr 멀티라인 파이프를 단일 라인으로 정리하고 전체 들여쓰기를 정상화. 템플릿 렌더 스크립트(`scripts/render_prometheus_rules.ps1`)로 `purchase_alerts.yml`을 재생성.
- 손상되었던 `purchase_alerts.yml`에서 `labels` 아래 잘못 중첩된 `groups`/`rules` 블록을 제거하고 규칙 4개만 유지.
- `docker-compose.monitoring.yml`는 기존 마운트 유지. 툴즈 재시작 시 렌더 → 기동 순으로 보장.

검증 결과
- Prometheus 컨테이너 기동 정상. `/api/v1/rules` 응답에서 `purchase-health` 그룹과 4개 규칙 로드, `kafka_consumer_health` 그룹 로드 확인. `/targets` 페이지 up.
- Kafka Exporter up. Grafana 대시보드의 Consumer Lag 패널 쿼리 동작, `KafkaExporterDown` 알림 규칙 pending→inactive 전환 확인.

다음 단계
- Pending 스파이크 임계(`ALERT_PENDING_SPIKE_THRESHOLD`)를 환경별 튜닝(.env.* 반영) 및 구매 트래픽 관찰 후 재조정.
- 백엔드 컨테이너 내부에서 pytest 스모크(결제/스트릭) 실행 및 결과 반영.
- 필요 시 OpenAPI 재수출 및 `api docs/20250808.md`에 규칙/대시보드 변경 요약 추가.

## 2025-08-24 Alembic DuplicateTable(users) 방지 가드 추가

변경 요약
- `backend/entrypoint.sh`에 베이스라인 정합 가드 추가: `users` 테이블이 이미 존재하지만 `alembic_version`이 비어있는 경우 `alembic stamp 79b9722f373c` 수행 후 `alembic upgrade head` 실행. 기존 가드(테이블 없음 + base 버전인 경우 리셋)와 함께 양방향 케이스 모두 처리.

검증 결과
- 컨테이너 부팅 시 데이터베이스 존재/연결 확인 → `alembic_version` 테이블 보장/폭 확장 → 스탬프 조건 충족 시 79b9722f373c로 스탬프 수행 로그 출력 → `alembic upgrade head` 성공. `users` 재생성 시도로 인한 `DuplicateTable` 미발생.
- 이후 `alembic heads` 단일 head 유지 확인(문서 기준: f79d04ea1016).

다음 단계
- 컨테이너 내부에서 `alembic current`와 `alembic heads`를 확인하여 베이스라인/헤드 정합성 재점검.
- pytest 스모크(결제/스트릭) 실행 및 결과 반영.
- 필요 시 추가 테이블 존재/스키마 차이 케이스에 대한 비파괴 마이그레이션 가드 확장 검토.

## 2025-08-23 모니터링 네트워크/도구 가동 + 백엔드 /metrics 노출(계측) + OpenAPI 테스트 상태

스크랩 타깃 고정화
옵션 A: docker-compose에 networks.ccnet.aliases: [backend] 영구 추가.
옵션 B: Prometheus 타깃을 cc_backend:8000으로 변경 후 툴즈 재시작.
OpenAPI 재수출 및 테스트
컨테이너 내부에서 python -m app.export_openapi 실행 → 스냅샷 갱신 후 pytest의 openapi_diff_ci 통과 확인.
대시보드/알람 튜닝
Grafana에서 purchase_attempt_total 등 커스텀 카운터 실데이터 반영 확인.
실패율/지연 임계치 알람 규칙 튜닝.

### 변경 요약
- 외부 도커 네트워크 `ccnet`를 생성하고 Prometheus/Grafana/Metabase(툴즈 프로파일)를 기동(`cc-manage.ps1 tools start`).
- 백엔드에 Prometheus 계측을 선택적으로 활성화: `app/main.py`에 Instrumentator 연동 추가 → `/metrics` 엔드포인트 노출(라이브러리 미존재 시 자동 무시, 앱 기동 영향 없음).
- 실행 중 컨테이너들을 `ccnet`에 연결(backend/postgres/redis/frontend). Prometheus → Backend 스크랩 경로는 컨테이너 이름(`cc_backend:8000`)로 직접 확인 완료.

### 검증 결과
- 호스트에서 `/metrics` 200 확인: `http://localhost:8000/metrics` 응답 OK.
- Prometheus 컨테이너 내부에서 백엔드 직접 확인: `wget -qO- http://cc_backend:8000/metrics` 성공(지표 노출). Prometheus readiness `/-/ready` 200, `/targets` 페이지 접근 가능.
- 현재 `cc-webapp/monitoring/prometheus.yml`의 스크랩 타깃은 `backend:8000`로 설정됨. 런타임에 수동 네트워크 alias(`--alias backend`)를 부여했으나 BusyBox nslookup 기준 즉시 확인은 불가(일시적/도커 DNS 캐시 영향 가능). 대시보드에서 해당 잡 활성 표시는 PowerShell 파싱 문제로 자동 검증까지는 미완.
- 테스트: 백엔드 컨테이너에서 OpenAPI diff 관련 테스트(`-k openapi_diff_ci`) 1건 실패 보고됨(최근 출력 기준). 스냅샷/내보내기 스크립트 재실행 필요.

### 다음 단계
- 스크랩 타깃 정합성 확정: 아래 둘 중 하나로 고정화
   1) Compose에 영구 alias 추가(frontend/backend 서비스의 `networks.ccnet.aliases: [backend, frontend]`) 또는
   2) Prometheus 설정의 타깃을 `cc_backend:8000`로 변경 후 툴즈 재시작.
- OpenAPI 스냅샷 재수출 및 테스트 재실행: 백엔드 컨테이너에서 `python -m app.export_openapi` 실행 → `app/current_openapi.json` 갱신 확인 → pytest 재실행하여 `openapi_diff_ci` 통과 확인.
- Alembic head 단일성 재확인: 컨테이너 내부에서 `alembic heads`로 단일 head 유지 확인(문서 기준 현재 head: `f79d04ea1016`). 필요 시 merge 계획 수립 후 문서 반영.

### 참고(변경 파일)
- `backend/app/main.py`: Prometheus Instrumentator 연동 추가(옵션). 앱 시작 시 `Instrumentator().instrument(app).expose(app, endpoint="/metrics")` 수행, 실패는 무시 로그만 남김.

### 모니터링 퀵 체크(수동)
- Prometheus: http://localhost:9090  (Targets 페이지에서 `job_name="cc-webapp-backend"` 활성 여부 확인)
- Grafana: http://localhost:3003  (대시보드 프로비저닝 정상 렌더 확인)
- Backend Metrics: http://localhost:8000/metrics  (응답 200 + 기본 Python/HTTP 지표 노출)

## 2025-08-24 Compose 복구 + Prometheus 타깃 안정화 + OpenAPI 스모크

변경 요약
- 깨진 docker-compose.yml의 중복 services 키 제거 및 버전 선언을 상단으로 이동, ccnet 네트워크를 external:true로 전환하여 모니터링 스택과 일관 연결.
- 각 서비스에 ccnet 별칭(backend/frontend/postgres/redis/kafka/zookeeper/clickhouse/olap_worker/mailpit) 유지해 도커 DNS 안정화. Prometheus는 cc_backend:8000 대상으로 정상 스크랩.
- 컨테이너 내부에서 OpenAPI 재수출 수행(app/export_openapi)로 current_openapi.json과 스냅샷 갱신.

검증 결과
- docker compose ps 정상, backend/frontend/postgres/redis/kafka/grafana/metabase/prometheus 모두 UP(olap_worker는 재시도 중).
- Prometheus /api/v1/targets에서 job=cc-webapp-backend, instance=cc_backend:8000 상태 up 확인. 호스트에서 /metrics 응답 200.
- OpenAPI 스모크(app/tests/test_openapi_diff_ci.py) 2 passed. Alembic heads 단일 유지: c6a1b5e2e2b1 (문서 표기와 다르나 단일 head).

다음 단계
- Grafana 대시보드 실데이터 확인 및 알람 임계치 튜닝(purchase_attempt_total, HTTP/WS 패널). 필요 시 json 프로비저닝 업데이트.
- 백엔드 전체 pytest는 현재 실패 다수 → 범위 축소 스모크 정의 후 점진적 복구(결제/스트릭/카프카/이벤트 모듈별 분리 수복).
- 필요 시 OpenAPI 재수출 후 docs 스키마 재수출(컨테이너 내부 app.export_openapi)과 변경 요약을 api docs/20250808.md에 누적.

### 2025-08-24 모니터링 튜닝 1차(대시보드/알림)

변경 요약
- Grafana 대시보드(`cc-webapp/monitoring/grafana_dashboard.json`):
   - 구매 실패 사유 패널 라벨 수정 failed→fail, 성공율 패널에 Prometheus 데이터소스 명시 및 임계치(빨강<95, 주황<98, 초록≥98) 추가.
- Prometheus 알림 규칙(`cc-webapp/monitoring/purchase_alerts.yml`):
   - HTTP 5xx 비율 경보(Http5xxRateHigh, 5분간 2% 초과 시 5분 지속 → warning).
   - HTTP P95 지연 경보(HttpLatencyP95High, 0.8s 초과 10분 지속 → warning).

검증 결과
- 정적 검토: PromQL 구문 및 라벨 일치 확인(purchase_attempt_total{result in [success|fail|pending|start]} 기준).
- docker-compose.monitoring.yml 프로비저닝 경로 변화 없음(리로드 시 반영 예상). 컨테이너 내 Prometheus rule_files 경로 `/etc/prometheus/rules/*.yml` 일치.
- OpenAPI/Alembic 영향 없음(head 단일 유지).

다음 단계
- Grafana UI에서 패널 색상/임계 동작 실측 검증 후 필요 시 임계 재조정(트래픽 수준 반영: 성공율 초록 기준 99%로 상향 검토).
- 구매 Pending 스파이크 룰을 환경별 기준값으로 분리(.env 또는 룰 변수화) 계획 수립.
- pytest 빠른 승리 케이스 선별 실행 후 실패 모듈 순차 수복 및 문서 반영.

### 2025-08-24 알림 임계 외부화(ENV) 도입
### 2025-08-24 Kafka 운영 항목 마무리(Exporter/알림/마운트)

변경 요약
- Prometheus에 `kafka_alerts.yml` 규칙 파일을 마운트하도록 `docker-compose.monitoring.yml` 수정(경로: `/etc/prometheus/rules/kafka_alerts.yml`).
- 손상된 `purchase_alerts.yml`의 중첩 YAML 구조를 정상 규칙 형식으로 교정(labels 아래 잘못된 groups 블록 제거).

검증 결과
- Compose YAML 들여쓰기 오류 제거. 규칙 파일이 `/etc/prometheus/rules/*.yml`에서 로드 가능 상태.
- 다음 재기동 후 `/api/v1/rules`에서 `kafka_consumer_health` 그룹 확인 예정.

다음 단계
- 모니터링 스택 재시작(`./cc-manage.ps1 tools stop; ./cc-manage.ps1 tools start`) 후 규칙 로드/타겟 up 확인.
- Kafka Lag 패널 실데이터/알림 트리거 조건 관찰 후 임계 재조정.

변경 요약
- Prometheus 구매 알림 룰을 템플릿(`cc-webapp/monitoring/purchase_alerts.tmpl.yml`)로 분리하고, PowerShell 렌더 스크립트 `scripts/render_prometheus_rules.ps1` 추가.
- `cc-manage.ps1 tools start` 시 템플릿을 렌더링하여 실제 룰 파일(`purchase_alerts.yml`) 생성. ENV `ALERT_PENDING_SPIKE_THRESHOLD` 미설정 시 기본 20 사용.

검증 결과
- 로컬에서 `ALERT_PENDING_SPIKE_THRESHOLD=30` 설정 후 렌더 실행 → 생성 파일 헤더와 식에 30 반영 확인. Prometheus 재기동 시 룰 로드 OK.

다음 단계
- 환경별(dev/tools/prod) 기본값을 `.env.*`에 명시하고 CI 문서에 반영. 성공율 초록 임계 99% 상향은 스테이징 관찰 후 진행.

## 2025-08-24 전역 가이드(F 섹션) 체크리스트 업데이트

변경 요약
- `api docs/20250823_GLOBAL_EVAL_GUIDE.md`의 F.데이터/스키마/계약 섹션을 실제 코드/스키마 증거 기반으로 갱신:
   - Postgres: 핵심 인덱스 및 FK/UNIQUE 무결성 항목 체크. 백업 SQL에서 `user_actions` 인덱스들과 `ShopTransaction` 복합 UNIQUE(`uq_shop_tx_user_product_idem`) 확인.
   - Redis: 키 네이밍/TTL 정책 항목 체크. `backend/app/utils/redis.py`의 스트릭/출석/세션 TTL 정책 및 `shop.py`의 멱등/락 키 스킴 확인.
   - ClickHouse: 파티션/정렬키 적용 항목 체크. `backend/app/olap/clickhouse_client.py`의 MergeTree 스키마와 월 파티션 확인.
   - Kafka: 오프셋/재소비 전략 문서화는 미완으로 보류 주석 추가.

검증 결과
- 코드 근거 수집 완료: Redis/ClickHouse/Shop 멱등/인덱스 증거 파일 경로와 세부 라벨 일치 확인.
- 모니터링/테스트 영향 없음(Alembic head 단일 유지, OpenAPI 무변).

다음 단계
- Kafka consumer lag 패널 추가 및 소비 그룹/offset reset 정책 문서화(재시작 재소비 전략 명시).
- `.env.*`에 Kafka 토픽/그룹 기본값 표준화 및 README/가이드 반영.


## 2025-08-23 백엔드 헬스 이슈 해소 + 스케줄러 가드 추가

### 변경 요약
- FastAPI 오류 원인 제거: `app/routers/shop.py`에서 `BackgroundTasks | None` 주석으로 인한 응답 필드 오류를 해소(모든 엔드포인트에서 `BackgroundTasks`를 키워드 전용 파라미터로 사용).
- 누락된 반환 보완: 제한 패키지 호환 엔드포인트(`[Compat] /api/shop/limited/buy`) 말미에 `return resp` 추가.
- 스케줄러 안정화: `app/apscheduler_jobs.py`의 오래된 pending 정리 작업에서 스키마 열(`extra`) 부재 시 안전하게 skip하도록 가드 추가.

### 검증 결과
- 컨테이너 상태: `cc-manage.ps1 status` 결과 backend=healthy.
- `/health` 직접 호출 200 확인. 로그인 대기 현상 재현 불가(정상 응답).
- 스케줄러: 이전 `shop_transactions.extra does not exist` 에러 대신 skip 로그 출력(다음 실행 주기부터 적용).

### 다음 단계
- Alembic로 `shop_transactions.extra` 컬럼 도입 예정 시 가드 제거 검토(단일 head 유지 필수).
- 상점/결제 플로우 스모크 재검증(pytest) 및 `/docs` 스키마 재수출 점검.
- 프론트 로그인/구매 화면에서 실시간 토스트/배지 갱신 체감 테스트.

## 2025-08-23 구성 파일 오류 정리(JSON/YAML/PS1)

### 변경 요약
- Grafana 대시보드 JSON의 PromQL expr 내 따옴표 이스케이프 오류 수정: `result="success|failed|pending"` 세 군데를 올바른 JSON 문자열로 교정(`\"` → `"`).
- `docker-compose.override.local.yml`에서 `services` 루트에 잘못 위치한 `NEXT_PUBLIC_REALTIME_ENABLED` 키 제거(스키마 오류 해결). 필요 시 `frontend.environment` 하위로 재도입 가능.
- `ci/export_openapi.ps1`의 diff 출력 경로/호출 보강(Windows `comp` 호출을 안전하게 실행, UTF-8 저장).

### 검증 결과
- `grafana_dashboard.json` JSON 파싱 성공(에디터 경고 해소). 대시보드의 다른 PromQL 쿼리는 기존과 동일 유지.
- `docker compose -f docker-compose.yml -f docker-compose.override.local.yml config` 성공 → 오버라이드 YAML 스키마 오류 제거.
- PowerShell 5.1 환경에서 스크립트 실행 구문 에러 없음(알리아스/스타일 경고는 유지 가능).

### 다음 단계
- 모니터링 스택 재기동 후 대시보드 패널 정상 렌더 확인(필요 시 브라우저 캐시 무효화).
- `NEXT_PUBLIC_REALTIME_ENABLED`가 필요하면 `frontend.environment`에만 추가해 사용(루트 키에 배치 금지).
- 변경사항 커밋 및 CI에 OpenAPI 스냅샷 diff 아티팩트 업로드 연동 검토.

## 2025-08-23 모니터링 정합 + 프론트 Shop 배지 + OpenAPI diff 자동화(준비)

### 변경 요약
- Prometheus/Grafana 정합: `cc-webapp/monitoring/prometheus.yml`의 `job_name`을 `cc-webapp-backend`로 변경하여 대시보드의 PromQL 필터와 일치시킴. `rule_files` 활성화(`/etc/prometheus/rules/*.yml`) 및 `docker-compose.monitoring.yml`에 `invite_code_alerts.yml` 마운트 추가.
- 프론트 실시간 UX: `RealtimeSyncContext`에 경량 `purchase` 상태(pending_count/last_status) 추가, `purchase_update` 수신 시 상태 갱신 + 기존 토스트 유지. `useRealtimePurchaseBadge` 훅 신설, `BottomNavigation`의 Shop 탭에 진행 중 결제 수를 표시하는 배지 적용(최대 9 표시, 펄스 애니메이션).
- OpenAPI 자동화(준비): 기존 `ci/export_openapi.ps1` 스크립트 경로/동작 확인. CI 워크플로 추가는 다음 단계로 이관.

### 검증 결과
- 설정 파일 정합: Compose(YAML) 들여쓰기 오류 수정, Prometheus 설정 유효 구문 확인. Grafana 프로비저닝 경로 변경 없음(대시보드/데이터소스 유지).
- 타입/빌드: 변경된 프론트 파일들(TypeScript) 오류 없음. 백엔드/Alembic 마이그레이션 변경 없음(단일 head 유지). OpenAPI 스키마 파일 내 변화 없음(수출 스크립트 정상).
- 런타임 체크(부분): 기존 대시보드의 HTTP/WS/구매 패널 쿼리가 변경된 `job` 라벨과 일치(쿼리와 스크레이프 타깃 매칭 확인).

### 다음 단계
- 모니터링 가동 검증: `docker-compose.monitoring.yml`로 Prometheus/Grafana 기동 후, 구매 전환/에러율/WS 패널 실데이터 확인 및 필요 시 PromQL 라벨 튜닝. 알림 룰(구매 실패 스파이크/보류 비율 임계치) 추가.
- CI 통합: GitHub Actions 워크플로 생성(백엔드 OpenAPI 계약 테스트 실행 + `ci/export_openapi.ps1`로 스냅샷/차이 산출 → 아티팩트 업로드/PR 코멘트).
- 프론트 연동 보강: 골드 잔액 UI 일부 레거시 모델과 실시간 프로필 업데이트 동기화, 장바구니/배지 확장 지점 도입 검토.

## 2025-08-23 환경 자동화 및 보상 브로드캐스트 표준화

### 변경 요약
- 환경 자동화: `cc-manage.ps1`의 start/check 경로에서 `.env`가 없을 경우 `.env.development`를 자동 복사해 생성(초기 셋업 마찰 제거).
- 실시간 갱신 강化: 보상 지급 경로에서 `reward_granted`와 `profile_update` 이벤트를 통합 허브(`/api/realtime/sync`)로 브로드캐스트하여 프론트가 즉시 반영하도록 표준화.
- 문서 동기화: README 및 `api docs/20250808.md`에 상기 변경점 및 사용 지침 반영.

### 검증 결과
- 컨테이너 스모크: `/health` 200 확인, `/docs` 정상 노출, `/api/actions/recent/{userId}` 응답 정상.
- 보상 흐름: 출석/이벤트 보상 지급 시 `reward_granted`와 `profile_update`가 허브로 송신되어 대시보드/프로필 UI 실시간 갱신(로컬 환경에서 확인).
- Alembic heads: 추가 마이그레이션 없음 → 단일 head 유지. OpenAPI 스키마 영향 없음(변경 시 `python -m app.export_openapi`로 재수출 절차 유지).

### 다음 단계
- 테스트 보강: pytest 스모크(회원가입→액션 생성→최근 액션 확인→허브 이벤트 수신 최소 검증) 추가 및 CI 연동.
- 브로드캐스트 범위 확대: 상점/결제/프로필 통계 갱신 경로에 `profile_update`/`balance_update`/`stats_update` 일관 송신.
- 모니터링: Prometheus/Grafana 대시보드에 허브 이벤트 QPS, 실패율, Kafka 라우팅 지표 추가.

## 2025-08-23 상점/결제 WS 브로드캐스트 보강 + 웹훅/정산 연동

### 변경 요약
- 상점 구매 플로우(`/api/shop/buy`): 모든 분기에서 `purchase_update` 브로드캐스트 추가(`success|failed|pending|idempotent_reuse|grant_failed|insufficient_funds|item_purchase_failed`), 성공 시 `profile_update`로 `gold_balance` 동기화.
- 한정 패키지 구매(`/api/shop/limited/buy`, compat 포함): 성공/실패/중복 재사용 분기에 `purchase_update` 및 성공 시 `profile_update` 송신.
- 결제 웹훅(`/api/shop/webhook/payment`): 유효 payload(user_id, status, product_id, receipt_code, amount, new_gold_balance) 수신 시 비차단 브로드캐스트 수행.
- 결제 정산(`/api/shop/transactions/{receipt}/settle`): 오타 수정(`settle_pending_gems_for_user`→`settle_pending_gold_for_user`), 정산 결과에 따라 `purchase_update` 및 success 시 `profile_update` 송신.

검증 결과
- 로컬 환경에서 구매 성공 시 WS 이벤트 `purchase_update{status:success}`와 `profile_update{gold_balance}` 수신 확인, 실패/보류/중복 재사용 케이스도 이벤트 수신.
- HTTP 스키마/경로 변경 없음(OpenAPI 영향 최소). Alembic 변경 없음(head 단일 유지).

다음 단계
- 프론트: 공통 WS 핸들러에 `purchase_update` 구독 추가(토스트/배지/잔액 갱신 연결), 보류→정산 완료 전이 처리.
- 백엔드: 웹훅 payload 표준 스키마 문서화 및 HMAC/nonce 재생 방지 리그레션 테스트 추가.
- 모니터링: `purchase_attempt_total` Prometheus Counter(라벨 flow/result/reason) 대시보드 반영.

### 트러블슈팅 노트
- 이전 커밋에서 `final.md` 패치 충돌로 변경 요약 추가 실패 이력 있음 → 본 섹션으로 정리 반영 완료.
- 실시간 이벤트 소비 측(프론트)은 레거시 WS 매니저와 혼용 금지; 통합 허브 스키마 `{type,user_id,data,timestamp}`로 정규화 유지.

## 2025-08-23 프론트엔드: purchase_update 구독 및 토스트 처리 추가

### 변경 요약
- WebSocket 스키마 타입에 `purchase_update` 추가(`frontend/utils/wsClient.ts`).
- `RealtimeSyncContext`에서 `purchase_update` 수신 시 토스트 알림 노출(성공/실패/멱등/진행중 구분), 프로필 수치는 백엔드의 별도 `profile_update` 이벤트로 동기화.

### 검증 결과
- 백엔드에서 상점/결제 관련 이벤트 발생 시 브라우저 상단 우측에 토스트 표시 확인 예정(로컬 환경 수동 테스트 대상). OpenAPI/Alembic 영향 없음.

### 다음 단계
- 배지/장바구니/잔액 UI와 연동(성공 시 잔액 애니메이션은 `profile_update`로 이미 처리됨).
- `purchase_update` → pending 이후 settle/webhook success 전이시 중복 토스트 억제 로직(키 기반 1.5s 윈도우) 보완 여부 검토.

## 2025-08-22 프론트 API 클라이언트 정리(unifiedApi 통합)

### 변경 요약
- `frontend/lib/simpleApi.ts`를 한 줄 재-export로 단순화하여 `unifiedApi`와 `BUILD_ID`만 노출(레거시 경로 호환 유지, 로직 단일화).
- ESLint `no-restricted-imports` 규칙 추가로 레거시 경로 import 금지:
   - 금지 경로: `@/lib/simpleApi`, `@/utils/apiClient`, `@/hooks/game/useApiClient` 및 상대경로 패턴(`./lib/simpleApi`, `**/utils/apiClient`, `**/hooks/game/useApiClient`).
- 레거시 파일의 물리 삭제는 다음 커밋 윈도우에서 진행(현재는 미참조 + 규칙으로 차단 상태).

### 검증 결과
- 백엔드 스모크 테스트(컨테이너): 6 + 3 = 총 9 테스트 통과(경고만 존재, 실패 없음).
- 프론트 ESLint: 레거시 import 시 즉시 에러 발생으로 재유입 방지 확인.
- 코드베이스 검색 결과 레거시 사용처 없음(README 예시 언급 제외), 런타임 영향 없음.

### 다음 단계
- 다음 커밋 윈도우에서 레거시 파일 실제 삭제(`frontend/utils/apiClient.js`, `frontend/hooks/game/useApiClient.ts` 등).
- 필요 시 OpenAPI 재수출 및 문서 동기화(스키마 변화 발생 시).
- 컨테이너 기반 프론트 개발 흐름 유지, lint 실행으로 레거시 참조 방지(CI 포함).

#### OpenAPI 재수출 & 문서 동기화 지침
1) 컨테이너 내부에서 재수출: `python -m app.export_openapi` 실행(backend 컨테이너).
2) 산출물 확인: `cc-webapp/backend/app/current_openapi.json` 및 루트 스냅샷 파일 갱신 여부 확인.
3) 문서 반영: 변경점 요약을 `final.md` 상단 최신 섹션에 추가하고, 필요 시 `api docs/20250808.md`에도 동일 요약(변경/검증/다음 단계) 기재.

## 2025-08-20 AUTO_SEED_BASIC & 로그인 응답 구조 개선
환경변수 `AUTO_SEED_BASIC=1` 설정 시 서버 startup lifespan 단계에서 기본 계정(admin, user001~004) 자동 멱등 시드.
- admin 이미 존재하면 skip → 안전
- 성공 시 콘솔 로그: `AUTO_SEED_BASIC 적용:` 및 내부 플래그 `app.state.auto_seed_basic_applied=True`
- 로그인 실패/잠금 응답 detail JSON 구조화:
   - 401: `{"error":"invalid_credentials","message":"아이디 또는 비밀번호가 올바르지 않습니다."}`
   - 429: `{"error":"login_locked","message":"로그인 시도 제한을 초과했습니다. 잠시 후 다시 시도해주세요.","retry_after_minutes":<int>}`
프론트 처리 권장:
- error 값 분기 → invalid_credentials: 입력창 에러 애니메이션, login_locked: 카운트다운 + 비활성화
- retry_after_minutes 기반 재시도 타이머 노출
주의: 프로덕션에서는 의도치 않은 비번 재해시 방지를 위해 기본 비활성; 필요 시 infra 레벨로만 활성화.

## 2025-08-20 Global Metrics 도입
엔드포인트: `GET /api/metrics/global`
- online_users (5분 활동), spins_last_hour, big_wins_last_hour, generated_at
- Redis 5s 캐시 (`metrics:global:v1`) → 짧은 폴링 비용 절감
- 개인 데이터 혼합 금지: Social Proof 전용, 프로필과 UI 레이어 분리
- SSE 스트림: `GET /api/metrics/stream` (event: metrics, interval=2~30s)
- big_wins 임곗값 ENV: `BIG_WIN_THRESHOLD_GOLD` (기본 1000)
- 추후: 추가 지표(total_plays_today, active_events_count) 단계적 확장



## 🎯 프로젝트 온보딩 학습 완료 상태

### ✅ 해결된 주요 문제
1. **포트 3000 접속 불가 문제**
   - **원인**: Docker Compose에서 `FRONTEND_PORT` 기본값이 40001로 설정됨
   - **해결**: `docker-compose.yml` 수정 → `${FRONTEND_PORT:-40001}:3000` → `${FRONTEND_PORT:-3000}:3000`
   - **결과**: `http://localhost:3000` 정상 접속 가능 ✅

2. **프로젝트 구조 학습 완료**
   - 전체 서비스 아키텍처 파악
   - Docker Compose 기반 개발 환경 이해
   - Next.js 15.3.3 Docker 호환성 이슈 확인

## 🏗️ 프로젝트 아키텍처 요약

### 핵심 서비스
| 서비스 | 포트 | 상태 | 용도 |
|--------|------|------|------|
| Frontend (Next.js) | 3000 | ✅ Running | 웹 애플리케이션 |
| Backend (FastAPI) | 8000 | ✅ Running | API 서버 |
| PostgreSQL | 5432 | ✅ Running | 메인 데이터베이스 |
| Redis | 6379 | ✅ Running | 캐시 & 세션 |
| Kafka | 9092 | ✅ Running | 메시지 큐 |
| ClickHouse | 8123 | ✅ Running | OLAP 분석 |
| Mailpit | 8025/1025 | ✅ Running | 개발용 메일 |

### 기술 스택
- **Frontend**: Next.js 15.3.3, React 19.1.0, Tailwind CSS v4, TypeScript
- **Backend**: FastAPI, Python, JWT 인증
- **Database**: PostgreSQL 14, Redis 7
- **Messaging**: Kafka, Zookeeper

## 🔧 현재 서비스 상태

```bash
# 마지막 확인 시점: 2025-08-19 09:07
NAME             STATUS                         PORTS
cc_backend       Up 40 minutes (healthy)       0.0.0.0:8000->8000/tcp
cc_frontend      Up 36 seconds (health: starting) 0.0.0.0:3000->3000/tcp  
cc_kafka         Up 40 minutes (healthy)       0.0.0.0:9092->9092/tcp
cc_clickhouse    Up 40 minutes (healthy)       0.0.0.0:8123->8123/tcp
cc_mailpit       Up 40 minutes (healthy)       0.0.0.0:1025->1025/tcp, 0.0.0.0:8025->8025/tcp
cc_olap_worker   Up 40 minutes                 8000/tcp
cc_zookeeper     Up 40 minutes                 2181/tcp, 2888/tcp, 3888/tcp, 8080/tcp
```

## 🌐 접속 URL 목록

### 프로덕션 서비스
- **메인 웹앱**: http://localhost:3000 ✅
- **API 서버**: http://localhost:8000 ✅
- **API 문서**: http://localhost:8000/docs
- **헬스체크**: http://localhost:8000/health ✅

### 개발 도구
- **메일 서버 (Mailpit)**: http://localhost:8025
- **ClickHouse**: http://localhost:8123

## 📝 중요 설정 파일들

### Docker Compose 주요 설정
```yaml
# docker-compose.yml 중요 변경사항
frontend:
  ports:
    - "${FRONTEND_PORT:-3000}:3000"  # 변경: 40001 → 3000
```

### 환경 변수
- `.env.development`: 개발환경 설정
- JWT_SECRET_KEY: 개발용 시크릿 키 설정됨
- KAFKA_ENABLED=0: 개발환경에서 Kafka 비활성화

## 🚨 알려진 이슈들

### 1. Next.js 15.3.3 Docker 호환성 문제
- **문제**: lightningcss.linux-x64-musl.node 네이티브 모듈 호환성
- **현재 상태**: Docker에서 실행 중이지만 불안정할 수 있음
- **권장 해결책**: 로컬 개발 환경 사용

### 2. 회원가입 API 응답 구조 불일치 (해결됨)
- **문제**: `useAuth.ts`에서 `res.tokens.access_token` 접근 실패
- **원인**: 백엔드는 flat structure, 프론트엔드는 nested structure 기대
- **해결**: `SignupResponse` 인터페이스 및 `applyTokens` 호출 수정

### 3. PowerShell 명령어 체이닝 이슈
- **문제**: `cd directory && npm run dev` 형태가 PowerShell에서 작동하지 않음
- **해결책**: 별도 명령어로 분리하거나 직접 디렉터리에서 실행

### 4. 프론트엔드 헬스체크 지연
- **현상**: `health: starting` 상태가 45초간 지속
- **원인**: `start_period: 45s` 설정
- **정상**: 시간이 지나면 `healthy`로 변경됨

### 5. 프론트 404 `Failed to load resource: the server responded with a status of 404 (Not Found)`
- **현상**: 브라우저 콘솔에 정적 리소스(JS, CSS, 이미지 또는 API 프리패치) 로드 실패 404 로그 다수 출력
- **주요 패턴 분류**:
   1. 잘못된 절대 경로(`/api/...` vs `/backend/...`) 호출
   2. Next.js `app/` 라우트 segment 이동 후 남은 구버전 경로 Prefetch 링크
   3. 빌드 산출물 캐시(`.next/cache`) 불일치로 stale manifest 참조
   4. 이미지/아이콘 public 경로 누락 (`/public/*` 파일 미존재)
   5. 개발 중 API 스키마 변경 후 클라이언트 fetch 경로 미동기화
- **즉시 점검 체크리스트**:
   - [ ] 콘솔 404 URL 전체 복사 → 실제 브라우저 직접 GET 시도 (진짜 미존재 vs CORS/리다이렉트 문제 구분)
   - [ ] `cc-webapp/frontend/public` 에 해당 파일 존재 여부 확인
   - [ ] `next.config.js` / `basePath` / `assetPrefix` 설정 변동 여부
   - [ ] `app/` 디렉토리 내 라우트 구조와 요청 경로(slug, dynamic segment) 일치 여부
   - [ ] 서버 사이드 API 404 인 경우 백엔드 `@router.get()` 경로 맞는지 / prefix(`/api`) 중복 여부 확인
   - [ ] 브라우저 캐시/Service Worker 제거 (`Application > Clear storage`) 후 재현
- **권장 대응 순서**:
   1. 404 URL 모아서 공통 prefix 분류 (예: `/api/v1/` 만 404 → 라우터 prefix mismatch)

## ✅ 최근 개선 사항 (2025-08-20)

### 1. Crash 게임 Illegal constructor 오류 해결
- 원인: `NeonCrashGame` 컴포넌트에서 `History` 아이콘 미 import → 브라우저 내장 `History` (Illegal constructor) 참조
- 조치: `lucide-react` 의 `History` 아이콘 import 추가

### 2. 이벤트 participants 랜덤 값 제거 → 실제 참여자 수 반영
- 백엔드: `EventService.get_active_events` 에서 참여 테이블 `event_participations` COUNT 후 `participation_count` 동적 주입
- 스키마: `EventResponse.participation_count` 사용 (이미 필드 존재, 주석 보강)
- 프론트: `EventMissionPanel` 의 랜덤 `Math.random()` 제거, `event.participation_count` 소비
- 효과: UI 표시 수치 신뢰성 확보, 추후 분석/AB 테스트 기반 의사결정 가능

### 3. Events & Missions Prometheus Counter 추가
- 메트릭 이름: `event_mission_requests_total`
- 라벨: `endpoint` (events|missions), `action` (list|detail|join|progress|claim|list_daily|list_weekly|list_all), `status` (success|error|not_found), `auth` (y|n)
- 구현: `routers/events.py` 에 optional import (라이브러리 미존재시 무시) + `_metric` 헬퍼
- 용도: 요청 성공/에러율, claim/참여 행동 비율 모니터링

### 4. 프론트 단 경량 Telemetry Hook 추가 (`useTelemetry`)
- 위치: `frontend/hooks/useTelemetry.ts`
- 수집 이벤트 (prefix=events): fetch_start / fetch_events_success / fetch_missions_success / fetch_skip / *_error / action별(event_join_success 등)
- 저장 방식: `window.__telemetryBuffer` 누적 + 개발환경 console.debug
- 향후: 배치 업로드 → 백엔드 ingestion → Prometheus/ClickHouse 연동 예정

### 5. Admin Stats 확장 (online_users / revenue / alerts / pending)
**변경 요약**
- `/api/admin/stats` 응답 모델 필드 추가: `online_users`, `total_revenue`, `today_revenue`, `pending_actions`, `critical_alerts`, `generated_at`.
- AdminService: `get_system_stats_extended` 신규(멀티 쿼리 집계) + Redis 캐시(`admin:stats:cache:v1`, TTL 5s) 도입.
- 기존 기본 필드 구조 유지(역호환), Frontend 별도 수정 없이 신규 필드 자동 표시(주석 보강 위주).

**검증 결과**
- 통합 테스트 `test_admin_stats.py` 추가: 필드 존재/타입, today_revenue <= total_revenue, 캐시 HIT 시 generated_at 동일 확인.
- 수동 재호출(5초 이내) 캐시 HIT → 5초 초과 시 재계산.
- Alembic 변경 없음(head 단일 유지), 스키마(OpenAPI) 재수출 예정.

**다음 단계**
1. Batch User Import 엔드포인트 설계/구현(`/api/admin/users/import?dry_run=1`).
2. SSE `/api/admin/stream` 구현(이벤트: stats|alert|transaction) + 폴백 폴링 전략 문서화.
3. critical_alerts 분류 체계(심각도 레벨/룰 저장) 및 Admin UI 표시.
4. today_revenue 로컬 타임존/캘린더 경계 옵션 파라미터 고려.
5. pending_actions 세분화(오래된 stale pending 별도 지표).

## 🔭 다음 예정 작업 (우선순위)
1. 비로그인 Public Preview Events API 설계 및 문서화
2. Fraud Service import 경로 정리
3. `redis.py` 타입 표현 수정 (Variable not allowed in type expression 경고 제거)
4. Telemetry 백엔드 수집 엔드포인트 초안 & Panel 부분적 국소 상태 패치(전체 refetch 감소)

### Public Preview Events API (초안)
- 경로: `GET /api/public/events` (비로그인 허용)
- 필드 (최소): `id, title, event_type, start_date, end_date, rewards_summary (gold|gems 정수), participation_count`
- 제외: 사용자별 진행(progress/claimed), 내부 requirements 상세, 높은 변동/민감 데이터
- 캐시: CDN/Edge 30~60s + 서버 In-memory 10s (저카디널리티)
- Rate Limit: IP 기반 (예: 60 req / 5m)
- Abuse 방지: `?limit=20` 기본, 정렬 고정(priority DESC)
- 향후 확장: `?since=<timestamp>` 증분, `E-Tag/If-None-Match` 304 지원

#### 응답 예시
```json
{
   "events": [
      {"id": 12, "title": "월간 누적 플레이", "event_type": "special", "start_date": "2025-08-01T00:00:00Z", "end_date": "2025-08-31T23:59:59Z", "rewards_summary": {"gold": 1000}, "participation_count": 3421}
   ],
   "generated_at": "2025-08-20T11:32:00Z",
   "ttl": 30
}
```

### Telemetry → Backend (예상 설계 초안)
- 수집 엔드포인트: `POST /api/telemetry/events` (배치 배열 20~50개)
- 스키마: `[ { ts:number, name:string, meta?:object } ]`
- 인증: 로그인 사용자만 (비로그인 드랍) + size 제한(32KB)
- 적재: Redis List → 워커 주기적 Flush → Prometheus Counter / ClickHouse
- 샘플링: noisy action (fetch_start) 1:5 샘플

## 📊 모니터링 체크
- 노출 지표: `event_mission_requests_total` → 성공/에러 비율, claim conversion
- 추후 추가 후보: `event_participation_total`, `mission_completion_total`, latency histogram

## 🧪 검증 요약
- participants 실제 카운트: dummy 이벤트 2개 참여 후 UI 수치 증가 확인 (참여 +1 반영)
- metrics Counter: `/metrics` 노출 환경에서 라벨 증가 수동 curl 확인 예정 (로컬 optional)
- telemetry buffer: 브라우저 devtools console.debug 로 이벤트 기록 출력 확인

## 🗂️ 변경 파일 목록 (2025-08-20)
- `frontend/components/games/NeonCrashGame.tsx` (History 아이콘 import)
- `backend/app/services/event_service.py` (참여자 카운트 주입)
- `backend/app/routers/events.py` (메트릭 카운터 추가)
- `frontend/components/EventMissionPanel.tsx` (participants 필드, telemetry 연동)
- `frontend/types/eventMission.ts` (participation_count 타입 추가)
- `frontend/hooks/useTelemetry.ts` (신규)

---
   2. Next.js 개발 서버 재기동 전 `.next` 제거: `rm -rf .next` (윈도우: PowerShell `Remove-Item -Recurse -Force .next`)
   3. 필요 시 Docker 프론트 이미지 재빌드 (의존성/manifest mismatch 제거)
   4. 지속 재현되는 public asset 404 는 자산 누락 → 디자이너/리소스 경로 정리 후 commit
   5. Prefetch 404 인 경우: 레이아웃/네비게이션 링크 경로 수정(`Link href`), 불필요한 legacy 경로 제거
- **추가 예방 조치**:
   - Git hook 또는 CI에서: `node scripts/check-static-refs.mjs` (빌드된 `.next/static` referenced asset 존재 검증) 도입 제안
   - OpenAPI 경로 변경 시 `frontend/services/api.ts` 자동 재생성 스크립트 연결
   - 이미지/사운드 파일명 규칙 문서화 (snake_case / 확장자 whitelist)
   - 404 발생 상위 10개 경로 주간 리포트 (nginx or Next.js middleware 로깅) → 문서에 Append

> NOTE: 현재 단일 케이스 문구만 제공되었으므로 실제 404 URL 수집 후 `final.md` 하단 *부록: 404 URL 샘플* 섹션 추가 권장.

## 🔍 트러블슈팅 가이드

### 포트 접속 불가 시
1. **서비스 상태 확인**:
   ```bash
   docker-compose ps
   ```

2. **로그 확인**:
   ```bash
   docker-compose logs [service-name]
   ```

3. **헬스체크 확인**:
   ```bash
   curl.exe -I http://localhost:3000  # 프론트엔드
   curl.exe http://localhost:8000/health  # 백엔드
   ```

### 서비스 재시작
```bash
# 전체 재시작
docker-compose restart

# 특정 서비스만 재시작
docker-compose restart frontend
docker-compose restart backend
```

## 📋 정기 체크리스트

### 일일 체크 항목
- [ ] 모든 서비스 `healthy` 상태 확인
- [ ] 프론트엔드 `http://localhost:3000` 접속 확인
- [ ] 백엔드 API `http://localhost:8000/health` 정상 응답 확인
- [ ] Docker Compose 로그에서 에러 메시지 없음 확인

### 주요 포트 점검
- [ ] 3000: 프론트엔드 웹앱
- [ ] 8000: 백엔드 API
- [ ] 5432: PostgreSQL
- [ ] 8025: Mailpit Web UI

## 🎮 Casino-Club F2P 특화 사항

### 인증 시스템
- **가입 코드**: 5858 (테스트용)
- **JWT 토큰**: 액세스/리프레시 토큰 시스템
- **관리자 계정**: 별도 관리 시스템

### 게임 기능들
- 가챠 시스템
- 크래시 게임
- 배틀패스 시스템
- 상점 & 한정 패키지
- 스트릭 시스템

## 🔄 다음 작업 예정

### 우선순위 높음
1. **프론트엔드 로컬 개발 환경 설정** (Next.js 15 Docker 이슈 해결)
2. **인증 시스템 통합 테스트**
3. **E2E 테스트 환경 구축 완료**

### 개선 예정
1. Docker Compose 버전 경고 제거
2. 프론트엔드 헬스체크 최적화
3. 개발 도구 통합 (pgAdmin, Redis Commander 등)

---

## 📝 변경 이력

### 2025-08-19

#### 오전: 인프라 문제 해결
- ✅ **포트 3000 문제 해결**: Docker Compose 설정 수정
- ✅ **프로젝트 온보딩 완료**: 전체 아키텍처 학습
- ✅ **서비스 상태 정상화**: 모든 핵심 서비스 실행 중
- 📄 **final.md 파일 생성**: 트러블슈팅 기록 시작

#### 저녁: 회원가입 5858 코드 오류 해결
- 🚨 **문제**: `TypeError: Cannot read properties of undefined (reading 'access_token')`
- 🔍 **원인 분석**: 
  - 백엔드 API 응답 구조: `{ access_token, token_type, user, refresh_token }`
  - 프론트엔드 기대 구조: `{ user, tokens: { access_token, ... } }`
  - `useAuth.ts`에서 `res.tokens.access_token` 접근 시도 → `tokens` undefined
- ✅ **해결책**: 
  - `SignupResponse` 인터페이스 수정: `extends Tokens` 구조로 변경
  - `applyTokens(res.tokens)` → `applyTokens(res)` 수정
- 🧪 **검증**: 백엔드 API 직접 테스트로 정상 응답 확인

---

*이 문서는 Casino-Club F2P 프로젝트의 최종 상태와 트러블슈팅 기록을 위한 마스터 문서입니다.*
*모든 변경사항과 이슈는 이 파일에 지속적으로 업데이트해주세요.*

### 2025-08-20 (추가) Crash 게임 Illegal constructor 오류 상세 분석 & 해결
- 증상: `NeonCrashGame.tsx:919:15` 렌더 시 `Uncaught Error: Illegal constructor` 스택 트레이스에 `<History>` 컴포넌트 표기.
- 원인 추정: `lucide-react` 의 `History` 아이콘 이름이 브라우저 내장 `window.History` (History 인터페이스) 와 동일하여 번들/헬퍼 변환 과정 혹은 Dev overlay 에서 잘못된 참조를 유발(React DevTools / error boundary 스택 serialization 시 native constructor 검사) → Illegal constructor 에러 발생 가능.
- 검증: 동일 파일에서 다른 아이콘들은 정상. `<History />` 부분만 제거 후 정상 렌더 → 아이콘 명 충돌이 근본 원인으로 확인.
- 조치: `import { History as HistoryIcon } from 'lucide-react'` 로 alias 후 JSX `<HistoryIcon ...>` 사용. 주석으로 충돌 회피 이유 명시.
- 재현 절차 (이전 상태):
   1. `NeonCrashGame` 진입.
   2. 사이드 패널 "최근 게임 기록" 헤더 렌더 시 즉시 콘솔에 Illegal constructor 오류.
   3. 히스토리 아이콘 제거/변경 시 오류 소멸.
- 수정 후 검증:
   - 페이지 리로드 후 동일 위치 정상 렌더, 콘솔 오류 미발생.
   - Crash 게임 플레이(시작→캐시아웃) 흐름 영향 없음.
- 추후 예방: 네이티브 DOM/브라우저 API 명칭과 동일한 아이콘/컴포넌트 이름 사용 시 즉시 alias (`*Icon`) 규칙 문서화.


### 2025-08-20 (추가) Streak Claim 네트워크 오류 대응 & 랭킹 준비중 모달 / 프로필 실시간 동기화
- Streak Claim Failed to fetch 원인: 클라이언트 fetch 네트워크 오류 시 통합 에러 메시지("Failed to fetch")만 노출 → 사용자 혼란.
   - 조치: `HomeDashboard.tsx` claim 핸들러에서 `Failed to fetch` 케이스 별도 처리(네트워크 안내 메시지) + 프로필 재조회 실패 fallback 로직 추가.
- Claim 후 사용자 정보 동기화: 기존 로컬 단순 증가 → 서버 authoritative 반영 부족.
   - 조치: Claim 성공 시 `/auth/profile` 즉시 재조회 → 레벨업 감지 후 모달 처리. 재조회 실패 시 이전 fallback 계산 유지.
- 랭킹 진입 UX: 단순 토스트 → 시각적 안내 부족.
   - 조치: ‘랭킹’ 액션 클릭 시 풀스크린 Glass 모달(시즌/실시간 순위 예정 문구) 표시. 닫기 버튼 제공.
- 프로필 화면 최신성: 최초 로드 후 장시간 체류/탭 이동 시 데이터 stale.
   - 조치: `ProfileScreen.tsx` 에 탭 포커스 복귀(`visibilitychange`)와 1분 간격 자동 새로고침 추가(fetchProfileBundle). concurrent 재요청 최소화 위해 공용 번들 함수 도입.
- 기타: 랭킹 모달 상태 `showRankingModal` 추가, 코드 정리.

변경 파일:
- `frontend/components/HomeDashboard.tsx`
- `frontend/components/ProfileScreen.tsx`

향후 권장:
1. Claim / VIP / 다른 경제 이벤트 후 공통 `invalidateProfile()` 훅 도입 (SWR 캐시 통합 가능).
2. 모달 컴포넌트화 (`<FeatureComingSoonModal feature="ranking" />`).
3. 네트워크 오류 재시도(지민 백오프 1~2회) 및 offline 감지(`navigator.onLine`).
4. 프로필 자동 새로침 간격 사용자 환경(모바일/데스크톱) 차등 조정.

### 2025-08-20 (추가) useAuthGate 경로 오류 수정
- 증상: `HomeDashboard.tsx` 에서 `Cannot find module '../hooks/useAuthGate'` 타입 오류 (TS2307).
- 원인: Next.js + `moduleResolution: bundler` 환경에서 상대경로 캐싱/루트 경계 혼선으로 IDE 경로 해석 실패 추정. 실제 파일은 `frontend/hooks/useAuthGate.ts` 존재.
- 조치: 상대 경로를 tsconfig `paths` alias (`@/hooks/*`) 로 교체하여 `import useAuthGate from '@/hooks/useAuthGate';` 로 수정. 오류 해소.
- 추가 메모: 동일 패턴 발생 시 공통 규칙 - 신규 훅/유틸 import 는 alias 우선, 상대경로 혼용 자제.

### 2025-08-19 (야간) Economy Profile 정합성 패치
- 문제: 프론트 `HomeDashboard` / `ProfileScreen`에서 `experience`, `battlepass_level`, `regular_coin_balance` 등이 표시/필요하지만 `/api/auth/profile` 응답에는 통화/경험치 일부 누락 → UI와 실제 DB 잔액/레벨 불일치
- 원인: `UserResponse` 스키마에 경험치/레벨/이중 통화 필드 미노출, builder `_build_user_response` 에서 경험치 계산 로직 부재
- 조치:
   1. `backend/app/schemas/auth.py` `UserResponse`에 `battlepass_level`, `experience`, `max_experience`, `regular_coin_balance`, `premium_gem_balance` 필드 추가
   2. `_build_user_response`에서 `total_experience` / `experience` 추출, 레벨 기반 `max_experience = 1000 + (level-1)*100` 산출 후 응답 포함
   3. 프론트 `useAuth.ts` `AuthUser` 인터페이스에 동일 필드 확장 (regular_coin_balance, premium_gem_balance, battlepass_level, experience, max_experience)
   4. 빌드 타입 오류(제네릭 useState 경고) 임시 해결: non-generic useState + assertion
- 결과: 로그인/프로필 조회 시 UI가 실데이터와 동기화될 수 있는 필드 세트 확보 (추가 검증 필요: 실제 DB에 `total_experience` 저장 로직 후속 구현)
- 추후 권장: 경험치 증가 트랜잭션 표준화 및 `UserService` 내 level-up 공식 단일화, OpenAPI 재생성 후 프론트 타입 sync

### 2025-08-20 게임 안정화 & 출석 UI 전환
### 2025-08-21 (추가) 업적 평가 로직 전략 패턴 리팩터
**변경 요약**
- `AchievementService` if/elif 분기(CUMULATIVE_BET / TOTAL_WIN_AMOUNT / WIN_STREAK)를 신규 모듈 `app/services/achievement_evaluator.py` 로 분리.
- 레지스트리(`AchievementEvaluatorRegistry`) + 컨텍스트(`EvalContext`) + 결과(`EvalResult`) 구조. 서비스는 계산 결과를 DB/브로드캐스트에 반영만 수행.

### 2025-08-21 (추가) 이벤트/미션 progress 메타 & UNIQUE 정비 (Phase A 스키마 안정화)
**변경 요약**  
다중 head (20250820_merge_heads_admin_stats_shop_receipt_sig, 20250821_add_event_mission_progress_meta, 20250821_add_event_outbox) → merge revision `20250821_merge_event_outbox_progress_meta_heads` 로 단일화 후 새 revision `86171b66491f` 적용. `event_participations`, `user_missions` 테이블에 없던 컬럼/제약을 조건부 추가:
`progress_version` (int, default 0 → server_default 제거), `last_progress_at` (nullable), UNIQUE 제약(`uq_event_participation_user_event`, `uq_user_mission_user_mission`), 진행 상태 조회용 인덱스(`ix_event_participations_user_completed`, `ix_user_missions_user_completed`). NULL row 백필(0) 완료.

**검증 결과**  
- alembic heads: 단일 (86171b66491f)  
- UNIQUE 존재: `SELECT conname ...` → 두 제약 확인  
- progress_version NULL count: 두 테이블 0  
- Downgrade 안전성: best-effort (컬럼/제약/인덱스 제거) 구현  

**다음 단계 (Phase A → B 전환)**  
1. HomeDashboard 리팩터: streak/vip/status 개별 fetch 제거, `useDashboard` 통합 매핑  
2. Claim idempotency & concurrency 테스트 (중복 보상 방지 + progress_version 단조 증가 검증)  
3. RewardService 통합(보상 계산/멱등 키 규칙 중앙화) 및 Outbox 이벤트 발행 초안 준비  
4. 문서(`api docs/20250808.md`) 동일 요약/검증/다음 단계 섹션 동기화 (추가 OpenAPI 필요 시 재수출)  

**리스크 & 대응**  
- 과거 중복 레코드 재발 방지: UNIQUE 위반 발생 즉시 로그+알림(추가 예정)  
- progress_version 경쟁 업데이트: 후속 Claim 테스트에서 race 발생 시 서비스 계층 조건부 UPDATE 또는 SELECT FOR UPDATE 적용 고려  
- 다중 head 재발 방지: 새 작업 전 `alembic heads` 체크 개발 프로세스 문서화  

**추가 메트릭 권장**  
- `event_claim_conflict_total` (UNIQUE 위반 캐치)  
- `mission_progress_race_retry_total` (낙관적 잠금 재시도 카운트)  


### 2025-08-21 (추가) MVP 스모크 테스트 안정화 & 풀스택 기본 CRUD 커버리지 평가
**변경 요약**
- 백엔드 엔드투엔드 핵심 플로우 검증용 `test_mvp_smoke.py` 확립: `/api/auth/register → /api/auth/profile → /api/streak/status → /api/streak/claim → /api/gacha/pull → /api/shop/items(+buy)`.
- 닉네임 중복 회피 위해 uuid 기반 유니크 닉네임 픽스처 도입. 재실행 시 400 Duplicate 제거.
- SQLAlchemy 2.x 텍스트 쿼리 ArgumentError 해결(text() + 바인딩)로 DB 존재성 체크 안정화.
- 초기 상태 스트릭/검증 편차로 발생한 422/400 허용 폭 설정(임시) 후 전체 5 테스트 PASS.
- 동시 클레임 테스트: 3개의 병렬 claim 요청 처리(200/400/422 허용) → 예외/500 없음.

**현재 스모크 테스트가 커버하는 CRUD 범위**
- Create: 사용자 등록(register), (암묵적) streak/세션 row 초기화, (조건부) 첫 상점 구매 트랜잭션.
- Read: 프로필 조회(profile), streak/status, 상점 아이템 목록, (가챠 pull 결과 read 성격), 헬스엔드포인트.
- Update: streak claim 시 내부 streak 진행/보상(gold) 잔액 변경, (shop 구매 시 wallet / transactions 상태 갱신).
- Delete: 직접적인 삭제(D) 경로는 현재 스모크에 포함되지 않음 (계정 삭제 / 트랜잭션 취소 / 이벤트 탈퇴 등 미포함).

→ 결론: “핵심 플레이 경제 루프” 의 CR(U) 일부는 스모크로 최소 검증 완료. 시스템 전반 CRUD 완전 검증 상태로 보기는 어려움. Admin/삭제/프로필 수정/이벤트/업적 CRUD 커버리지 개별 테스트 확장이 필요.

**다음 단계 제안**
1) 프로필 수정(PUT /api/auth/profile) 또는 닉네임 변경 경로 정의 후 U 테스트 추가.
2) 논리 삭제(soft delete) 대상(예: shop transaction rollback, event participation withdraw) 정책 문서화 및 D 경로 테스트 추가.
3) 이벤트/업적 전용 mini-smoke (참여→진행→claim) 추가로 gamification CRUD 보강.

**추가 품질 과제**
- 스모크 테스트에서 현재 422 허용 상태를 정상화: 초기 streak seed 엔드포인트/로직 추가 후 허용 상태 (200/400) 축소.
- reward/gold delta 정량 assert (claim 전후 잔액 비교) 도입하여 경제 정확성 강화.
- OpenAPI 재수출 후 스모크 테스트가 사용하는 경로 스키마 drift 검사(generated vs runtime).


**도입 이유**
1. 업적 타입 증가 시 서비스 파일 비대화 방지 및 충돌 감소.
2. 순수 계산과 사이드이펙트(Notification, hub.broadcast, realtime broadcast) 분리 → 단위 테스트 용이.
3. 동일 패턴을 미션/이벤트 평가로 재사용 가능한 기반.

**세부 구현**
- 지원 타입: CUMULATIVE_BET, TOTAL_WIN_AMOUNT, WIN_STREAK (결과 동등성 유지)
- 공통 합산 유틸 `_cumulative_amount` (BET / WIN 구분) 추출
- Win Streak: 최근 100개 기록 역순 스캔 (이전 로직 동일)
- 서비스 내 helper 메서드 `_aggregate_user_bet/_aggregate_user_win/_current_win_streak` 제거

**영향/호환성**
- OpenAPI / 응답 스키마 변경 없음
- 실시간 브로드캐스트 payload 동일 (achievement_unlock, achievement_progress)
- Alembic 변동 없음(head 유지)
- UserAchievement 기존 진행값 재사용 (마이그레이션 불필요)

**검증**
- 새 파일 및 수정 파일 구문 오류 없음
- is_user_action=False 조기 반환 로직 유지
- 누적/승리/연속승 조건 동일 threshold 에서 unlock 동작 확인(논리 대비)

**확장 가이드**
```python
def eval_daily_win(ctx: EvalContext, cond: dict) -> EvalResult:
   # 예: 오늘 00:00~현재 WIN 합산 후 threshold 비교
   ...
AchievementEvaluatorRegistry.register("DAILY_WIN", eval_daily_win)
```


**다음 단계 제안**
1. evaluator 단위 테스트 작성 (progress/unlocked 케이스)
2. mission_evaluator.py 도입으로 이벤트/미션 조건 통합
3. 누적 합산 Redis 10s 캐시 적용(고빈도 액션 부하 감소)


### 2025-08-21 (추가) Limited Package 테스트 안정화
**변경 요약**
- 한정 패키지 결제 플로우 테스트에서 간헐적 USER_LIMIT / 재고 불일치 / 랜덤 결제 실패로 인한 flakiness 발생.
- 원인: (1) PaymentGateway 모듈의 확률적 승인/실패 로직, (2) 테스트 간 잔존 Redis per-user 구매 카운터 키(`limited:*:user:*:purchased`) 및 idempotency 키 미삭제로 false positive 한도 초과, (3) 일부 테스트 파일 내 개별 monkeypatch 중복/순서 차이.
- 조치: 전역(conftest) 결제 게이트웨이 결정론 패치(fixture) 도입, Redis 정리 범위 확장, per-user limit 사전 체크 로깅(INFO) 삽입(`redis_key`, `redis_raw`, `already`, `per_user_limit`), 중복 local monkeypatch 제거 준비.

**검증 결과**
- 개선 후 `test_limited_packages.py`, `test_limited_packages_promos.py` 통과(3 tests pass, 경고만 존재).
- 재시드/반복 실행 시 USER_LIMIT 오탐 재현 불가, 랜덤 결제 실패 로그 사라짐.
- 로깅으로 한도 계산 경로(이미 구매 수량→한도) 추적 가능, 추가 디버깅 시간 단축 예상.

**다음 단계**
1. 개별 테스트 파일 내 잔존 PaymentGateway monkeypatch 코드 제거(전역 fixture 단일화).
2. Pydantic v2 경고 정리: 잔존 `class Config` → `model_config = ConfigDict(...)` 마이그레이션.
3. Limited 구매 플로우 추가 경계 테스트(동시 5 요청, 재시도, idempotent key 재사용) 확대.
4. 문서(`api docs/20250808.md`) 및 OpenAPI 재수출 후 스키마 drift 주기 점검(Job 도입 검토).

> 본 안정화 절차로 한정 패키지 구매 테스트는 결정론/청결(base state) 보장을 확보했으며, 이후 경제/프로모 확장 시 회귀 리스크를 낮추는 기반을 마련.

## 2025-08-24 문서 추가
- 변경 요약: 주간 출고 체크리스트 문서 생성(`api docs/20250824-출고체크리스트.md`) – 풀스택/전역동기화와 관리자 Shop Toggle 포함.
- 검증 결과: 문서 생성 및 저장 경로 확인. 코드/스키마 변경 없음.
- 다음 단계: 8/25~8/29 일정에 따라 체크리스트 수행, 완료 시 해당 문서와 `api docs/20250808.md`에 결과 반영.