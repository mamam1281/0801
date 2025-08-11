# 🚀 Casino-Club F2P API 맵핑 문서

## 📋 개요
이 문서는 Casino-Club F2P 프로젝트의 백엔드 API 구조와 연결 관계를 정리한 맵핑 문서입니다. 모든 API 엔드포인트와 관련 모듈을 체계적으로 관리하기 위해 작성되었습니다.

## 🏗️ API 구조

### 1. 인증 시스템 (Authentication)
| 라우터 파일 | 엔드포인트 접두사 | 주요 기능 | 상태 |
|------------|-----------------|---------|------|
| `auth.py` | `/api/auth` | JWT 인증, 로그인/회원가입 | 통합 완료 ✅ |

#### 1.1 인증 API 상세 정보

| 기능 | HTTP 메소드 | 경로 | 설명 | 인증 필요 | 상태 |
|------|------------|-----|------|-----------|------|
| 회원가입 | POST | `/api/auth/signup` | 새로운 사용자 등록 | 아니오 | 구현 완료 ✅ |
| 로그인 | POST | `/api/auth/login` | 사용자 로그인 | 아니오 | 테스트 중 |
| 관리자 로그인 | POST | `/api/auth/admin/login` | 관리자 로그인 | 아니오 | 테스트 중 |
| 토큰 갱신 | POST | `/api/auth/refresh` | JWT 토큰 갱신 | 예 (토큰) | 테스트 중 |
| 로그아웃 | POST | `/api/auth/logout` | 사용자 로그아웃 | 예 (토큰) | 테스트 중 |

#### 1.2 회원가입 API 명세

- **엔드포인트**: `/api/auth/signup`
- **메소드**: POST
- **요청 본문**:
  ```json
  {
    "site_id": "string",      // 사용자 아이디 (필수)
    "password": "string",     // 비밀번호 (4자리 이상)
    "nickname": "string",     // 닉네임 (필수)
    "phone_number": "string", // 전화번호 (필수)
    "invite_code": "string"   // 초대 코드 (5858)
  }
  ```
- **응답**:
  ```json
  {
    "user_id": "integer",     // 생성된 사용자 ID
    "site_id": "string",      // 사용자 아이디
    "nickname": "string",     // 닉네임
    "message": "string"       // 성공 메시지
  }
  ```
- **검증 사항**:
  - [x] 초대 코드 "5858" 확인
  - [x] 비밀번호 4자리 이상
  - [x] 아이디/닉네임/전화번호 중복 검사
  - [x] 보안 이벤트 기록

#### 1.1 인증 API 상세 정보

| 기능 | HTTP 메소드 | 경로 | 설명 | 인증 필요 |
|------|------------|-----|------|-----------|
| 회원가입 | POST | `/api/auth/signup` | 새로운 사용자 등록 | 아니오 |
| 로그인 | POST | `/api/auth/login` | 사용자 로그인 | 아니오 |
| 관리자 로그인 | POST | `/api/auth/admin/login` | 관리자 로그인 | 아니오 |
| 토큰 갱신 | POST | `/api/auth/refresh` | JWT 토큰 갱신 | 예 (토큰) |
| 로그아웃 | POST | `/api/auth/logout` | 사용자 로그아웃 | 예 (토큰) |

### 2. 사용자 관리 (User Management)
| 라우터 파일 | 엔드포인트 접두사 | 주요 기능 | 상태 |
|------------|-----------------|---------|------|
| `users.py` | `/api/users` | 사용자 프로필, 설정 | 활성화 |
| `invite_router.py` | `/api/invite` | 초대 코드 시스템 | 활성화 |
| `segments.py` | `/api/segments` | 사용자 세그먼트 관리 | 활성화 |

### 3. 게임 시스템 (Game Systems)
| 라우터 파일 | 엔드포인트 접두사 | 주요 기능 | 상태 |
|------------|-----------------|---------|------|
| `games.py` | `/api/games` | 게임 컬렉션 | 활성화 |
| `prize_roulette.py` | `/api/games/roulette` | 룰렛 게임 | 활성화 |
| `gacha.py` | `/api/gacha` | 가챠 시스템 (레거시) | Deprecated/삭제 예정 |
| `games.py` | `/api/games/gacha` | 가챠 시스템(통합) | 활성화 |
| `rps.py` | `/api/games/rps` | 가위바위보 게임 | 활성화 |
| `game_api.py` | `/api/game` | 통합 게임 API | 개발 중 |

### 4. 보상 시스템 (Reward Systems)
| 라우터 파일 | 엔드포인트 접두사 | 주요 기능 | 상태 |
|------------|-----------------|---------|------|
| `rewards.py` | `/api/rewards` | 보상 관리 | 활성화 |
| `unlock.py` | `/api/unlock` | 컨텐츠 잠금해제 | 활성화 |
| `adult_content.py` | `/api/adult` | 성인 컨텐츠 관리 | 활성화 |

### 5. 참여 시스템 (Engagement Systems)
| 라우터 파일 | 엔드포인트 접두사 | 주요 기능 | 상태 |
|------------|-----------------|---------|------|
| `missions.py` | `/api/missions` | 미션 시스템 | 활성화 |
| `events.py` | `/api/events` | 이벤트 관리 | 활성화 |
| `quiz.py` | `/api/quiz` | 심리 테스트 | 활성화 |

### 6. 상점 및 결제 (Shop & Payments)
| 라우터 파일 | 엔드포인트 접두사 | 주요 기능 | 상태 |
|------------|-----------------|---------|------|
| `shop.py` | `/api/shop` | 상점 시스템 | 활성화 |
| `corporate.py` | `/v1/corporate` | 기업 연동 | 활성화 |

### 7. 커뮤니케이션 (Communication)
| 라우터 파일 | 엔드포인트 접두사 | 주요 기능 | 상태 |
|------------|-----------------|---------|------|
| `chat.py` | `/api/chat` | 채팅 시스템 | 활성화 |
| `notification.py` | `/api/notification` | 알림 시스템 | 활성화 |
| `feedback.py` | `/api/feedback` | 피드백 관리 | 활성화 |

### 8. AI 및 개인화 (AI & Personalization)
| 라우터 파일 | 엔드포인트 접두사 | 주요 기능 | 상태 |
|------------|-----------------|---------|------|
| `ai.py` | `/api/ai` | AI 서비스 | 활성화 |
| `personalization.py` | `/api/personalize` | 개인화 시스템 | 활성화 |
| `recommendation.py` | `/api/recommendation` | 추천 시스템 | 활성화 |

### 9. 분석 및 관리자 (Analytics & Admin)
| 라우터 파일 | 엔드포인트 접두사 | 주요 기능 | 상태 |
|------------|-----------------|---------|------|
| `admin.py` | `/api/admin` | 관리자 기능 | 활성화 |
| `tracking.py` | `/api/tracking` | 사용자 행동 추적 | 활성화 |
| `analyze.py` | `/api/analyze` | 데이터 분석 | 활성화 |
| `dashboard.py` | `/api/dashboard` | 대시보드 | 활성화 |

## 🔄 API 통합 계획

### 단계 1: 인증 시스템 통합
1. ✅ `auth.py`와 `auth_simple.py` 통합 완료
2. 토큰 기반 인증 시스템 테스트
3. 인증 의존성 검토 및 최적화

### 단계 2: 사용자 관리 API 연결
1. 사용자 프로필 API 엔드포인트 구현
2. 초대 코드 시스템 연동
3. 사용자 세그먼트 API 활성화

### 단계 3: 게임 시스템 통합
1. 게임 API 일관성 검토
2. 게임별 엔드포인트 구현 및 연동
3. 통합 게임 API 개발

### 단계 4: 보상 및 컨텐츠 시스템 연결
1. 보상 시스템 API 구현
2. 컨텐츠 잠금해제 시스템 연동
3. 성인 컨텐츠 관리 엔드포인트 활성화

### 단계 5: 참여 및 상호작용 시스템 통합
1. 미션 시스템 API 연결
2. 이벤트 관리 엔드포인트 구현
3. 퀴즈 및 심리 테스트 API 활성화

### 단계 6: 상점 및 결제 시스템 연동
1. 상점 API 구현 및 테스트
2. 기업 연동 엔드포인트 활성화
3. 결제 프로세스 검증

### 단계 7: 커뮤니케이션 시스템 통합
1. 채팅 시스템 WebSocket 연결 구현
2. 알림 시스템 엔드포인트 활성화
3. 피드백 관리 API 연동

### 단계 8: AI 및 개인화 시스템 연결
1. AI 서비스 엔드포인트 구현
2. 개인화 시스템 API 연동
3. 추천 엔진 활성화

### 단계 9: 분석 및 관리자 기능 통합
1. 관리자 대시보드 API 구현
2. 사용자 행동 추적 엔드포인트 활성화
3. 데이터 분석 API 연동

## 📊 API 통합 상태 대시보드

| 카테고리 | 총 API 수 | 구현 완료 | 테스트 완료 | 프론트엔드 연동 |
|---------|----------|----------|-----------|--------------|
| 인증 시스템 | 1 | 1 | 1 | 진행 중 |
| 사용자 관리 | 3 | 3 | 2 | 진행 중 |
| 게임 시스템 | 5 | 4 | 3 | 진행 중 |
| 보상 시스템 | 3 | 3 | 2 | 진행 중 |
| 참여 시스템 | 3 | 3 | 2 | 진행 중 |
| 상점 및 결제 | 2 | 2 | 1 | 진행 중 |
| 커뮤니케이션 | 3 | 3 | 2 | 진행 중 |
| AI 및 개인화 | 3 | 3 | 2 | 진행 중 |
| 분석 및 관리자 | 4 | 4 | 3 | 진행 중 |

## 📝 API 연동 체크리스트

- [ ] 모든 API 엔드포인트 문서화
- [ ] API 응답 형식 표준화
- [ ] 오류 처리 일관성 확보
- [ ] API 버전 관리 전략 수립
- [ ] CORS 설정 및 보안 검토
- [ ] 프론트엔드 연동 테스트
- [ ] 성능 및 부하 테스트
- [ ] API 모니터링 시스템 구축


# 파일 통합 보고서 (File Consolidation Report)

## 개요 (Overview)

이 문서는 Casino-Club F2P 프로젝트의 중복 파일을 통합한 내용을 요약합니다. 코드의 중복을 최소화하고 유지보수성을 향상시키기 위해 여러 "_simple" 접미사 파일들을 통합했습니다.

## 통합된 파일 (Consolidated Files)

### 인증 시스템 (Authentication System)

1. **auth.py와 auth_simple.py 통합**
   - `auth_simple.py`의 기능을 `auth.py`로 통합
   - 간소화된 인증 메커니즘 유지
   - 토큰 기반 인증 시스템으로 통일

2. **simple_auth.py 생성 (새로운 통합 파일)**
   - `auth_simple.py`와 `dependencies_simple.py`의 필수 기능을 통합
   - 인증 관련 핵심 함수를 단일 모듈로 제공
   - 모든 API 라우터에서 일관되게 사용 가능

### 설정 관리 (Configuration Management)

1. **config.py와 config_simple.py 통합**
   - 모든 설정을 `config.py`로 통합
   - 환경 변수 관리 방식 일원화
   - 애플리케이션 전반에서 일관된 설정 사용

### 의존성 관리 (Dependency Management)

1. **dependencies.py와 dependencies_simple.py 통합**
   - 인증 및 접근 제어 관련 의존성 통합
   - 중복 코드 제거
   - 로깅 기능 강화

### 데이터 모델 (Data Models)

1. **auth_models.py와 simple_auth_models.py 통합**
   - 사용자 관련 모델을 `auth_models.py`로 통합
   - 인증 관련 모델 스키마 통일
   - 불필요한 중복 모델 제거

## 유지된 "simple" 파일 (Retained "simple" files)

다음 파일들은 특수 목적으로 사용되므로 유지됩니다:

1. **simple_logging.py**
   - 간소화된 API 로깅 기능 제공
   - main.py에서 직접 참조

2. **simple_user_service.py**
   - 특화된 사용자 서비스 기능 제공
   - 일반 user_service.py와 구별되는 목적 제공

3. **admin_simple.py**
   - 간소화된 관리자 API 제공
   - 일반 admin.py와 별도 기능 제공

## 통합 효과 (Benefits of Consolidation)

1. **코드 중복 감소**
   - 유사한 기능의 코드 중복 제거
   - 유지보수성 향상

2. **일관성 증가**
   - 인증 및 권한 부여 방식의 일관성 확보
   - 설정 및 의존성 관리 일원화

3. **프로젝트 구조 개선**
   - 명확한 파일 구조 확립
   - API 라우팅 체계 개선

4. **API 응답 표준화**
   - 일관된 인증 메커니즘을 통한 API 응답 표준화
   - 오류 처리 일관성 향상

## 다음 단계 (Next Steps)

1. **API 엔드포인트 문서화**
   - 통합된 API 엔드포인트 문서 업데이트
   - Swagger/OpenAPI 스키마 갱신

2. **테스트 코드 갱신**
   - 통합된 파일을 참조하도록 테스트 코드 업데이트
   - 회귀 테스트 수행

3. **프론트엔드 연동 검증**
   - 통합된 인증 시스템과 프론트엔드 연동 검증
   - 오류 상황 테스트
