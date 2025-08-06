# 🎰 Casino-Club F2P - Google Jules 환경 설정 프롬프트

## Jules에게 전달할 명령어

```bash
# Jules 환경에서 다음 명령어를 순서대로 실행해주세요

# 1. 프로젝트 디렉토리로 이동
cd /workspace  # 또는 Jules가 설정한 워크스페이스 경로

# 2. 환경 설정 스크립트 실행
chmod +x setup-jules-dockerless.sh
./setup-jules-dockerless.sh

# 3. 환경 설정 완료 후, 서비스 시작
./start-all.sh

# 4. 서비스 상태 확인
sleep 10
curl http://localhost:8000/docs
curl http://localhost:3000
```

## Jules를 위한 상세 가이드

### 환경 전제조건
- Ubuntu 환경 (Google Jules 기본 제공)
- Python 3.8+ 설치됨
- Node.js 16+ 설치됨
- 인터넷 연결 가능

### 예상 실행 시간
- 전체 설정: 5-10분
- 백엔드 의존성 설치: 2-3분
- 프론트엔드 의존성 설치: 3-5분

### 성공 확인 방법
1. **백엔드 API 확인**: `curl http://localhost:8000/docs` 응답 200
2. **프론트엔드 확인**: `curl http://localhost:3000` 응답 200
3. **데이터베이스 확인**: `cc-webapp/backend/local_dev.db` 파일 존재

### 문제 해결
만약 설정 중 오류가 발생하면:

```bash
# 로그 확인
tail -f backend.log
tail -f frontend.log

# 개별 서비스 재시작
./start-backend.sh
./start-frontend.sh

# 전체 환경 재설정
rm -rf cc-webapp/backend/venv cc-webapp/frontend/node_modules
./setup-jules-dockerless.sh
```

## A.md 작업 수행을 위한 Jules 프롬프트

환경 설정이 완료되면, 다음과 같이 A.md의 작업을 요청할 수 있습니다:

---

**Jules에게 보낼 메시지:**

```
Casino-Club F2P 프로젝트의 개발환경이 성공적으로 설정되었습니다. 
이제 A.md 문서에 명시된 "프론트엔드/백엔드/데이터 연동 작업"을 수행해주세요.

현재 환경:
- 백엔드: FastAPI (http://localhost:8000)
- 프론트엔드: Next.js (http://localhost:3000)  
- 데이터베이스: SQLite (로컬 개발용)

다음 작업들을 순서대로 진행해주세요:

1. **Phase 1: Core User & Authentication System**
   - 사용자 등록/로그인 API 구현
   - JWT 인증 시스템 구축
   - 사용자 프로필 관리

2. **Phase 2: Game Core & Dopamine Loop Mechanisms**
   - 슬롯머신 게임 로직 구현
   - 가챠 시스템 개발
   - 리워드 시스템 구축

3. **Phase 3: Data-Driven Personalization**
   - RFM 분석 시스템
   - 개인화 추천 엔진
   - 사용자 세그먼테이션

4. **Phase 4: Frontend UI/UX**
   - Futuristic Neon Cyberpunk 테마 적용
   - Tailwind CSS + Framer Motion 애니메이션
   - 반응형 디자인 구현

각 Phase별로 완료 상태를 보고해주시고, 다음 단계로 진행하기 전에 확인을 요청해주세요.
```

---

## 환경별 설정 차이점

### Docker vs Docker-less 비교

| 항목 | Docker 환경 | Docker-less 환경 |
|------|-------------|-------------------|
| 데이터베이스 | PostgreSQL | SQLite |
| Redis | 컨테이너 | 미사용 (로컬 개발) |
| Kafka | 컨테이너 | 미사용 (로컬 개발) |
| 설정 복잡도 | 높음 | 낮음 |
| 시작 시간 | 느림 (이미지 빌드) | 빠름 |
| 개발 편의성 | 높음 (격리) | 높음 (직접 접근) |

### Jules 환경 최적화 특징
- **SQLite 사용**: 별도 DB 서버 불필요
- **가상환경 격리**: Python 의존성 충돌 방지
- **자동 마이그레이션**: Alembic 다중 헤드 자동 해결
- **백그라운드 실행**: 서비스 지속 실행 가능
- **로그 분리**: 디버깅 용이성

이 설정으로 Jules에서 A.md의 모든 작업을 안정적으로 수행할 수 있습니다!
