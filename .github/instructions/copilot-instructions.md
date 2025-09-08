# 📘 Casino-Club F2P 통합 AI 운영 지침 (최신 문서 통합판)

최신 문서(우선순위: 날짜 최신 > 명시적 상위 선언 > 기존 규칙) 반영. 본 파일은 AI 에이전트(코드/문서/운영 자동화) 수행 표준 단일 소스이며 중복 지침 신규 생성 금지. 변경 시 본 파일 최상단에 날짜/요약 1줄 Append.

---
## 🆕 최신 통합 변경 로그 (append 역순)
- 2025-09-08: 레거시 1.instructions.md / 2.instructions.md 출처 참조 섹션(§24) 추가(내용은 모두 본 파일에 흡수, 중복 방지 정책 유지).
- 2025-09-08: 인증/출고체크리스트/게임통계전역통합/레벨·스트릭 간소화/WS 이벤트 스키마/릴리스 게이트 반영, 통합 규칙 재정렬.

---
## 1. 목적
안정성(테스트 그린 & Alembic 단일 head) · 일관성(단일 엔드포인트/중복 제거) · 운영 재현성(문서/스키마 동기화) · 실시간 동기화 신뢰성(WS+폴백) · 경제/보상 멱등 보장을 모든 작업의 1차 판단 기준으로 함.

## 2. 절대 우선 순위 (차례 고정)
1) 빌드/테스트/마이그레이션 무결성 2) 데이터 정합 & 멱등 3) 보안/JWT/권한 4) 중복 제거(Alembic/라우터/훅) 5) 실시간/WS-폴백 일관성 6) 문서/OpenAPI/지침 동기화 7) 성능/SLO(p95/p99) 8) 확장성(새 게임/이벤트) 9) 관측/모니터링 10) 가독성/리팩터링.

## 3. 문서/정보 출처 우선순위
1) api docs/ (최신 날짜) 2) 본 파일 3) 개선안2.md 4) 전역동기화_솔루션.md 5) 20250824-출고체크리스트.md 6) 프로젝트 구조/아키텍처 가이드 7) 레거시 instructions/*. 상충 시 최신 날짜 & 명시적 override 문구 우선.

## 4. 핵심 품질 게이트
- Build/Lint/Test: FE 빌드 PASS, ESLint 위반 0, BE pytest 전체 Green.
- Alembic: `alembic heads` == 1 (현재 head 주석 유지). 다중 head → 즉시 merge revision.
- 런타임: /health 200, /docs 200, 인증 401→로그인→200 흐름 검증.
- OpenAPI: 소스에서 재수출(`python -m app.export_openapi`) 후 스냅샷 차이 최소화.
- 성능(SLO 기본): 성공률 ≥99.5%, p95 < 400ms, p99 < 800ms, 구매 실패율 <1%.
- 실시간: 핵심 WS 이벤트(profile_update, purchase_update, stats_update, event_progress) 수신 후 전역 상태 반영·배지/토스트 확인.

## 5. 인증 시스템 (AUTH_SYSTEM_GUIDE 통합)
- 고정 초대코드(개발 전용): `5858` (프로덕션 전환 시 일회성/사용자별 전환 예정).
- 회원가입 필드: username/email, password(≥4), nickname, inviteCode.
- JWT: access 1h, refresh 7d, refresh 회전(jti/iat 추적), refresh 블랙리스트 처리.
- 엔드포인트: `/api/auth/verify-invite` `/api/auth/signup` `/api/auth/login` `/api/auth/refresh` `/api/auth/logout` `/api/auth/me` `/api/auth/admin/login`.
- 프론트: 로그인/회원가입/관리자 로그인/refresh 호출 시 `{ auth:false }` 명시. 공개 엔드포인트 외 다른 POST/GET은 토큰 필수.
- 실패 잠금: 5회/10분(문서 유지). 토큰 저장: dev=localStorage(운영 시 httpOnly 쿠키 고려).
- 룰: 신규 공개 API 추가 시 반드시 본 섹션 업데이트 → diff 기록.

## 6. 전역 동기화 & WS 이벤트
- 이벤트 타입: `purchase_update`, `profile_update`, `stats_update`, `event_progress`, (추가) `reward_granted`, `game_event`.
- 필수 필드 최소 스키마:
  - purchase_update: `{status, product_id?, amount?, reason_code?}`
  - profile_update: `{gold|gold_balance, xp?, tier?, daily_streak?, experience_points?}`
  - stats_update: `{games_played, wins?, losses?, win_rate?, breakdown?}`
  - event_progress: `{event_id, progress, can_claim}`
  - reward_granted: `{reward_type, amount, source}`
  - game_event: `{subtype, payload...}` (slot_spin/jackpot 등)
- 프론트 수신 처리: null 안전성(Guard) + 전역 store 단일 source → 셀렉터(useGold/useStats/useEvents/useUserLevel).
- 폴백: WS 실패 → 30s 폴링(표준화). 재연결 backoff: 1s,2s,5s,10s 최대 30s.

## 7. 게임 통계 통합 (2025-09-07 구조 개편)
- 단일 API: `GET /api/games/stats/me` (Crash + Slot + Gacha + RPS 집계).
- Crash: 기존 `user_game_stats` 유지. 기타 게임: `user_actions` 집계.
- 통합 계산 공식:
  - total_bets = crash_bets + slot_spins + gacha_spins + rps_plays
  - total_wins = crash_wins + slot_wins + gacha_rare_wins + rps_wins
  - total_losses = crash_losses + slot_losses + rps_losses
- 응답 예: `{ success:true, stats:{ total_bets, total_wins, total_losses, game_breakdown:{...}}}`
- 추가 게임 도입 시: user_actions action_type 확장 + breakdown 필드 추가 후 테스트 & 문서 동기화.

## 8. 레벨 & 스트릭 시스템 (간소화 반영)
- 레벨 공식: `level = floor(experience_points / 500) + 1`.
- 진행도: `progress_pct = (experience_points % 500)/500 * 100`.
- 스트릭 1일 시작(0 금지). 골드 보상: `800 + (streak_count * 200)`. XP 보상: `25 + (streak_count * 25)`.
- `/api/streak/next-reward` 제거, 응답 단순화: `{action_type, count, ttl_seconds}`.
- 제거된 필드/엔드포인트 재도입 금지(복잡성 증가 원인). 되살릴 필요 발생 시 개선안2.md 사전 제안 → 승인 → 적용.

## 9. 출고(릴리스) 체크리스트 통합 (20250824)
릴리스 브랜치 대상 최소 충족:
1) 품질: FE 빌드 PASS & ESLint 0 & BE pytest 핵심(구매/스트릭/인증/통계) Green.
2) 마이그레이션: Alembic 단일 head + upgrade head 성공 + DB 백업 스냅샷.
3) 모니터링: Prometheus target up, 알람 룰 로드(purchase-health, kafka_consumer_health, HTTP 5xx, p95), Grafana 패널 latency/lag 정상.
4) OpenAPI: 최신 재수출 diff 문서화(api docs/20250808.md Append).
5) 실시간: WS 이벤트 end-to-end 수신 & 전역 state 반영 & 폴백 시나리오 패스.
6) 관리자: Admin Shop 할인/랭크 기능 및 권한/감사 로그 PASS.
7) 보안: 핵심 시크릿(env.production) 재확인(JWT_SECRET_KEY 등).
카나리: 10%→50%→100% 단계별 15분 스모크(로그인/구매/게임/이벤트/프로필). 이상 시 즉시 롤백.

## 10. 멱등 & 보상/구매 표준
- 구매: Redis 선점 idempotency key → 처리종료 후 확정 마킹.
- Webhook: HMAC + timestamp + nonce + event_id idempotent.
- Reward: distribute 후 reward_granted + profile_update (WS 두 이벤트 모두 처리) → profile double apply 방지(서버 합산 후 단일 source push).

## 11. 데이터 & 스키마
- 직접 DB ALTER (긴급) 적용 시: 1) 개선안2.md 기록 2) 추후 Alembic 보정 revision (단일 head 유지) 3) 문서(20250808.md) 반영.
- 다중 head 감지: merge revision 생성 → 릴리스 전 재검증.

## 12. 프론트엔드 규약
- API 경로 하드코딩 금지('/api/users/profile' → '/api/users/me').
- 전역 상태: globalStore + 셀렉터(직접 local state 복제 금지).
- 인증 전 API 호출: `{ auth:false }` 옵션 강제.
- SSR 안전: `typeof window !== 'undefined'` 가드.
- 타입 오류 = 릴리스 차단. TS 추가 필드 도입 시 hydrateProfile & 타입 동기화.

## 13. 모니터링 & SLO
- 지표: game_stats_update_latency_ms, ws_legacy_games_connections_total/by_result, HTTP p95/p99, 구매 성공률, consumer lag.
- ENV 프로파일: dev/stage/prod 임계값 분리 (Pending 스파이크 임계 외부화 완료, 나머지 튜닝 TODO).

## 14. 보안 체크
- 관리자 로그인: `/api/auth/admin/login` 전용. 권한 없는 Admin API 호출 403 테스트 필수.
- 잠금: 실패계정 lock 후 unlock 경로/시간 검증.
- 미사용 레거시 WS: 기본 비활성(ENABLE_LEGACY_GAMES_WS="0"). 테스트 환경 한정 재검증.

## 15. 테스트 전략
- Pytest 빠른 스모크: 구매, 한정패키지, 스트릭, 인증.
- 게임 통계 통합 회귀: `/api/games/stats/me` 응답 필드 존재 & 총합/분해형 검증.
- Streak 보상 공식 회귀: 1~3일 골드/XP 기대값.
- Front E2E(Playwright): 로그인→게임→구매→통계 갱신→이벤트 진행.

## 16. 변경 시 문서 업데이트 최소 단위
Code 변경 → pytest Green → alembic(head OK) → OpenAPI 재수출(diff) → 20250808.md “변경 요약/검증/다음 단계” 3블록 Append → 본 파일 필요 시 규칙/스키마 갱신.

## 17. 금지 사항
- 새 라우터 파일(game 관련) 분산 생성 금지(모두 `games.py`).
- Alembic 수동 복사/붙여넣기 금지 (revision 명령 사용).
- `_temp`, `_v2`, `_simple` 등 임시 접미사 파일 금지.
- 인증 전 API를 auth=true로 호출하는 패턴 재도입 금지.

## 18. 현재 Pending/TODO (우선순위 순)
1) Admin Shop Toggle API (PATCH /api/admin/shop/items/{id}/toggle) + RBAC/멱등/감사 로그 + 테스트 200/403/409/404.
2) event_progress WS 브로드캐스트 전 경로(참여/클레임/진행) 일원화 & 프론트 헨들러 정착.
3) Streak 테스트 가속(슬립 제거 / Redis TTL 시뮬레이션) + 타임아웃 가드.
4) ENV 임계값(dev/stage/prod) 세분화(SLO 튜닝) & OpenAPI 재수출 CI 파이프라인.
5) Missions API 500 해결 & 모델 정합성 테이블 재검증.
6) Kafka/Celery 운영 표준(컨슈머 lag 알람 범위, 재시도 backoff, DLQ 전략) 문서화.
7) 이벤트 진행도 UI / reward_granted 통합 토스트 표준화.

## 19. 승인 워크플로 (AI 제안 변화)
- 범주 판별: (a) 규칙 추가 (b) 코드 리팩터 (c) 성능/모니터링 (d) 보안.
- (a)(d) → 개선안2.md 초안 + 이 파일 잠정 섹션 임시(PR 코멘트) → 테스트 그린 → 병합 후 본 파일 정식 반영.

## 20. 트러블슈팅 표준(4단계)
1) 전수 수집(콘솔/네트워크/로그) 2) 패턴/상관 분석 3) 통합 수정(부분 패치 금지) 4) 검증 & 문서(개선안2.md + api docs/20250808.md 기록).

## 21. 부록: 참조 엔드포인트 분류
- Auth: /api/auth/*
- User/Profile: /api/users/me, /api/users/{id}/profile
- Games: /api/games/gacha/pull, /api/games/slot/spin, /api/games/crash/play, /api/games/rps/play, /api/games/stats/me
- Shop/Purchase: /api/shop/catalog, /api/shop/buy
- Rewards: /api/rewards/distribute
- Realtime: /api/realtime/sync
- Streak: /api/streak/status, /api/streak/tick
- Events: /api/events/active, /api/events/join
- Admin: /api/admin/shop/items/{id}/toggle (예정), 할인/랭크 PATCH (기 구현)

---
## 22. 즉시 실행 체크 (작업 시작 전 60초 루틴)
[ ] docker-manage.ps1 status 확인
[ ] alembic heads == 1
[ ] pytest 핵심 스모크 통과
[ ] OpenAPI 최신 여부(diff 없거나 이해된 변경)
[ ] 본 파일 TODO 중 담당 항목 범위 명확화

---
## 23. AI 에이전트 실행 규칙 요약(초단축)
- 언제나 한국어 응답, 과장/추측 금지.
- 파일 추가 전 중복/명명 규칙 충돌 점검.
- 스키마 변경 → Alembic → 테스트 → 문서 → OpenAPI 순.
- 실시간/프로필/통계 영향 변경 시 WS & 폴백 모두 검증 케이스 포함.
- 미션/이벤트/게임 확장 시 user_actions action_type 먼저 정의.

(끝)

---
## 24. 레거시 지침 참조 (1.instructions.md / 2.instructions.md)
원본 위치: `.github/instructions/1.instructions.md`, `.github/instructions/2.instructions.md`

정책:
1. 두 파일의 실질 규칙(항상 한국어 응답, docker-compose 기반 실행, Alembic 단일 head 유지, 설정 import 표준화 등)은 본 통합 문서에 모두 흡수됨.
2. 레거시 파일 내용과 본 문서 간 충돌 시: "본 문서" 우선. (중복 지침 신규 생성 금지 규칙 적용)
3. 레거시 문서 직접 수정 금지. 갱신 필요 시 본 파일 상단 변경 로그 Append → 관련 섹션 수정.

추가 적용 메모(레거시 대비 보강된 차이):
- OpenAPI 재수출 절차와 품질 게이트(SLO, WS 이벤트 검증) 명시 강화.
- 레벨/스트릭 공식 및 제거된 엔드포인트(`/api/streak/next-reward`) 재도입 금지 규칙 추가.
- 이벤트/게임 통계 단일화 후 확장 절차(추가 action_type 정의 → 테스트 → 문서화) 명문화.

참조 필요 상황 예시:
- 과거 작업 커밋 회귀 분석 시 원래 문구 출처 식별
- 규칙 변경 PR에서 어떤 레거시 섹션이 대체되었는지 논거 제시

이 섹션은 추적 목적이며, 규칙 최신성 판단에는 사용하지 않는다.
