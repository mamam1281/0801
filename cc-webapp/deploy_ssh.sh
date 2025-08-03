#!/bin/bash

echo "🚀 Casino-Club F2P SSH 서버 배포 스크립트"
echo "========================================"

# 환경 변수 로드
if [ -f .env.dev ]; then
    export $(cat .env.dev | grep -v '#' | awk '/=/ {print $1}')
    echo "✅ 환경변수 로드 완료"
else
    echo "❌ .env.dev 파일이 없습니다."
    exit 1
fi

# 기존 컨테이너 정리
echo "🧹 기존 컨테이너 정리 중..."
docker-compose -f docker-compose.dev.yml down

# 이미지 빌드 및 컨테이너 시작
echo "🔨 Docker 이미지 빌드 및 컨테이너 시작 중..."
docker-compose -f docker-compose.dev.yml up -d --build

# 컨테이너 상태 확인
echo "📊 컨테이너 상태 확인 중..."
sleep 10
docker-compose -f docker-compose.dev.yml ps

# 로그 확인
echo "📝 서비스 로그 확인..."
echo "백엔드 로그:"
docker-compose -f docker-compose.dev.yml logs backend --tail=10

echo ""
echo "프론트엔드 로그:"
docker-compose -f docker-compose.dev.yml logs frontend --tail=10

echo ""
echo "🎉 배포 완료!"
echo "🌐 접근 주소:"
echo "  - 백엔드 API: http://your-server-ip:${BACKEND_PORT:-8000}"
echo "  - API 문서: http://your-server-ip:${BACKEND_PORT:-8000}/docs"
echo "  - 프론트엔드: http://your-server-ip:${FRONTEND_PORT:-3000}"
echo "  - 관리자 도구: http://your-server-ip:${ADMINER_PORT:-8080}"
echo ""
echo "🛑 서버 중지: docker-compose -f docker-compose.dev.yml down"
