## 6. 데이터베이스-프론트/백엔드 플로우 도식화 및 현황 분석

### 6.1 주요 기능별 데이터 흐름 플로우차트 (텍스트 도식)

#### [회원가입/로그인]
프론트(Next.js) → API(/api/users/signup, /api/users/login) → 백엔드(FastAPI) → DB(users) → JWT 발급 → 프론트 저장/동기화

#### [게임 플레이]
프론트(게임 컴포넌트) → API(/api/games/slot, /api/games/gacha, /api/games/crash) → 백엔드 → DB(game_sessions, user_actions) → 실시간/비동기 처리(카프카, Redis) → 프론트 결과/피드백 표시

#### [상점/구매]
프론트(ShopScreen) → API(/api/shop/buy, /api/shop/history) → 백엔드 → DB(shop_transactions) → 결제/멱등성/보안 처리 → 프론트 잔액/구매내역 동기화

#### [미션/이벤트]
프론트(Mission/Event 컴포넌트) → API(/api/missions, /api/events) → 백엔드 → DB(missions, events, user_missions, event_participations) → 보상/진행도 동기화

#### [잔액/통계/전역 동기화]
프론트(useGlobalSync) → API(/api/users/me, /api/games/stats/me) → 백엔드 → DB → 프론트 전역 상태 갱신

---

### 6.2 기능별 구현 현황/문제점/배포 타임라인

| 기능            | 구현 현황         | 문제점/이슈         | 가능/불가 | 배포 타임라인 |
|-----------------|------------------|---------------------|-----------|--------------|
| 회원가입/로그인 | ✅ 완료           | 없음                | 가능      | 즉시         |
| 게임 플레이     | ✅ 완료           | 일부 확장(신규 게임)| 가능      | 즉시         |
| 상점/구매       | ✅ 완료           | 결제 Fraud/보안 강화| 가능      | 즉시         |
| 미션/이벤트     | ✅ 완료           | 미션/이벤트 확장 필요| 가능      | 즉시         |
| 잔액/통계 동기화| ✅ 완료           | 없음                | 가능      | 즉시         |
| 성인/VIP 컨텐츠 | ⏳ 일부 구현      | 연령/등급 검증 미완  | 일부 가능 | 9월 중       |
| 추천/개인화     | ⏳ 일부 구현      | 추천 알고리즘 고도화| 일부 가능 | 9월 중       |
| 실시간 알림     | ⏳ 일부 구현      | SSE/Push 안정화 필요| 일부 가능 | 9월 중       |
| OLAP/모니터링   | ⏳ 일부 구현      | ClickHouse 연동/대시보드| 일부 가능 | 9월~10월    |
| 테스트 자동화   | ✅ 완료           | 일부 E2E/통합 보강  | 가능      | 즉시         |
| 배포/운영       | ✅ 완료           | 일부 컨테이너 orphan| 가능      | 즉시         |

---

### 6.3 주요 문제점/가능점/배포 타임라인 요약
- 회원가입/로그인/게임/상점/미션/이벤트/잔액/통계/테스트/배포는 즉시 가능, 상용 수준 구현 완료
- 성인/VIP, 추천/개인화, 실시간 알림, OLAP/모니터링은 9~10월 중 고도화/배포 예정
- 현재 장애/중단 이슈 없음, 일부 기능(알림/추천/성인/OLAP)은 추가 개발/테스트 필요
- 배포는 컨테이너 재빌드 후 즉시 가능, 운영/모니터링/테스트 자동화도 완료
## 5. 세부 기능/흐름/테스트/보안/운영 포인트

### 5.1 데이터 전역 동기화 구조
- 모든 주요 데이터(골드, 토큰, 게임 세션, 상점 거래, 미션, 이벤트)는 User 모델을 중심으로 관계형 DB(외래키)로 연결됨
- User → GameSession, UserAction, UserReward, ShopTransaction, EventParticipation, UserMission 등으로 cascade 관계
- 프론트엔드에서는 useGlobalSync 훅을 통해 로그인/잔액/통계/미션/상점 등 모든 주요 상태를 단일 API로 동기화
- SSR/클라이언트 모두 JWT 기반 인증, 토큰 만료/갱신/락아웃/리프레시 지원
- 백엔드 라우터(예: games.py, shop.py, streak.py 등)는 DB/Redis/Kafka/ClickHouse를 통해 실시간/비동기 데이터 연계
- 멱등성(중복 방지)은 Redis 키, DB idempotency_key, receipt_signature 등으로 보장
- 모든 주요 액션/보상/구매/미션/이벤트는 User 기반으로 전역적으로 유기적으로 동작

### 5.2 테스트/검증
- backend/app/tests: pytest 기반 단위/통합/E2E 테스트, auth_token 픽스처로 자동 회원가입/로그인/권한 검증
- frontend: Playwright 컨테이너 기반 E2E 테스트, SSR/클라이언트/가드/잔액/상점/미션/이벤트 등 전체 흐름 검증
- 변경 시 개선안2.md, api docs/20250808.md에 반드시 변경 요약/검증/다음 단계 기록

### 5.3 보안/운영
- 모든 인증/권한은 JWT, refresh, iat/jti, 로그인 실패 락아웃, invite code 정책으로 관리
- 결제/구매/상점은 HMAC receipt_signature, Redis 멱등성, Fraud 차단, webhook 보안 등으로 보호
- 운영/모니터링은 Prometheus+Grafana, 로그/에러/트랜잭션 DB, Kafka DLQ, ClickHouse OLAP로 실시간/배치 분석
- 환경 변수/시크릿은 .env.* 및 config.py에서 통합 관리, 컨테이너/배포 시 동기화 필수

### 5.4 변경 이력/정책
- 모든 정책/구조/테스트/운영 변경은 개선안2.md, api docs/20250808.md, 전역동기화_솔루션.md에 기록
- 중복/오류/병합/마이그레이션은 반드시 단일화/통합 원칙 준수

---

## 실제 상용앱처럼 데이터가 전역으로 유기적으로 작동되는지 분석

- User를 중심으로 모든 주요 데이터가 외래키/관계형으로 연결되어 있어, 한 계정의 게임/상점/미션/이벤트/보상/액션/알림/세그먼트가 전역적으로 동기화됨
- 프론트엔드 useGlobalSync, 백엔드 통합 라우터, 멱등성/트랜잭션/실시간/배치 연계로 실제 상용앱 수준의 데이터 일관성/유기성 확보
- SSR/클라이언트/테스트/운영 모두 단일 정책/구조로 관리되어, 장애/오류/중복/보안 이슈 발생 시 빠른 진단/복구 가능
# Casino-Club F2P 프로젝트 구조/기능 가이드 (2025-09-03 초안)

## 1. 루트 디렉터리
- `docker-compose.yml`, `docker-manage.ps1`: 전체 서비스 오케스트레이션, 컨테이너 관리
- `.env.*`: 환경 변수, 서비스별 시크릿/설정
- `README.md`, `SIMPLE_SETUP_GUIDE.md`: 프로젝트 개요, 설치/실행/테스트 가이드
- `api docs/`: API 문서, 변경 이력, 정책, 데이터 파이프라인 명세

## 2. cc-webapp/
- `backend/`
  - `app/`
    - `models/`: DB 모델(게임, 상점, 이벤트, 미션 등)
    - `routers/`: API 엔드포인트(게임, 인증, 상점 등)
    - `services/`: 비즈니스 로직, DB 트랜잭션, 멱등성 처리
    - `scripts/`: 시드 데이터, 마이그레이션, smoke test
    - `core/`: 설정, 환경 변수, 공통 유틸
    - `tests/`: pytest 기반 단위/E2E 테스트, conftest.py 픽스처
  - `requirements.txt`, `Dockerfile`: 의존성, 컨테이너 빌드
- `frontend/`
  - `app/`, `components/`: Next.js 페이지, React 컴포넌트, SSR 미들웨어
  - `package.json`, `Dockerfile`: 프론트 의존성, 빌드

## 3. data/, logs/, scripts/
- `data/`: DB 초기화, 백업, 임시 데이터
- `logs/`: 서비스별 로그(backend, frontend, postgres, celery 등)
- `scripts/`: 운영/배포/진단용 스크립트

## 4. 기타
- `pytest.ini`, `test-requirements.txt`: 테스트 환경 설정
- `compare-duplicates.ps1`, `merge-frontend.ps1`: 중복/병합 관리
- `개선안2.md`, `API_MAPPING.md`: 변경 이력, 정책, API 매핑

---

## 기능/연계성 요약
- 모든 서비스는 docker-compose로 통합 관리
- 백엔드 FastAPI, 프론트 Next.js, DB PostgreSQL, 캐시 Redis, 메시지 Kafka, OLAP ClickHouse
- 시드 데이터/테스트/마이그레이션은 backend/app/scripts에서 관리
- API 문서와 정책은 api docs/에 집중
- 로그/데이터/백업은 별도 디렉터리로 분리
- 모든 변경/정책/테스트 결과는 개선안2.md, api docs/20250808.md에 기록

---

이 가이드 파일은 전체 구조/기능/연계성 파악을 위한 1차 초안입니다.
추가 분석/세부 기능/테스트/보안/운영 포인트는 2~5회에 걸쳐 더 깊게 정리 가능합니다.
