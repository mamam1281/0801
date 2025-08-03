#!/bin/bash

# Casino-Club F2P SSH 서버 배포 스크립트
# 이 스크립트는 SSH 서버에서 개발 환경을 설정하고 포트를 열어줍니다.

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# 서버 정보 설정 (실제 서버 정보로 변경하세요)
SERVER_USER="root"  # 또는 실제 사용자명
SERVER_IP="YOUR_SERVER_IP"  # 실제 서버 IP 주소
SERVER_PATH="/opt/casino-club"  # 서버에서 프로젝트가 설치될 경로

# 환경 변수 설정
BACKEND_PORT=8000
FRONTEND_PORT=3000
POSTGRES_PORT=5432

log "🚀 Casino-Club F2P 서버 배포 시작"

# 1. 서버 초기 설정 확인
setup_server() {
    log "📡 서버 접속 및 초기 설정 확인 중..."
    
    ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
        # 시스템 업데이트
        echo "시스템 업데이트 중..."
        sudo apt update && sudo apt upgrade -y
        
        # 필수 패키지 설치
        echo "필수 패키지 설치 중..."
        sudo apt install -y curl wget git unzip htop vim build-essential
        
        # Docker 설치 확인
        if ! command -v docker &> /dev/null; then
            echo "Docker 설치 중..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
        fi
        
        # Docker Compose 설치 확인
        if ! command -v docker-compose &> /dev/null; then
            echo "Docker Compose 설치 중..."
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        fi
        
        # 방화벽 설정
        echo "방화벽 설정 중..."
        sudo ufw allow 22
        sudo ufw allow 80
        sudo ufw allow 443
        sudo ufw allow 8000  # 백엔드 포트
        sudo ufw allow 3000  # 프론트엔드 포트
        sudo ufw allow 5432  # PostgreSQL 포트 (개발용)
        sudo ufw --force enable
        
        echo "서버 초기 설정 완료!"
ENDSSH

    success "서버 초기 설정 완료"
}

# 2. 프로젝트 배포
deploy_project() {
    log "📦 프로젝트 배포 중..."
    
    # 로컬 프로젝트를 서버에 복사
    rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '__pycache__' \
        ./ ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/
    
    success "프로젝트 파일 복사 완료"
}

# 3. 환경 변수 설정
setup_env() {
    log "🔧 환경 변수 설정 중..."
    
    ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
        cd ${SERVER_PATH}
        
        # .env 파일 생성
        cat > .env << EOF
# Database Configuration
POSTGRES_USER=cc_user
POSTGRES_PASSWORD=cc_secure_password_$(openssl rand -hex 8)
POSTGRES_DB=cc_webapp_db
POSTGRES_PORT=${POSTGRES_PORT}

# Backend Configuration
BACKEND_PORT=${BACKEND_PORT}
JWT_SECRET=jwt_secret_$(openssl rand -hex 16)

# Frontend Configuration
FRONTEND_PORT=${FRONTEND_PORT}
NEXT_PUBLIC_API_URL=http://localhost:${BACKEND_PORT}

# Environment
NODE_ENV=development
ENVIRONMENT=development
EOF
        
        echo "환경 변수 파일 생성 완료"
ENDSSH

    success "환경 변수 설정 완료"
}

# 4. Docker Compose로 서비스 실행
start_services() {
    log "🐋 Docker 서비스 시작 중..."
    
    ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
        cd ${SERVER_PATH}
        
        # 기존 컨테이너 정리
        docker-compose down --remove-orphans 2>/dev/null || true
        
        # 새로운 컨테이너 빌드 및 실행
        docker-compose up -d --build
        
        # 서비스 상태 확인
        echo "서비스 상태 확인 중..."
        sleep 10
        docker-compose ps
        
        # 로그 확인
        echo "백엔드 로그:"
        docker-compose logs backend --tail 20
ENDSSH

    success "Docker 서비스 시작 완료"
}

# 5. 데이터베이스 초기화
setup_database() {
    log "🗄️ 데이터베이스 초기화 중..."
    
    ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
        cd ${SERVER_PATH}
        
        # 데이터베이스 마이그레이션 대기
        echo "데이터베이스 연결 대기 중..."
        sleep 20
        
        # 백엔드 컨테이너에서 데이터베이스 초기화
        docker-compose exec -T backend python -c "
from app.database import engine, Base
Base.metadata.create_all(bind=engine)
print('데이터베이스 테이블 생성 완료')
"
        
        # 초기 데이터 생성
        docker-compose exec -T backend python -c "
from app.services.init_data import create_initial_data
create_initial_data()
print('초기 데이터 생성 완료')
" 2>/dev/null || echo "초기 데이터 스크립트 실행 시도 완료"
        
ENDSSH

    success "데이터베이스 초기화 완료"
}

# 6. 프론트엔드 빌드 및 실행
setup_frontend() {
    log "🎨 프론트엔드 설정 중..."
    
    ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
        cd ${SERVER_PATH}/cc-webapp/frontend
        
        # Node.js 설치 확인
        if ! command -v node &> /dev/null; then
            echo "Node.js 설치 중..."
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        fi
        
        # 패키지 설치
        echo "프론트엔드 패키지 설치 중..."
        npm install
        
        # 개발 서버 백그라운드 실행
        echo "프론트엔드 개발 서버 시작 중..."
        npm run dev > /dev/null 2>&1 &
        
        echo "프론트엔드 서버가 포트 ${FRONTEND_PORT}에서 실행 중입니다."
ENDSSH

    success "프론트엔드 설정 완료"
}

# 7. 서비스 상태 확인 및 접속 정보 출력
show_status() {
    log "📊 서비스 상태 확인 중..."
    
    ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
        cd ${SERVER_PATH}
        
        echo "=== Docker 컨테이너 상태 ==="
        docker-compose ps
        
        echo ""
        echo "=== 포트 사용 현황 ==="
        netstat -tlnp | grep -E ':(8000|3000|5432)'
        
        echo ""
        echo "=== 서비스 접속 정보 ==="
        echo "🌐 백엔드 API: http://$(curl -s ifconfig.me):${BACKEND_PORT}"
        echo "📚 API 문서: http://$(curl -s ifconfig.me):${BACKEND_PORT}/docs"
        echo "🎨 프론트엔드: http://$(curl -s ifconfig.me):${FRONTEND_PORT}"
        echo "🗄️ PostgreSQL: $(curl -s ifconfig.me):${POSTGRES_PORT}"
        echo ""
        echo "📱 관리자 페이지: http://$(curl -s ifconfig.me):${FRONTEND_PORT}/admin"
        echo "🔑 테스트 초대코드: 5882, 6969, 6974"
ENDSSH

    success "배포 완료! 위의 URL로 접속해서 테스트하실 수 있습니다."
}

# 메인 실행
main() {
    if [ "$SERVER_IP" = "YOUR_SERVER_IP" ]; then
        error "SERVER_IP를 실제 서버 IP 주소로 변경해주세요!"
        echo "스크립트 상단의 SERVER_IP 변수를 수정하세요."
        exit 1
    fi
    
    log "서버 배포를 시작합니다..."
    log "서버 주소: ${SERVER_USER}@${SERVER_IP}"
    log "설치 경로: ${SERVER_PATH}"
    
    setup_server
    deploy_project
    setup_env
    start_services
    setup_database
    setup_frontend
    show_status
    
    success "🎉 Casino-Club F2P 서버 배포가 완료되었습니다!"
    warning "방화벽 설정에 따라 포트 접근이 제한될 수 있습니다."
    warning "클라우드 서비스 사용 시 보안 그룹/방화벽 규칙을 확인해주세요."
}

# 스크립트 실행
main "$@"
