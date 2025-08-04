# 🎰 Casino-Club F2P - Enhanced Docker Development Guide

## 📋 Overview
이 문서는 Casino-Club F2P 프로젝트의 고도화된 Docker Compose 기반 개발환경 사용법을 안내합니다.

## 🚀 Quick Start

### 1. 환경 체크 및 초기 설정
```powershell
# 개발환경 체크
.\docker-manage.ps1 check

# 초기 환경 설정 (디렉토리 생성, 이미지 빌드)
.\docker-manage.ps1 setup
```

### 2. 서비스 시작
```powershell
# 기본 서비스 시작
.\docker-manage.ps1 start

# 개발 도구 포함 시작 (pgAdmin, Redis Commander, Kafka UI)
.\docker-manage.ps1 start --tools
```

### 3. 서비스 상태 확인
```powershell
# 모든 서비스 상태 확인
.\docker-manage.ps1 status

# 성능 모니터링
.\docker-manage.ps1 monitor
```

## 🏗️ Architecture Overview

### Core Services
- **Backend API**: FastAPI (Python 3.11) - Port 8000
- **Frontend**: Next.js 15.3.3 - Port 3000
- **Database**: PostgreSQL 14 - Port 5432
- **Cache**: Redis 7 - Port 6379
- **Message Queue**: Kafka + Zookeeper - Port 9093
- **Background Tasks**: Celery Worker + Beat

### Development Tools (--tools profile)
- **pgAdmin**: Database management - Port 5050
- **Redis Commander**: Redis management - Port 8081
- **Kafka UI**: Kafka management - Port 8082

## 🔧 Development Workflow

### Daily Development Routine
```powershell
# 1. 개발환경 시작
.\docker-manage.ps1 start --tools

# 2. 백엔드 개발 - 컨테이너 진입
.\docker-manage.ps1 shell backend

# 3. 프론트엔드 개발 - 컨테이너 진입
.\docker-manage.ps1 shell frontend

# 4. 로그 확인
.\docker-manage.ps1 logs backend
.\docker-manage.ps1 logs frontend

# 5. 테스트 실행
.\docker-manage.ps1 test coverage
```

### Database Operations
```powershell
# 마이그레이션 실행
.\docker-manage.ps1 migrate

# 테스트 데이터 시드
.\docker-manage.ps1 seed

# 데이터베이스 백업
.\docker-manage.ps1 backup

# 데이터베이스 리셋
.\docker-manage.ps1 reset-db
```

## 📁 File Structure

```
auto7777/
├── docker-manage.ps1                 # 향상된 Docker 관리 스크립트
├── docker-compose.yml               # 메인 Docker Compose 설정
├── docker-compose.override.dev.yml  # 개발환경 오버라이드
├── docker-compose.prod.yml          # 프로덕션 설정
├── .env.development                 # 개발환경 변수
├── .env.production                  # 프로덕션 환경 변수
├── cc-webapp/
│   ├── backend/                     # FastAPI 백엔드
│   │   ├── app/
│   │   ├── tests/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   └── frontend/                    # Next.js 프론트엔드
│       ├── app/
│       ├── components/
│       ├── package.json
│       └── Dockerfile
├── logs/                           # 로그 디렉토리
│   ├── backend/
│   ├── frontend/
│   ├── postgres/
│   └── celery/
└── data/                           # 데이터 디렉토리
    ├── init/                       # DB 초기화 스크립트
    └── backup/                     # 백업 파일
```

## 🧪 Testing Strategy

### Backend Testing
```powershell
# 전체 백엔드 테스트
.\docker-manage.ps1 test backend

# 커버리지 포함 테스트
.\docker-manage.ps1 test coverage

# 특정 테스트 파일 실행
.\docker-manage.ps1 shell backend
pytest tests/test_auth.py -v
```

### Frontend Testing
```powershell
# 프론트엔드 테스트
.\docker-manage.ps1 test frontend

# 컴포넌트 테스트
.\docker-manage.ps1 shell frontend
npm run test
```

## 🌐 Service URLs

### Development Environment
- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **pgAdmin**: http://localhost:5050
  - Email: admin@casino-club.local
  - Password: admin123
- **Redis Commander**: http://localhost:8081
- **Kafka UI**: http://localhost:8082

### Database Connection (External Tools)
- **Host**: localhost
- **Port**: 5432
- **Database**: cc_webapp
- **Username**: cc_user
- **Password**: cc_password

## 🔧 Troubleshooting

### Common Issues

#### 1. Port 3000 Already in Use
```powershell
# 포트 사용 프로세스 확인
netstat -ano | findstr :3000

# 프로세스 종료 (PID 확인 후)
taskkill /F /PID <PID>
```

#### 2. Docker Build Issues
```powershell
# 캐시 없이 재빌드
.\docker-manage.ps1 build

# 또는 수동으로
docker-compose build --no-cache
```

#### 3. Database Connection Issues
```powershell
# PostgreSQL 컨테이너 로그 확인
.\docker-manage.ps1 logs postgres

# 데이터베이스 컨테이너 재시작
.\docker-manage.ps1 restart postgres
```

#### 4. Volume Issues
```powershell
# 볼륨 정리 (주의: 데이터 삭제)
.\docker-manage.ps1 clean volumes
```

### Performance Optimization

#### 1. Container Resource Monitoring
```powershell
# 실시간 리소스 사용량 확인
.\docker-manage.ps1 monitor

# 또는 Docker stats 직접 사용
docker stats
```

#### 2. Log Management
```powershell
# 로그 크기 확인
Get-ChildItem -Path "logs" -Recurse | Measure-Object -Property Length -Sum

# 로그 정리 (필요시)
Remove-Item "logs\*\*.log" -Force
```

## 🚀 Deployment

### Production Deployment
```powershell
# 프로덕션 환경 시작
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d

# 모니터링 포함 시작
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production --profile monitoring up -d
```

### Environment Variables Security
프로덕션 배포 시 `.env.production` 파일의 모든 비밀번호와 키를 반드시 변경하세요:
- `JWT_SECRET_KEY`
- `API_SECRET_KEY`
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `CORPORATE_API_KEY`

## 📊 Monitoring and Logging

### Log Locations
- Backend: `logs/backend/`
- Frontend: `logs/frontend/`
- PostgreSQL: `logs/postgres/`
- Celery: `logs/celery/`
- Nginx: `logs/nginx/`

### Health Checks
모든 서비스는 자동 헬스체크가 설정되어 있습니다:
- Backend: `/docs` 엔드포인트 확인
- Frontend: 메인 페이지 응답 확인
- PostgreSQL: `pg_isready` 명령
- Redis: `PING` 명령
- Kafka: Topic 목록 조회

## 🎯 Best Practices

### 1. Development Workflow
- 매일 작업 시작 시 `.\docker-manage.ps1 status`로 서비스 상태 확인
- 코드 변경 후 관련 테스트 실행
- 커밋 전 `.\docker-manage.ps1 test coverage` 실행
- 정기적으로 `.\docker-manage.ps1 backup` 실행

### 2. Performance
- 개발 중 불필요한 도구는 `--tools` 없이 시작
- 정기적으로 `.\docker-manage.ps1 clean containers` 실행
- 로그 파일 크기 모니터링

### 3. Security
- 개발환경에서도 `.env` 파일을 Git에 커밋하지 않기
- 프로덕션 시크릿은 별도 관리
- 정기적으로 Docker 이미지 업데이트

## 🆘 Support

### Getting Help
```powershell
# 전체 명령어 목록
.\docker-manage.ps1 help

# 환경 상태 체크
.\docker-manage.ps1 check

# 서비스 상태 확인
.\docker-manage.ps1 status
```

### Useful Commands
```powershell
# 모든 서비스 재시작
.\docker-manage.ps1 restart

# 특정 서비스 재시작
.\docker-manage.ps1 restart backend

# 모든 로그 실시간 확인
.\docker-manage.ps1 logs

# 백엔드 로그만 확인
.\docker-manage.ps1 logs backend
```

이 가이드를 통해 Casino-Club F2P 프로젝트의 개발환경을 효율적으로 관리하고 개발 생산성을 극대화할 수 있습니다.
