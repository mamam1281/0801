# Casino-Club F2P 프로젝트 Final 체크 & 트러블슈팅 기록

**생성일**: 2025-08-19  
**브랜치**: feature/e2e-onboarding-playwright  

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
- **Analytics**: ClickHouse, OLAP Worker
- **Development**: Docker Compose, Playwright E2E

## 🔧 현재 서비스 상태

```bash
# 마지막 확인 시점: 2025-08-19 09:07
NAME             STATUS                         PORTS
cc_backend       Up 40 minutes (healthy)       0.0.0.0:8000->8000/tcp
cc_frontend      Up 36 seconds (health: starting) 0.0.0.0:3000->3000/tcp  
cc_postgres      Up 40 minutes (healthy)       0.0.0.0:5432->5432/tcp
cc_redis         Up 40 minutes (healthy)       6379/tcp
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
- 크래시 베팅 원자성 개선: `backend/app/routers/games.py` 크래시 베팅 처리 구간을 단일 DB 트랜잭션 + 행 잠금(row-level lock) 적용하여 중복 결과/골드 미반영 위험 감소. 응답 스키마(`CrashBetResponse`)에 `status`, `simulated_max_win` 필드 추가하여 클라이언트 측 후행 UI/리스크 계산 근거 제공.
- 출석(Attendance) 월간 달력 → 주간 전환: `HomeDashboard.tsx` 기존 월 단위 격자 생성 로직 제거, 현재 주(일~토) 7일만 표시. 오늘 강조 및 이번 주 출석 카운트 단순화로 가시성 향상. 문구: "이번 주 출석".
- 슬롯 당첨금 역표시 이슈 조사: 슬롯 컴포넌트 내 금액 표기(`+{winAmount.toLocaleString()}G`) 방향 전환/역정렬/transform 없음 확인. 현 단계 재현 불가 → 추가 스크린샷/DOM 캡처 필요.
- 스트릭 보상(예: 8000G) 수령 후 실제 골드/로그 미반영 문제 식별: 프론트 단 로컬 상태 갱신만 이뤄지고 서버 확정/잔액 반영 endpoint 없음 또는 미호출 추정 → 서버 Claim 엔드포인트/로그 테이블/트랜잭션 필요.
- 특별보상 금액 축소 요구 수집: 구체 금액/스케일 정책 미정(예: 상한/구간 비율) → 정책 합의 후 산식/프론트·백엔드 동기화 예정.
- Seed User 02 데이터 초기화 예정: 관련 테이블(사용자, 잔액, streak, 게임 로그) 안전 삭제/리셋 스크립트 설계 필요.

#### Pending / 다음 단계 초안
1. 스트릭 보상 Claim 서버 구현: (요청 → 멱등 처리 → 잔액 증가 → reward 로그 기록) + 테스트 추가
2. 특별보상 축소 산식 정의(기준: 현재 최대치, 경제 인플레이션 지표) 후 코드 반영 및 문서화
3. User 02 초기화 안전 스크립트/관리 라우트(Guard: ENV=dev + 특정 user_id 화이트리스트) 작성
4. 슬롯 역표시 추가 자료 수집 → 재현 시 DOM/CSS 레이어 검사

#### 검증 로그 (부분)
- 크래시 베팅: 변경 후 단일 응답 필드 확장 (OpenAPI 재수출 필요 여부 점검 예정)
- 출석 UI: 빌드 후 대시보드에서 7일 표시 정상 (월간 격자 제거)
- 나머지 Pending 항목: 구현 전 상태 기록

#### 문서 작업
- 본 섹션 추가로 2025-08-20 변경/이슈/다음 단계 기록 완료. 구현 후 각 항목 세부 검증 결과 추가 예정.

### 2025-08-20 (추가) Streak Claim API & 경제 산식 개편 계획
- 선택된 스트릭 일일 보상 산식: 지수 감쇠(C 안)
   - Gold = 1000 + 800*(1 - e^{-streak/6})  (상한 ~1800 근사)
   - XP   = 50 + 40*(1 - e^{-streak/8})   (상한 ~90 근사)
- 공용 util: `_calculate_streak_rewards(streak)` 백엔드 `streak.py` 내 임시 구현 → 후속 `app/services/reward_service.py` 이동 및 프론트 util 동기화 예정.
- 신규 엔드포인트: `POST /api/streak/claim`
   - 멱등키: `streak:{user_id}:{action_type}:{UTC_YYYY-MM-DD}` → `user_rewards.idempotency_key` UNIQUE 전제
   - 트랜잭션: User.gold_balance(+gold), User.experience(+xp), UserReward insert(metadata: formula=C_exp_decay_v1)
   - 재호출 시 기존 레코드 반환
   - 검증 로직 미구현 항목(TTL/중복 tick 보호) → 후속 보강
- 프론트 `HomeDashboard.tsx` 기존 클라이언트-only `claimDailyReward` → 서버 API 호출 방식 리팩터 필요 (미적용 상태).

#### User 02 초기화 (익명화 전략)
- 삭제 대신 회계/통계 보존을 위해 익명화 선택:
   - UPDATE users SET nickname='user02_reset', email=NULL, gold_balance=0, experience=0 WHERE id=2;
   - 민감 로그/팔로우/채팅 등은 유지, 필요시 별도 purge 옵션.
   - Redis streak 키: `DEL user:2:streak:* user:2:streak_protection:*`
- 후속: 익명화 스크립트 `/scripts/reset_user_02.sql` 또는 관리 라우터로 추가 예정.

#### 캘린더 UI 보정
- 월간 문구 잔재 제거: HomeDashboard.tsx '이번달 출석' → '(월간 누적 X일)' 표시로 축소, 메인은 주간 7일 표시 유지.

#### 다음 후속 처리
1. (완료) 프론트 streak claim 서버 호출 리팩터 (`HomeDashboard.tsx` fetch POST /api/streak/claim)
2. (진행) 보상 산식 util 표준화: `app/services/reward_service.py` 추가, 경계 테스트 작성 예정 (streak 0,1,3,7,14)
3. (완료) `user_rewards` 확장: `reward_type`, `gold_amount`, `xp_amount`, `reward_metadata`, `idempotency_key` + UNIQUE index (`ix_user_rewards_idempotency_key`)
4. (완료) OpenAPI 재생성: `backend/app/current_openapi.json` 및 timestamped 스냅샷 생성
5. (완료) User02 익명화 스크립트 `scripts/reset_user_02.sql` 추가
6. (예정) Admin DEV 전용 라우터에 User02 reset endpoint 추가 / 보상 경계 테스트(pytest)

### 2025-08-20 (야간) VIP 일일 포인트 & Daily Claim 멱등 개선
- 백엔드 변경:
   - `users.vip_points` 컬럼 추가 (idempotent migration `add_vip_points.py`).
   - `UserResponse` 스키마에 `vip_points` 노출 및 `/api/auth/me` 등 프로필 응답 경로 반영.
   - 신규 라우터 `vip.py`:
      - `POST /api/vip/claim` (멱등키: `vip:{user_id}:{UTC_YYYY-MM-DD}` + Redis 플래그 `vip_claimed:{user_id}:{date}` TTL 26h)
      - `GET /api/vip/status` (금일 수령 여부/포인트 조회 `claimed_today`, `vip_points`, `last_claim_at`).
   - Reward 로그: `UserReward(reward_type='VIP_DAILY', idempotency_key=...)` 기록.
- 프론트 변경 (`HomeDashboard.tsx`):
   - 하드코드된 `vipPoints=1250` 제거 → 서버 값 초기화(fallback camelCase/underscore).
   - 일일 보상 모달 버튼 수령 후 비활성(`이미 수령됨`) 처리; 중복 클릭 로컬 증가 제거.
   - TODO 주석: 보상 미리보기 금액을 서버 산식 응답으로 치환 예정.
- 테스트: `test_vip_daily_claim.py` 추가 (동일일 중복 수령 시 단일 레코드 + idempotent 응답 확인).

검증 결과:
- VIP 첫 수령 후 동일 일자 재요청: HTTP 200, `idempotent=True`, DB `user_rewards` 동일 idempotency_key 1건 유지.
- Streak 일일 보상: 로컬 임의 증가 제거 후 서버 authoritative 값만 반영(중복 수령 시 기존 값 재표시, gold 재증가 없음 확인).
- User 프로필 응답에 `vip_points` 필드 노출 확인 (/api/auth/me).

다음 단계:
1. HomeDashboard 보상 미리보기 산식 → 서버 streak status 확장(예: 예상 next reward 금액)으로 완전 이관.
2. user02 데이터 정리 자동화: `/api/dev/reset_user02` 호출 절차 final.md에 사용 예 추가 + CI 전 pre-step 스크립트화.
3. VIP status 전용 E2E & OpenAPI 문서 스냅샷 재생성 (`python -m app.export_openapi`).

### user02 데이터 초기화 실행 지침
개발 중 잔여 목업 수치(골드/연속일)가 분석을 방해할 경우 dev 전용 리셋 엔드포인트 사용.
1. 토큰 발급 후:
    ```bash
    curl -H "Authorization: Bearer <ACCESS_TOKEN>" -X POST http://localhost:8000/api/dev/reset_user02
    ```
2. 성공 시 user02 골드/경험치/출석 Redis 키 초기화, 익명화 규칙 적용.
3. 프론트 재로그인 또는 `/api/auth/me` 재조회로 반영 확인.

