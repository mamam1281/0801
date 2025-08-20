# Casino-Club F2P 프로젝트 Final 체크 & 트러블슈팅 기록

**생성일**: 2025-08-19  
**브랜치**: feature/e2e-onboarding-playwright  

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
3. 네트워크 오류 재시도(지수 백오프 1~2회) 및 offline 감지(`navigator.onLine`).
4. 프로필 자동 새로고침 간격 사용자 환경(모바일/데스크톱) 차등 조정.

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




GameStats (totalBets, wins, losses, highestMultiplier, totalProfit) 현재
Crash 세션에서 프론트 sessionStats 로컬 증가 + 프로필 재조회 시 일부 동기화.
서버 “단일 권위” 부재: 동시성·재시작·재계산 취약. 격차
결과 확정 시점 이벤트(“bet_settled”) 미정.
역사적 재계산/치유(heal) 엔드포인트 부재.
통계 필드 정의/NULL 처리·인덱스 전략 미정. 목표 아키텍처
테이블: user_game_stats (user_id PK, total_bets, total_wins, total_losses, highest_multiplier, total_profit, updated_at).
이벤트 소스: crash_bets(또는 games_crash_rounds) + 승패 확정 로직 → Service emit.
Service: GameStatsService.update_from_round(user_id, bet_amount, win_amount, final_multiplier).
재계산: GameStatsService.recalculate_user(user_id) (SELECT SUM… GROUP BY user_id).
Admin/내부 API: POST /api/games/stats/recalculate/{user_id}.
나중 확장: 가챠/슬롯 등 게임별 세분화 컬럼 또는 별도 테이블(user_game_stats_daily). 최소 단계(Incremental)
user_game_stats 마이그레이션 추가 (단일 head 확인 필수).
Crash 베팅 확정 지점에 Service 호출 (트랜잭션 내 idempotent upsert).
프론트 sessionStats 로컬 증가 제거 → 프로필 재조회만.
재계산 엔드포인트 + pytest: 조작된 레코드 후 재계산 복구 확인. 테스트/모니터링
유닛: update_from_round 승/패/동일 highest_multiplier 갱신 케이스.
회귀: 대량(1000) 라운드 후 합계 = 재계산 값 일치.
메트릭: stats_update_latency, stats_recalc_duration.
경고: highest_multiplier 역행(감소) 발생 시 로그 경고.
Fraud 차단 고도화 현재
단순 시도 횟수 / 고유 카드토큰 다양성 임계 기반 차단(문서상). 격차
디바이스/IP 지문, 금액 편차, 다중 계정 상관, 지속 순위화 없음.
정책 버전/룰 explainability 미구현. 목표 아키텍처
수집 지표(슬라이딩 윈도우 Redis): attempts:{ip}, attempts:{fingerprint}, distinct_cards:{user}, amount_stddev:{user}.
Rule Engine(우선 단계): JSON 룰 세트 (조건 → 점수).
점수 합산 → Threshold tiers(Soft block / Hard block / Review).
장기: Feature 스냅샷 ClickHouse 저장 → Offline 모델(XGBoost) → 주기적 weight export → 실시간 점수 계산. 최소 단계
Redis ZSET 또는 HLL 로 distinct_* 추적 추가.
Rule DSL (예: yaml) loader + 평가 함수.
구매 플로우에서 FraudContext 생성 → 평가 → action(enum) 반환.
감사 로그 fraud_audit (user_id, action, score, features JSON).
임계 변경/룰 리로드 핫스왑 (파일 타임스탬프 감시). 테스트/모니터링
유닛: 단일 룰, 복합 룰, 임계 경계 테스트.
부하: 500 RPS 시 Redis latency < X ms (메트릭).
경고: Hard block 비율 24h 이동평균 이탈.






Webhook 재생/중복 방지 현재
설계: HMAC 서명+timestamp+nonce+event_id idempotency 언급 / key rotation 미완. 격차
key versioning(KID), 재생 큐(Dead-letter / 재시도), 상태 추적(ACK/FAIL) 명확성 부족. 목표 아키텍처
서명 헤더: X-Webhook-Signature (algo=HMAC-SHA256, kid=Kyyyy, ts=unix, nonce, sig=base64).
검증 순서: (1) kid → 키 조회 → (2) ts 허용 오차 (±300s) → (3) nonce Redis SETNX 24h → (4) event_id uniqueness DB/Redis → (5) HMAC 비교.
상태 테이블: webhook_events(id PK, external_id, status(PENDING|DELIVERED|FAILED|REPLAYED), last_error, attempt_count, next_retry_at).
재시도 알고리즘: 지수 백오프 최대 N (예: 6).
수동 재생: POST /api/admin/webhooks/replay/{id}.
Key rotation: active + next; 발신 시 active kid, 수신 검증 시 {active,next} 두 개 허용 기간. 최소 단계
이벤트 저장 → 보내기 → 결과 업데이트 구조 (producer-consumer or Celery).
nonce + event_id Redis key (TTL 25h).
admin replay 엔드포인트 (상태=FAILED만).
키 스토어: settings.WEBHOOK_KEYS = {kid: secret}. 테스트/모니터링
유닛: 잘못된 ts/nonce 재사용/서명 깨짐.
통합: replay 후 attempt_count 증가 & status 전환.
메트릭: webhook_delivery_success_rate, avg_attempts_per_success.
Streak 자정 경계 회복 / 프로텍션 자동 보정 현재
Redis NX 일일 lock + 프론트 localStorage UTC date guard.
경계(UTC 23:59:59 → 00:00:01) 및 다중 탭 경쟁/TTL drift 회복 테스트 미구현. 격차
TTL 기반 만료와 ‘실제 날짜’ 불일치 시 교정 로직.
보호(Protection) 자동 소비/회복 조건 정교화 미흡. 목표 아키텍처
canonical_date = utc_today() (또는 향후 사용자 timezone offset).
tick 처리 시: Redis key user:{id}:streak_daily_lock:{action}:{YYYY-MM-DD}.
보정 Job (분기 1회):
전날 lock만 있고 streak counter 미증가 → counter +=1 (edge repair)
counter 증가했지만 attendance set 누락 → SADD 보정.
Protection: 결측(하루 miss) 감지 시 자동 소진 후 streak 유지 → 소진 이벤트 기록. 최소 단계
now() 주입 가능한 유틸 (Clock interface) → 테스트에서 고정.
xfail 테스트: ‘23:59 tick, 00:01 tick’ 시 정확히 +1 only.
보정 함수 streak_repair(date) + 관리용 엔드포인트(또는 스케줄러).

### 2025-08-20 (야간) Streak 403 (no token) 콘솔 에러 3건 대응
- 현상: 초기 홈 대시보드 마운트 시 `POST /api/streak/tick`, `GET /api/streak/protection`, 기타 streak 관련 호출이 로그인 이전(토큰 미존재) 상태에서 실행되어 `Forbidden (no token)` 403 → 콘솔 에러 3건 누적.
- 원인: `HomeDashboard` `useEffect` 내 streak 로딩 로직이 토큰 존재 여부 확인 없이 즉시 실행. `apiClient` 403(no token) 시 null 반환 처리 있으나 콘솔 에러/로그 노이즈 잔존.
- 조치: `HomeDashboard.tsx` streak 로딩 `load()` 시작부에 `getTokens()` 검사 추가. access_token 없으면 streak/status/tick/protection/history 전부 skip 및 debug 로그만 출력. `claimDailyReward` 핸들러에도 토큰 가드 추가(미로그인 안내 토스트).
- 결과: 비로그인 최초 접근 시 403 콘솔 에러 사라지고 불필요한 fetch 감소(최소 3회 → 0회). 로그인 후 재방문 시 기존 기능 동일 동작.
- 다음 단계: (1) streak API 자체에서 Anonymous 호출 시 401 명확 반환 + 프론트 공통 auth gate hook로 통합, (2) skip 시 UI skeleton/“로그인 후 출석 확인” 안내 표시, (3) useEvents / VIP status 등 다른 초기 호출들도 동일 토큰 프리체크 표준화.

### 2025-08-20 (추가) 공통 Auth Gate 훅 도입 & 초기 API 일괄 보호
- 변경: `hooks/useAuthGate.ts` 신설 (`{ isReady, authenticated }` 제공) 후 `HomeDashboard`에 적용.
- 이벤트/스트릭/VIP 초기 로딩: `authenticated=false` 시 호출 전부 skip → 403/401 로그 소거 및 초기 렌더 지연 감소.
- `useEvents` 훅: autoLoad 시 토큰 미존재면 loadEvents 실행 안 함, `refresh` 역시 가드.
- UI: 비로그인 상태 streak 영역에 안내 블록 표시(출석/보상 노출 차단). (TODO: 컴포넌트화 & Skeleton 대체)
- 효과: 비로그인 첫 진입 네트워크 요청 수 감소( streak 3~4회 + events 1회 + vip 1회 ≈ 최대 6회 → 0회 ) 및 콘솔 에러/경고 제거.
- 후속 예정: (1) Auth Gate가 토큰 만료/refresh 결과 반영하도록 useAuthToken 통합, (2) 공통 Guard HOC(`withAuthBoundary`)로 라우트 보호, (3) Skeleton / CTA(“로그인하고 출석 보상 받기”) 버튼 추가 A/B 테스트.
attendance set TTL 재확인(120d) 및 누락 시 재삽입. 테스트/모니터링
유닛: Clock mock 으로 하루 넘어가기 시나리오 3종(정상, 중복, skip + protection).
메트릭: streak_repair_actions, protection_consumed_total.
경고: repair 비율 1% 이상 상승.
정리된 우선순위(단계적 추진) 순서 제안 (리스크 감소 + 사용자 체감 가치):
GameStats 서버 권위 (데이터 신뢰 핵심)
Streak 경계/보호 보정(이미 핵심 루프, 무결성)
Webhook 재생/서명 회전(외부 결제/영수증 신뢰)
Fraud 룰 엔진(매출 보호)
RFM/추천(성장·LTV 향상)
공통 구현 패턴 권고
Service 계층: 순수 함수 + DB/Redis adapter 주입 → 테스트 용이.
Idempotency: update_from_* 계열은 natural key(user_id + round_id) UPSERT.
Clock / UUID / Now 추상화: boundary & replay 테스트 재현성 확보.
Observability: 각 서비스 최초 구축 시 counter + histogram 2종 최소 정의.
간단한 인터페이스 스케치 (예시)
GameStatsService

update_from_round(user_id:int, bet:int, win:int, multiplier:float) -> None
recalc_user(user_id:int) -> GameStatsDTO

### 2025-08-20 (긴급) 시드 계정 로그인 실패 트러블슈팅
- 현상: 프론트 로그인 폼에서 시드 계정(admin / user001 등)으로 로그인 시 반복된 `아이디 또는 비밀번호가 올바르지 않습니다` 메시지 및 `/api/auth/login` 401 응답. 기존 정상 계정이 재부팅 이후 전부 실패.
- 백엔드 로그: `/api/auth/login` 처리 경로에서 `authenticate_user` None 반환, 별도 예외 없음.
- 1차 가설 점검:
   1) 비밀번호 해시/평문 불일치 → 시드 스크립트가 bcrypt 해시를 생성하지 못했거나 다른 해시 스킴.
   2) site_id / nickname 혼용 → 폼 입력 라벨이 '닉네임' 인데 site_id 로만 조회.
   3) JWT 검증 실패 (토큰 생성 후 즉시 401) 시나리오.
- 조사 결과:
   - `seed_basic_accounts.py` 는 `AuthService.get_password_hash` 로 bcrypt 해시 저장. 스크립트가 실행되지 않았거나 재기동으로 DB 초기화 후 미실행 상태.
   - 로그인 API 는 `site_id` → fallback 으로 nickname (lowercase 비교) 를 시도하므로 라벨 혼동은 부차적.
   - 실제 실패는 사용자 레코드 자체 부재(DB 리셋) 상태에서 발생: users 테이블 조회 결과 0.
- 근본 원인: Compose 재시작 후 seed 스크립트 미실행으로 기본 계정 미존재. (테스트 환경 자동 시드 파이프라인 부재)
- 조치:
   1) `docker compose exec backend python -m app.scripts.seed_basic_accounts` 재실행 → admin/user001..004 재생성.
   2) 패스워드 정책 문서화: admin=123456 / user001..004=123455.
   3) 재시작 시 자동 시드 옵션 TODO: backend entrypoint 에 `AUTO_SEED_BASIC=1` 시 1회 멱등 실행 로직 추가 예정.
   4) Seed 실행 후 즉시 `python -m app.scripts.test_login` 로 상태 확인 자동화 권고.
- 검증:
   - 실행 로그: `[{'site_id': 'admin', 'action': 'created', ...}, {'site_id': 'user001', ...}]` 출력.
   - /api/auth/login admin/123456 200 + 토큰 수령, user001/123455 200 확인.
- 후속 TODO:
   - (보안) 기본 패스워드 최초 로그인 시 강제 변경 플로우.
   - (운영) seed 계정 별도 환경 분리(PROD 배포 차단) 및 강력한 랜덤 초기 패스워드 + secrets storage.
   - (테스트) playwright 로그인 헬퍼가 계정 미존재 시 seed 자동 호출.
get(user_id:int) -> GameStatsDTO
FraudEngine

evaluate(ctx: FraudContext) -> FraudDecision(score:int, action:enum, matched_rules:[...])
WebhookVerifier

verify(headers, raw_body) -> VerifiedEvent(event_id, payload)
mark_delivered(event_id)
replay(event_id)
StreakManager

tick(user_id:int, action:str, now:datetime) -> StreakState
repair(date:date) -> RepairReport
consume_protection(user_id:int) -> bool
테스트 우선 (TDD) 추천 순서
GameStatsService: increment vs recalc 동등성
StreakManager: midnight duplicate suppression
WebhookVerifier: nonce reuse & key rotation acceptance




요청 정리 및 설계 방향 초안:

요구사항 체크리스트:

메인 페이지 목업(하드코딩) 이벤트 제거
실제 서버 이벤트(/api/events) 목록을 메인에 표시
신규 “모델 지수 이벤트” 추가 (이벤트 데이터/모델 정의 & 시드)
이벤트 참여 로직 서버 저장 (이미 기본 join/progress/claim 존재하므로 활용/확장)
어드민에서 이벤트 생성/수정/비활성/보상(강제 지급 포함) 관리 가능
어드민에서 특정 유저 참여 현황 / 전체 참여자 조회
전체 풀스택 구현 (백엔드 admin API + Frontend Admin UI + Main UI 연동)
테스트 및 간단 문서 업데이트
현재 상태 갭 분석:

Public 이벤트 API (목록/상세/참여/progress/claim) 이미 구현됨.
Mission 관련 admin 비어있고 admin_events.py 비어있음 → 어드민 CRUD/강제 지급 엔드포인트 없음.
Participation 조회용 admin 전용 endpoint 없음 (전체 리스팅/특정 이벤트 참여자).
Frontend 메인에서 실제 events 호출 코드 미확인 (추가 필요); mock 요소 제거 필요.
“모델 지수 이벤트” 도메인 정의 필요: requirements/progress 키 설계 (예: model_index >= X or 누적 모델 사용 횟수 등) → progress 키/requirements 매칭 구조 그대로 사용 가능.
EventService에 어드민용 create/update/deactivate, participation list, 강제 reward claim 메서드 추가 필요.
권한 체크: admin 전용 Depends (아마 기존 get_current_user + is_admin 검사) 사용.
시드: start_date <= now <= end_date 구간 들어오게 UTC 기준 날짜 생성.
제안 구현 세부 (백엔드):

admin_events.py 라우터 추가:
POST /api/admin/events (EventCreate)
PUT /api/admin/events/{event_id} (EventUpdate)
POST /api/admin/events/{event_id}/deactivate (is_active False)
GET /api/admin/events/{event_id}/participations (필터: completed/claimed 등 Query)
POST /api/admin/events/{event_id}/force-claim/{user_id} (관리자 강제 보상 지급; 비정상 상태시 400)
(선택) POST /api/admin/events/seed/model-index -> “모델 지수 이벤트” 시드
서비스 계층 EventService:
create_event, update_event, deactivate_event
list_participations(event_id, filters)
force_claim_rewards(event_id, user_id)
seed_model_index_event(db) (존재 여부 체크 후 생성)
프론트 (메인):

useEvents 훅 신설: fetch /api/events, 캐시/로딩/에러 관리
Main/Home 컴포넌트(또는 이벤트 패널)에서 목업 리스트 제거 → 실제 fetch 결과 표시
참여 버튼: /api/events/join, 진행도 업데이트는 progress 엔드포인트 (진행 예시: model_index_increment 등)
완료시 보상 수령 버튼 → /api/events/claim/{id}
프론트 (어드민):

/admin/events 페이지:
목록(검색/활성여부 필터)
신규 생성 폼
상세 패널 (기본정보 수정, 비활성화)
참여자 탭 (필터: completed, claimed)
참여자 행 단위 강제 보상 버튼
시드 “모델 지수 이벤트” 실행 버튼 (이미 존재하면 비활성)
테스트:

backend tests:
test_admin_create_event_requires_admin
test_admin_create_and_list_event
test_join_and_progress_and_claim_event
test_force_claim (조건 검증)
test_seed_model_index_idempotent
(선택) 프론트 통합은 e2e 추후; 최소 fetch mocking unit.
다음 단계 제안 (실행 순서):

백엔드: EventService 확장 + admin_events 라우터 구현
백엔드: 모델 지수 이벤트 시드 함수 및 엔드포인트
백엔드: pytest 케이스 추가
프론트: useEvents 훅 + 메인 UI 연결
프론트: admin events 페이지/컴포넌트 생성
문서/API_MAPPING 갱신, 요약
진행해도 될지 여부만 알려주시면 바로 1단계(백엔드 구현) 착수합니다. 필요하면 “모델 지수 이벤트” 요구 지표(예: target model_index 100? 기간? 보상?) 구체값 주셔도 반영합니다. 기본 임시값 제안:

title: “모델 지수 도전 이벤트”
event_type: “special”
기간: 오늘 ~ +14일
requirements: {"model_index_points": 1000}
rewards: {"gold": 5000, "exp": 1000}
priority: 50
수정 원하시면 말씀 주세요. 진행 승인될 경우 바로 구현 들어갑니다. 계속할까요?

