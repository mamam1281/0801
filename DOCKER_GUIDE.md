# 🐳 CC Webapp Docker 사용 가이드

## 📂 Docker 파일 구조

```
c:\Users\c\Documents\2026\auto202506-a\
├── docker-compose.yml              # 기본 서비스 정의
├── docker-compose.override.yml     # 개발 환경 설정 (자동 적용)
├── docker-compose.prod.yml         # 프로덕션 환경 설정
├── .env                            # 개발 환경 변수
└── .env.example                    # 환경 변수 템플릿
```

## 🚀 사용 방법

### 개발 환경 실행

```powershell
# 환경 설정 (최초 1회)
Copy-Item .env.example .env
# .env 파일을 편집하여 필요한 값 수정

# 모든 서비스 시작
docker-compose up -d

# 특정 서비스만 시작
docker-compose up -d postgres redis

# 로그 확인
docker-compose logs -f backend
docker-compose logs -f frontend

# 서비스 중지
docker-compose down

# 볼륨 포함 완전 삭제
docker-compose down -v
```

### 프로덕션 환경 실행

```powershell
# 프로덕션 환경 변수 설정
Copy-Item .env.example .env.prod
# .env.prod 파일을 편집하여 프로덕션 값 설정

# 프로덕션 빌드 및 실행
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d --build

# 프로덕션 서비스 중지
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
```

## 🔧 환경별 차이점

### 개발 환경 (docker-compose.override.yml)
- ✅ 핫 리로드 활성화
- ✅ 소스 코드 마운트
- ✅ 디버그 모드 활성화
- ✅ 포트 노출 (3000, 8000)

### 프로덕션 환경 (docker-compose.prod.yml)
- ✅ 자동 재시작 활성화
- ✅ 소스 코드 마운트 비활성화
- ✅ Nginx 리버스 프록시 추가
- ✅ 보안 강화 (포트 비노출)

## 📊 서비스 구성

| 서비스 | 포트 | 용도 |
|--------|------|------|
| postgres | 5432 | 메인 데이터베이스 |
| redis | 6379 | 캐시 & 세션 |
| kafka | 9093 | 이벤트 스트리밍 |
| backend | 8000 | FastAPI 서버 |
| frontend | 3000 | Next.js 앱 |
| celery-worker | - | 백그라운드 작업 |
| celery-beat | - | 스케줄러 |

## 🏥 헬스체크

모든 서비스에 헬스체크가 설정되어 있습니다:

```powershell
# 서비스 상태 확인
docker-compose ps

# 헬스체크 로그 확인
docker inspect $(docker-compose ps -q postgres) | grep -A 10 Health
```

## 🔍 트러블슈팅

### 데이터베이스 연결 오류
```powershell
# PostgreSQL 연결 확인
docker-compose exec postgres pg_isready -U cc_user

# 로그 확인
docker-compose logs postgres
```

### Redis 연결 오류
```powershell
# Redis 연결 확인
docker-compose exec redis redis-cli ping

# 로그 확인
docker-compose logs redis
```

### 백엔드 서비스 오류
```powershell
# 백엔드 헬스체크
curl http://localhost:8000/health

# 마이그레이션 재실행
docker-compose exec backend alembic upgrade head

# 로그 확인
docker-compose logs backend
```

## 📋 문서 참조

이 Docker 구성은 다음 문서의 요구사항을 반영합니다:

- ✅ **01_architecture_en.md**: FastAPI + PostgreSQL + Redis + Kafka 구조
- ✅ **05_corporate_retention_en.md**: 사이버 토큰 시스템
- ✅ **013_checklist_prompt_ko.md**: 백엔드 파일 구조 검증

## 🚨 보안 주의사항

### 개발 환경
- `.env` 파일을 Git에 커밋하지 마세요
- 기본 비밀번호를 사용하지 마세요

### 프로덕션 환경
- `.env.prod` 파일의 모든 기본값을 변경하세요
- SSL 인증서를 설정하세요
- 방화벽을 설정하세요
