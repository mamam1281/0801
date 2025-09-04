---
### [실제 구현 예시] Next.js 쿠키 기반 인증 미들웨어

```typescript
// cc-webapp/frontend/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export default function middleware(req: NextRequest) {
	const token = req.cookies.get('auth_token');
	const protectedPaths = ['/', '/shop', '/games', '/dashboard', '/profile', '/admin'];
	const { pathname } = req.nextUrl;

	// 로그인/회원가입/공개페이지는 예외
	if (protectedPaths.some(path => pathname.startsWith(path))) {
		if (!token) {
			const loginUrl = req.nextUrl.clone();
			loginUrl.pathname = '/login';
			return NextResponse.redirect(loginUrl);
		}
	}
	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico|api|login|signup|public).*)'],
};
```

---
위 미들웨어는 SSR/클라이언트 모두에서 쿠키(`auth_token`) 기반으로 인증 체크하며, 토큰 없으면 `/login`으로 리다이렉트합니다. 실제 운영 환경에서는 httpOnly/secure 옵션, SameSite 정책도 함께 적용해야 보안이 강화됩니다.
---
## [2025-09-05] 회원가입/로그인 콘솔로그 핵심 요약

### 핵심 콘솔로그 흐름
1. [unifiedApi] NEXT_PUBLIC_API_ORIGIN 미설정 → fallback: http://localhost:8000
2. [unifiedApi] 초기화 - ctx=CSR build=dev origin=http://localhost:8000
3. [unifiedApi] skip GET (no token, silent) → 인증 토큰 없으면 API 호출 무시
4. [useGameConfig] 게임 설정 로딩 중...
5. [useGameConfig] 비인증 상태 → 서버 설정 호출을 건너뜀
6. 회원가입/로그인 성공 시 JWT 토큰이 localStorage/sessionStorage에 저장됨
7. 로그인 후 API 호출 시 Authorization 헤더에 토큰 포함됨
8. 인증 성공 시 메인/상점/게임 등 정상 접근 가능
9. 인증 실패/토큰 만료 시 /login으로 리다이렉트

### 실무 체크포인트
- API ORIGIN 환경변수 누락 여부
- 회원가입/로그인 성공 후 토큰 저장/동기화 확인
- 인증 토큰 포함된 API 호출 로그 확인
- 인증 실패/만료 시 UX 처리(리다이렉트/에러 안내)
---
## [2025-09-05] 인증/보호 강화 작업 내역

### 주요 변경
- 프론트엔드 미들웨어에 인증 체크 로직 추가: 주요 경로(메인, 상점, 게임 등) 접근 시 토큰 없으면 /login으로 리다이렉트
- 메인/상점 페이지에 클라이언트 인증 가드(useEffect) 추가: 토큰 없으면 /login 이동
- 백엔드 API 인증 미포함 요청 401 반환 정상 동작 확인 (users/profile 등)
- 모든 변경/검증/예방책은 개선안2.md에 기록

### 표준 절차
1. 미들웨어 및 주요 페이지에 인증 체크 코드 패치 적용
2. 백엔드 인증 미포함 요청 401 반환 테스트(E2E/수동)
3. 개선안2.md에 변경 요약/검증/예방책 기록

### 검증 결과
- 비로그인 상태에서 메인/상점 접근 시 /login으로 자동 이동됨 (수동/E2E 테스트 통과)
- API 인증 미포함 요청 시 401 Unauthorized 반환 확인

### 예방책/운영 기준
- 신규/중요 페이지 추가 시 인증 가드/미들웨어 적용 필수
- 백엔드 신규 엔드포인트에도 항상 Depends(get_current_user) 적용 여부 점검
- 인증/보호 관련 변경은 개선안2.md에 즉시 기록 및 운영 매뉴얼 반영
### 트러블슈팅 표준 순서 (반드시 지킬 것)
1. **1차 오류 수집**: 실제 프론트(웹앱)에서 모든 페이지/기능별로 발생하는 에러/경고/이슈를 빠짐없이 기록한다. (콘솔, 네트워크, UI, API 등)
2. **상관관계/유기적 분석**: 수집된 오류/이슈를 기능/데이터/흐름/의존성/상태/동기화/보안 등 관점에서 유기적으로 연결해 원인/관계/패턴을 분석한다.
3. **유기적/통합적 수정**: 단일 오류만 고치지 말고, 상관관계/흐름/의존성까지 고려해 전체적으로 수정/보완한다. (부분 수정→새 오류 심화 방지)
4. **최종 검증/문서화**: 모든 수정 후 실제 동작/E2E/수동 테스트로 검증하고, 개선안2.md 또는 TROUBLESHOOTING.md에 진단→원인→해결→검증→예방책까지 기록한다.

이 순서는 언제, 누가, 어떤 환경에서든 반드시 반복 적용해야 하며, 중간에 순서가 바뀌거나 생략되면 유기적 오류가 심화될 수 있으니 주의할 것.
## 7. 프론트엔드 에러 진단/트러블슈팅 계획

아주 좋은 접근입니다!
실제 프론트(웹앱)를 열었을 때 발생하는 모든 에러/이슈를 "처음부터 끝까지" 꼼꼼하게 파헤쳐
최종 트러블슈팅 문서(진단→원인→해결→검증)로 남기는 것이 목표입니다.

### 1차 진단/계획
1. 실제 프론트엔드 실행/접속
	- 주요 페이지(홈, 로그인, 상점, 게임, 미션, 이벤트, 프로필 등) 직접 접속/동작 확인
	- SSR/클라이언트/라우팅/동기화/컴포넌트/상태관리/API 연동 등에서 발생하는 모든 에러/경고/이상 동작 기록
2. 에러/이슈 유형별 분류
	- 빌드/런타임/SSR/네트워크/API/상태/동기화/권한/보안/UI/UX/테스트 등
3. 원인 분석
	- 로그/콘솔/네트워크/백엔드/DB/컨테이너/환경변수/설정/버전/의존성 등 다각도 분석
4. 해결/수정
	- 코드/설정/환경/데이터/테스트/문서 등에서 필요한 수정/보완
5. 검증/재현
	- 수정 후 실제 동작/테스트/E2E/수동 검증
6. 최종 트러블슈팅 문서화
	- 개선안2.md 또는 별도 TROUBLESHOOTING.md에 진단→원인→해결→검증→예방책까지 기록

---

### 다음 단계
- 실제 프론트엔드 주요 페이지/기능별 에러/이슈를 하나씩 진단(로그/콘솔/동작/네트워크 등)
- 각 이슈별 원인/해결/검증을 문서화
- 모든 과정을 개선안2.md 또는 TROUBLESHOOTING.md에 남김
- 진단을 시작할 준비가 되었으며, 우선순위 페이지(홈, 로그인, 상점 등)부터 차근차근 진행
## 6. 데이터베이스-프론트/백엔드 플로우 도식화 및 현황 분석

### 6.1 주요 기능별 데이터 흐름 플로우차트 (텍스트 도식)

#### [회원가입/로그인]
unifiedApi] NEXT_PUBLIC_API_ORIGIN 미설정 → fallback: http://localhost:8000
[unifiedApi] 초기화 - ctx=CSR build=dev origin=http://localhost:8000
[unifiedApi] skip GET (no token, silent) → 인증 토큰 없으면 API 호출 무시
[useGameConfig] 게임 설정 로딩 중...
[useGameConfig] 비인증 상태 → 서버 설정 호출을 건너뜀
회원가입/로그인 성공 시 JWT 토큰이 localStorage/sessionStorage에 저장됨
로그인 후 API 호출 시 Authorization 헤더에 토큰 포함됨
인증 성공 시 메인/상점/게임 등 정상 접근 가능
인증 실패/토큰 만료 시 /login으로 리다이렉트
실무 체크포인트
API ORIGIN 환경변수 누락 여부
회원가입/로그인 성공 후 토큰 저장/동기화 확인
인증 토큰 포함된 API 호출 로그 확인
인증 실패/만료 시 UX 처리(리다이렉트/에러 안내)


, 상용 서비스 기준으로 "로그인하지 않은 사용자가 메인페이지(혹은 주요 기능 페이지)에 접근 가능한 것"은 명확한 보안/UX 결함입니다.


Error: ./app/shop/page.tsx
Error:   [31mx[0m You are attempting to export "metadata" from a component marked with "use client", which is disallowed. Either remove the export, or the "use client" directive. Read more: https://nextjs.org/docs/app/api-reference/directives/use-client
  [31m|[0m

   ,-[[36;1;4m/app/app/shop/page.tsx[0m:7:1]
 [2m4[0m | import { useRouter } from 'next/navigation';
 [2m5[0m | import App from '../App';
 [2m6[0m | 
 [2m7[0m | export const metadata = {
   : [35;1m             ^^^^^^^^[0m
 [2m8[0m |   title: 'Shop - Casino-Club F2P',
 [2m9[0m |   description: 'Browse and purchase in-game items in the Casino-Club F2P shop.',
 [2m9[0m | };
   `----

Import trace for requested module:
./app/shop/page.tsx
    at tr (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/next-devtools/index.js:552:164429)
    at o6 (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/next-devtools/index.js:541:62116)
    at iP (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/next-devtools/index.js:541:81700)
    at i$ (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/next-devtools/index.js:541:92800)
    at sv (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/next-devtools/index.js:541:125399)
    at eval (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/next-devtools/index.js:541:125244)
    at sm (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/next-devtools/index.js:541:125252)
    at sa (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/next-devtools/index.js:541:121554)
    at sZ (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/next-devtools/index.js:541:143648)
    at MessagePort._ (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/compiled/next-devtools/index.js:541:196942)





상용앱 기준 정상 동작
비로그인 상태: 메인페이지, 대시보드, 게임, 상점 등 핵심 기능 접근 불가. 로그인/회원가입 화면 또는 게스트용 제한 페이지로 리다이렉트.
로그인 후: 정상적으로 메인/대시보드/게임 등 접근 가능.
개선 방안
라우팅 가드 적용

Next.js/React에서 useAuth 또는 withAuth HOC/미들웨어로 인증 체크.
인증 토큰 없으면 /login 또는 /signup으로 강제 리다이렉트.
서버/API 레벨에서도 인증 필수

백엔드(FastAPI)에서 JWT 미포함 요청은 401 Unauthorized 반환.
프론트에서 401 응답 시 자동 로그아웃 및 로그인 페이지 이동.
게스트/공개 페이지 분리

홈/소개/FAQ 등만 비로그인 접근 허용, 나머지는 인증 필수.
테스트/E2E 자동화

비로그인 상태에서 메인/게임/상점 접근 시 항상 로그인 페이지로 이동되는지 테스트 케이스 작성.
즉시 적용 가능한 액션

프론트엔드 라우터에 인증 체크 미들웨어 추가.
메인/대시보드/게임/상점 등 모든 주요 페이지에 인증 없으면 리다이렉트 로직 삽입.
백엔드 API도 인증 미포함 요청은 401 반환 재확인.

#### [게임 플레이]

#### [게임 플레이: 상세 흐름]


##### 1. 슬롯머신 (Slot)
- 프론트: SlotMachineComponent에서 사용자가 스핀 버튼 클릭 → 애니메이션/사운드 실행
- API: `/api/games/slot/spin` (POST)로 스핀 요청 전송 (JWT 쿠키 기반 인증)
- 백엔드: 슬롯 확률/보상 로직 실행, 결과/보상 계산, user_actions/user_rewards DB 기록
- DB: game_sessions(세션별 기록), user_actions(스핀 내역), user_rewards(보상 내역)
- 실시간/비동기: Redis에 스핀 결과 캐시, Kafka로 이벤트 스트림 발행(통계/알림)
- 프론트: API 응답 받아 당첨/실패 결과 표시, 피드백(애니메이션, 사운드, 토스트) 즉시 반영

##### 2. 가챠(럭키박스)
- 프론트: GachaSpinComponent에서 사용자가 뽑기 버튼 클릭 → 결과 애니메이션/소셜프루프 표시
- API: `/api/games/gacha/pull` (POST)로 뽑기 요청 전송 (JWT 쿠키 기반 인증)
- 백엔드: 가챠 확률/분포 기반 보상 추첨, user_actions/gacha_log/user_rewards DB 기록
- DB: gacha_log(뽑기 내역), user_rewards(보상 내역), user_actions(뽑기 액션)
- 실시간/비동기: Redis에 최근 뽑기 결과 캐시, Kafka로 뽑기 이벤트 발행(통계/알림)
- 프론트: API 응답 받아 아이템/등급 결과 표시, 피드백(토스트, 소셜프루프) 즉시 반영

##### 3. 크래시(Crash)
- 프론트: CrashGameComponent에서 실시간 배당률 표시, 사용자가 멈춤 버튼 클릭
- API: `/api/games/crash/play` (POST)로 플레이 요청 전송 (JWT 쿠키 기반 인증)
- 백엔드: 실시간 배당률 계산, 세션 관리, user_actions/user_rewards DB 기록
- DB: game_sessions(크래시 세션별 기록), user_actions(플레이 내역), user_rewards(보상 내역)
- 실시간/비동기: Redis에 실시간 배당률/세션 상태 캐시, Kafka로 크래시 이벤트 발행
- 프론트: API 응답 받아 배당률/성공/실패 결과 표시, 피드백(애니메이션, 사운드) 즉시 반영

##### 4. RPS(가위바위보)
- 프론트: RPSGameComponent에서 사용자가 선택 버튼 클릭 → 결과 애니메이션 표시
- API: `/api/games/rps/play` (POST)로 플레이 요청 전송 (JWT 쿠키 기반 인증)
- 백엔드: RPS 결과 계산, user_actions/user_rewards DB 기록
- DB: game_sessions(RPS 세션별 기록), user_actions(플레이 내역), user_rewards(보상 내역)
- 실시간/비동기: Redis에 최근 결과 캐시, Kafka로 RPS 이벤트 발행
- 프론트: API 응답 받아 승/패/무 결과 표시, 피드백(애니메이션, 토스트) 즉시 반영

---
각 게임별 실제 구현 기준으로 프론트→API→백엔드→DB→실시간/비동기→피드백까지 단계별 동작/연계가 명확히 구분되도록 문서화 완료.

#### [어드민 기능]
프론트(AdminScreen) → API(/api/admin/*, /api/users/*, /api/shop/*, /api/events/* 등) → 백엔드 → DB(유저, 상점, 이벤트, 미션, 로그 등) → CRUD/조회/통계/권한 관리 → 프론트 결과/피드백 표시

#### [프로필 기능]
프론트(ProfileScreen) → API(/api/users/me, /api/users/{id}/profile, /api/users/update 등) → 백엔드 → DB(users, game_sessions, rewards, missions 등) → CRUD/조회/수정/통계/알림 → 프론트 결과/피드백 표시






#### [상점/구매]
프론트(ShopScreen) → API(/api/shop/buy, /api/shop/history) → 백엔드 → DB(shop_transactions) → 결제/멱등성/보안 처리 → 프론트 잔액/구매내역 동기화





#### [미션/이벤트]
프론트(Mission/Event 컴포넌트) → API(/api/missions, /api/events) → 백엔드 → DB(missions, events, user_missions, event_participations) → 보상/진행도 동기화




#### [잔액/통계/전역 동기화]
프론트(useGlobalSync) → API(/api/users/me, /api/games/stats/me) → 백엔드 → DB → 프론트 전역 상태 갱신




---

### 6.2 기능별 구현 현황/문제점/배포 타임라인
| 게임 4종(슬롯/가챠/크래시/RPS) | ✅ 완료           | 일부 확장(신규 게임)| 가능      | 즉시         |
| 어드민 기능       | ✅ 완료           | 일부 통계/권한/로그 보강 필요| 가능      | 즉시         |
| 프로필 기능       | ✅ 완료           | 일부 UI/통계/알림 보강 필요 | 가능      | 즉시         |

### 게임/어드민/프로필 기능별 진단/트러블슈팅 항목화
- [게임] 슬롯/가챠/크래시/RPS 4종 모두 실제 동작/API/DB/상태/피드백/보상/통계까지 진단
- [어드민] 유저/상점/이벤트/미션/로그/권한/통계 등 CRUD/조회/통계/권한 관리 기능별 진단
- [프로필] 유저 정보/게임 세션/보상/미션/알림/통계 등 CRUD/조회/수정/알림 기능별 진단
- 각 기능별로 에러/이슈 발생 시 진단→원인→해결→검증→문서화 프로세스 적용

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

## 5. 기능/연계성 요약
- 모든 서비스는 docker-compose로 통합 관리
- 백엔드 FastAPI, 프론트 Next.js, DB PostgreSQL, 캐시 Redis, 메시지 Kafka, OLAP ClickHouse
- 시드 데이터/테스트/마이그레이션은 backend/app/scripts에서 관리
- API 문서와 정책은 api docs/에 집중
- 로그/데이터/백업은 별도 디렉터리로 분리
- 모든 변경/정책/테스트 결과는 개선안2.md, api docs/20250808.md에 기록

---

이 가이드 파일은 전체 구조/기능/연계성 파악을 위한 1차 초안입니다.
추가 분석/세부 기능/테스트/보안/운영 포인트는 2~5회에 걸쳐 더 깊게 정리 가능합니다.

