#!/bin/bash

# Casino-Club F2P 헬스체크 스크립트 (Bash 버전)
# PowerShell이 없는 환경에서 사용

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# 기본 설정
BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
TIMEOUT="${TIMEOUT:-10}"

# 함수 정의
print_colored() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_success() { print_colored "$GREEN" "$1"; }
print_error() { print_colored "$RED" "$1"; }
print_warning() { print_colored "$YELLOW" "$1"; }
print_info() { print_colored "$CYAN" "$1"; }
print_gray() { print_colored "$GRAY" "$1"; }

test_service_health() {
    local service_name=$1
    local url=$2
    local health_path=$3
    local timeout=$4
    
    print_info "🔍 $service_name 서비스 확인 중..."
    local full_url="${url}${health_path}"
    print_gray "   URL: $full_url"
    
    # HTTP 요청 실행
    local response
    local status_code
    
    if response=$(curl -s -w "HTTPSTATUS:%{http_code}" --max-time "$timeout" "$full_url" 2>/dev/null); then
        status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')
        
        if [ "$status_code" = "200" ]; then
            print_success "✅ $service_name: 정상 (HTTP $status_code)"
            
            # JSON 응답인 경우 파싱해서 보여주기
            if echo "$body" | jq . >/dev/null 2>&1; then
                local status=$(echo "$body" | jq -r '.status // "알 수 없음"')
                local version=$(echo "$body" | jq -r '.version // "알 수 없음"')
                local redis_connected=$(echo "$body" | jq -r '.redis_connected // "알 수 없음"')
                
                [ "$status" != "null" ] && [ "$status" != "알 수 없음" ] && print_gray "   상태: $status"
                [ "$version" != "null" ] && [ "$version" != "알 수 없음" ] && print_gray "   버전: $version"
                [ "$redis_connected" != "null" ] && [ "$redis_connected" != "알 수 없음" ] && print_gray "   Redis: $redis_connected"
            else
                print_gray "   응답: $body"
            fi
            
            return 0
        else
            print_warning "⚠️ $service_name: 비정상 응답 (HTTP $status_code)"
            return 1
        fi
    else
        print_error "❌ $service_name: 연결 실패"
        print_gray "   오류: curl 요청 실패"
        return 1
    fi
}

test_docker_services() {
    print_info ""
    print_info "🐳 Docker 컨테이너 상태 확인..."
    
    if command -v docker >/dev/null 2>&1; then
        if docker compose ps 2>/dev/null; then
            true
        else
            print_warning "Docker Compose 상태 확인 실패"
        fi
    else
        print_warning "Docker가 설치되지 않았거나 접근할 수 없습니다"
    fi
}

show_usage() {
    echo "사용법: $0 [옵션]"
    echo ""
    echo "옵션:"
    echo "  -b, --backend URL     백엔드 URL (기본값: http://localhost:8000)"
    echo "  -f, --frontend URL    프론트엔드 URL (기본값: http://localhost:3000)"
    echo "  -t, --timeout SEC     HTTP 타임아웃 초 (기본값: 10)"
    echo "  -h, --help           이 도움말 표시"
    echo ""
    echo "환경 변수:"
    echo "  BACKEND_URL          백엔드 URL"
    echo "  FRONTEND_URL         프론트엔드 URL"
    echo "  TIMEOUT              HTTP 타임아웃"
    echo ""
    echo "예제:"
    echo "  $0"
    echo "  $0 -b http://localhost:8000 -f http://localhost:3000"
    echo "  BACKEND_URL=http://api.example.com $0"
}

# 명령행 인자 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--backend)
            BACKEND_URL="$2"
            shift 2
            ;;
        -f|--frontend)
            FRONTEND_URL="$2"
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo "알 수 없는 옵션: $1"
            show_usage
            exit 1
            ;;
    esac
done

# 메인 실행
clear
print_info "🎰 Casino-Club F2P 헬스체크 도구"
print_info "=================================================="

# 현재 시간 표시
current_time=$(date '+%Y-%m-%d %H:%M:%S')
print_gray "실행 시간: $current_time"
echo ""

# 서비스 헬스체크 실행
backend_healthy=false
frontend_healthy=false

if test_service_health "Backend API" "$BACKEND_URL" "/health" "$TIMEOUT"; then
    backend_healthy=true
fi

if test_service_health "Frontend App" "$FRONTEND_URL" "/healthz" "$TIMEOUT"; then
    frontend_healthy=true
fi

# Docker 컨테이너 상태 확인
test_docker_services

# 결과 요약
echo ""
print_info "📊 헬스체크 결과 요약"
print_info "=============================="

if $backend_healthy && $frontend_healthy; then
    print_success "🎉 모든 서비스가 정상 동작 중입니다!"
elif $backend_healthy || $frontend_healthy; then
    print_warning "⚠️ 일부 서비스에 문제가 있습니다."
else
    print_error "🚨 모든 서비스에 문제가 있습니다."
fi

echo ""
print_info "🔗 서비스 URL:"
print_gray "• 프론트엔드 (웹앱): $FRONTEND_URL"
print_gray "• 백엔드 API: $BACKEND_URL"
print_gray "• API 문서: $BACKEND_URL/docs"
print_gray "• API 정보: $BACKEND_URL/api"

# 문제 해결 가이드
if ! $backend_healthy || ! $frontend_healthy; then
    echo ""
    print_warning "🔧 문제 해결 가이드:"
    
    if ! $backend_healthy; then
        print_gray "• 백엔드 문제:"
        print_gray "  - 컨테이너 로그 확인: docker compose logs backend"
        print_gray "  - 데이터베이스 연결 확인: docker compose logs postgres"
        print_gray "  - 백엔드 재시작: docker compose restart backend"
    fi
    
    if ! $frontend_healthy; then
        print_gray "• 프론트엔드 문제:"
        print_gray "  - 컨테이너 로그 확인: docker compose logs frontend"
        print_gray "  - 프론트엔드 재시작: docker compose restart frontend"
        print_gray "  - 빌드 문제 시: docker compose build frontend"
    fi
fi

echo ""
print_gray "헬스체크 완료."