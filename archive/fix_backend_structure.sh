#!/bin/bash
# 🛠️ 백엔드 구조 표준화 자동 수정 스크립트

echo "🔧 CC Webapp 백엔드 구조 자동 수정 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 백업 디렉토리 생성
BACKUP_DIR="./backup_$(date +%Y%m%d_%H%M%S)"
echo -e "${BLUE}📦 백업 디렉토리 생성: ${BACKUP_DIR}${NC}"
mkdir -p "$BACKUP_DIR"

# 1. 프로젝트 구조 백업
echo -e "\n${BLUE}💾 현재 상태 백업 중...${NC}"
if [ -d "cc-webapp/backend" ]; then
    cp -r cc-webapp/backend "$BACKUP_DIR/"
    echo -e "${GREEN}✅ cc-webapp/backend 백업 완료${NC}"
fi

if [ -d "app" ]; then
    cp -r app "$BACKUP_DIR/"
    echo -e "${GREEN}✅ app/ 백업 완료${NC}"
fi

cp docker-compose.yml "$BACKUP_DIR/" 2>/dev/null || echo -e "${YELLOW}⚠️ docker-compose.yml 백업 실패${NC}"

# 2. Import 경로 자동 수정
echo -e "\n${BLUE}🔄 Import 경로 수정 중...${NC}"

# backend.app. → app. 변경
find cc-webapp/backend -name "*.py" -type f -exec sed -i.bak 's/from backend\.app\./from app./g' {} + 2>/dev/null
echo -e "${GREEN}✅ 'from backend.app.' → 'from app.' 변경 완료${NC}"

# backend.app import → app import 변경  
find cc-webapp/backend -name "*.py" -type f -exec sed -i.bak 's/import backend\.app\./import app./g' {} + 2>/dev/null
echo -e "${GREEN}✅ 'import backend.app.' → 'import app.' 변경 완료${NC}"

# .bak 파일 정리
find cc-webapp/backend -name "*.py.bak" -delete 2>/dev/null

# 3. Docker Compose 설정 수정
echo -e "\n${BLUE}🐳 Docker Compose 설정 수정 중...${NC}"

# docker-compose.yml 백업
cp docker-compose.yml docker-compose.yml.bak 2>/dev/null

# backend 서비스 build 경로 수정
if grep -q "build: \." docker-compose.yml; then
    sed -i.tmp 's/build: \./build: .\/cc-webapp\/backend/g' docker-compose.yml
    echo -e "${GREEN}✅ Backend build 경로 수정 완료${NC}"
fi

# volume 경로 수정
if grep -q "./app:/app" docker-compose.yml; then
    sed -i.tmp 's|./app:/app|./cc-webapp/backend/app:/app/app|g' docker-compose.yml
    echo -e "${GREEN}✅ Volume 경로 수정 완료${NC}"
fi

# 임시 파일 정리
rm -f docker-compose.yml.tmp

# 4. 환경 변수 설정
echo -e "\n${BLUE}⚙️ 환경 변수 설정 중...${NC}"

# .env 파일에 PYTHONPATH 추가
if [ -f ".env" ]; then
    if ! grep -q "PYTHONPATH" .env; then
        echo "" >> .env
        echo "# Python Path Configuration" >> .env
        echo "PYTHONPATH=/app" >> .env
        echo -e "${GREEN}✅ PYTHONPATH 환경변수 추가${NC}"
    fi
fi

# 5. 불필요한 루트 app/ 디렉토리 처리
echo -e "\n${BLUE}🗑️ 중복 구조 정리 중...${NC}"

if [ -d "app" ] && [ -d "cc-webapp/backend/app" ]; then
    echo -e "${YELLOW}⚠️ 루트 app/ 디렉토리와 cc-webapp/backend/app/ 중복 발견${NC}"
    echo -e "${YELLOW}💡 루트 app/ 디렉토리를 app_legacy/로 이동합니다${NC}"
    mv app app_legacy
    echo -e "${GREEN}✅ 루트 app/ → app_legacy/ 이동 완료${NC}"
fi

# 6. 필수 파일 존재 확인 및 생성
echo -e "\n${BLUE}📄 필수 파일 확인 중...${NC}"

# __init__.py 파일 생성
find cc-webapp/backend -type d -name "app" -o -name "routers" -o -name "utils" -o -name "tests" | while read dir; do
    if [ ! -f "$dir/__init__.py" ]; then
        touch "$dir/__init__.py"
        echo -e "${GREEN}✅ $dir/__init__.py 생성${NC}"
    fi
done

# database.py 파일 확인
if [ ! -f "cc-webapp/backend/app/database.py" ] || [ ! -s "cc-webapp/backend/app/database.py" ]; then
    echo -e "${YELLOW}⚠️ database.py 파일이 비어있거나 없습니다${NC}"
    cat > cc-webapp/backend/app/database.py << 'EOF'
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/cc_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
EOF
    echo -e "${GREEN}✅ database.py 기본 내용 생성${NC}"
fi

# 7. 테스트 파일 import 수정
echo -e "\n${BLUE}🧪 테스트 파일 특별 처리...${NC}"

if [ -d "cc-webapp/backend/tests" ]; then
    # 테스트 파일의 import 경로 수정
    find cc-webapp/backend/tests -name "test_*.py" -exec sed -i.bak 's/from backend\.app\./from app./g' {} + 2>/dev/null
    find cc-webapp/backend/tests -name "*.py.bak" -delete 2>/dev/null
    echo -e "${GREEN}✅ 테스트 파일 import 경로 수정 완료${NC}"
fi

# 8. 검증 실행
echo -e "\n${BLUE}🔍 수정 결과 검증 중...${NC}"

# Import 오류 패턴 검색
REMAINING_ERRORS=$(find cc-webapp/backend -name "*.py" -exec grep -l "from backend\.app\." {} \; 2>/dev/null)
if [ -z "$REMAINING_ERRORS" ]; then
    echo -e "${GREEN}✅ Import 경로 수정 완료 - 오류 패턴 없음${NC}"
else
    echo -e "${RED}❌ 여전히 수정이 필요한 파일들:${NC}"
    echo "$REMAINING_ERRORS"
fi

# Docker Compose 구문 검증
if docker-compose config > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker Compose 설정 구문 검증 통과${NC}"
else
    echo -e "${RED}❌ Docker Compose 설정에 문제가 있습니다${NC}"
fi

# 9. 다음 단계 안내
echo -e "\n${BLUE}🎯 수정 완료 - 다음 단계 안내${NC}"
echo -e "=================================="
echo -e "1. 검증 스크립트 실행:"
echo -e "   ${YELLOW}bash verify_backend_structure.sh${NC}"
echo -e ""
echo -e "2. Docker 빌드 테스트:"
echo -e "   ${YELLOW}cd cc-webapp/backend && docker build -t test .${NC}"
echo -e ""
echo -e "3. 전체 스택 실행:"
echo -e "   ${YELLOW}docker-compose up backend${NC}"
echo -e ""
echo -e "4. 헬스체크 확인:"
echo -e "   ${YELLOW}curl http://localhost:8000/health${NC}"
echo -e ""
echo -e "5. 테스트 실행:"
echo -e "   ${YELLOW}docker-compose run --rm backend pytest tests/${NC}"

echo -e "\n${GREEN}🎉 자동 수정 스크립트 완료!${NC}"
echo -e "${BLUE}📦 백업 위치: ${BACKUP_DIR}${NC}"
echo -e "${YELLOW}💡 문제 발생 시 백업에서 복원 가능합니다${NC}"
