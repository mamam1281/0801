#!/bin/bash
set -e # 오류 발생 시 즉시 중단

echo "====== Casino-Club F2P (Docker-less) Jules 환경 설정 시작 ======"

# --- 0. 사전 체크 ---
echo "### 0. 사전 환경 체크 ###"

# 필수 명령어 존재 확인
command -v python3 >/dev/null 2>&1 || { echo "❌ python3가 설치되지 않음"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ node가 설치되지 않음"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm이 설치되지 않음"; exit 1; }

# 프로젝트 디렉토리 확인
if [ ! -d "cc-webapp" ]; then
    echo "❌ cc-webapp 디렉토리가 없습니다. 올바른 프로젝트 디렉토리에서 실행해주세요."
    exit 1
fi

# --- 1. 시스템 환경 확인 ---
echo "### 1. 시스템 환경 확인 ###"
echo "Python: $(python3 --version)"
echo "Node: $(node --version)"
echo "NPM: $(npm --version)"
echo "현재 디렉토리: $(pwd)"

# --- 2. 백엔드(FastAPI) 설정 ---
echo "### 2. 백엔드(FastAPI) 설정 ###"
cd cc-webapp/backend

# 기존 가상환경 정리 (Jules에서 깔끔한 시작을 위해)
if [ -d "venv" ]; then
    echo "기존 가상환경을 제거합니다..."
    rm -rf venv
fi

# 가상환경 생성 및 활성화
echo "새 가상환경을 생성합니다..."
python3 -m venv venv
source venv/bin/activate

# Python 의존성 설치
echo "백엔드 의존성을 설치합니다..."
pip install --upgrade pip

# requirements.txt 파일 확인
if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt 파일이 없습니다."
    exit 1
fi

pip install -r requirements.txt

# .env 파일 생성 (SQLite 사용)
echo "백엔드 .env 파일을 생성합니다..."
cat > .env << 'EOL'
# 로컬 개발 환경을 위한 데이터베이스 설정 (SQLite)
DATABASE_URL=sqlite:///./local_dev.db

# JWT 및 API 키 설정
JWT_SECRET_KEY=a_very_secret_key_for_jules_dev_$(date +%s)
ACCESS_TOKEN_EXPIRE_MINUTES=60
API_SECRET_KEY=another_secret_key_for_jules_$(date +%s)

# 개발 환경 설정
ENVIRONMENT=development
LOG_LEVEL=DEBUG
DEBUG=true

# SQLite를 명시적으로 사용
POSTGRES_SERVER=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
DB_HOST=
EOL

# --- 3. 데이터베이스 마이그레이션 (강화된 다중 헤드 자동 해결) ---
echo "### 3. 데이터베이스 마이그레이션 ###"

# 3.1. Alembic 환경 확인
if [ ! -d "alembic" ]; then
    echo "⚠️ Alembic 디렉토리가 없습니다. 초기화를 진행합니다..."
    alembic init alembic
fi

# 3.2. Alembic 다중 헤드 확인 및 자동 병합 (개선된 로직)
echo "Alembic 헤드 상태를 확인합니다..."

# 현재 헤드들을 확인
HEADS_OUTPUT=$(alembic heads --verbose 2>/dev/null || echo "no_heads")
echo "Alembic heads 출력: $HEADS_OUTPUT"

if echo "$HEADS_OUTPUT" | grep -q "no_heads\|command not found"; then
    echo "ℹ️ 헤드가 없거나 Alembic이 초기화되지 않았습니다. 새 마이그레이션을 생성합니다."
    
    # 모델이 있는지 확인하고 마이그레이션 생성
    if alembic revision --autogenerate -m "Initial migration for Jules setup"; then
        echo "✅ 초기 마이그레이션 파일 생성 완료"
    else
        echo "⚠️ 자동 마이그레이션 생성 실패. 빈 마이그레이션을 생성합니다."
        alembic revision -m "Empty initial migration"
    fi
else
    # 다중 헤드 처리
    HEAD_COUNT=$(echo "$HEADS_OUTPUT" | grep -c "^[a-f0-9]" || echo "0")
    
    if [ "$HEAD_COUNT" -gt 1 ]; then
        echo "⚠️ $HEAD_COUNT 개의 다중 헤드가 발견되었습니다. 자동 병합을 시도합니다."
        
        # 헤드 리비전들 추출
        HEAD_REVISIONS=$(echo "$HEADS_OUTPUT" | grep "^[a-f0-9]" | awk '{print $1}' | tr '\n' ' ')
        echo "발견된 헤드: $HEAD_REVISIONS"
        
        # 병합 명령어 실행
        if alembic merge -m "Auto-merge divergent branches for Jules setup" $HEAD_REVISIONS; then
            echo "✅ 성공적으로 병합 마이그레이션 파일을 생성했습니다."
        else
            echo "❌ 병합 마이그레이션 파일 생성에 실패했습니다."
            echo "수동으로 마이그레이션 파일들을 정리하고 다시 시도해주세요."
            exit 1
        fi
    fi
fi

# 3.3. 데이터베이스 업그레이드
echo "데이터베이스를 최신 버전으로 업그레이드합니다..."
if alembic upgrade head; then
    echo "✅ 데이터베이스 업그레이드 성공!"
    
    # 현재 상태 확인
    echo "현재 데이터베이스 상태:"
    alembic current || echo "상태 확인 실패"
else
    echo "❌ 데이터베이스 업그레이드 실패."
    echo "Alembic 로그를 확인해주세요."
    alembic current || echo "현재 상태 확인 불가"
    exit 1
fi

# 백엔드 가상환경 비활성화 (프론트엔드 설정을 위해)
deactivate

# 프로젝트 루트로 이동
cd ../..

# --- 4. 프론트엔드(Next.js) 설정 ---
echo "### 4. 프론트엔드(Next.js) 설정 ###"
cd cc-webapp/frontend

# package.json 확인
if [ ! -f "package.json" ]; then
    echo "❌ package.json 파일이 없습니다."
    exit 1
fi

# 기존 node_modules 정리 (Jules에서 깔끔한 시작)
if [ -d "node_modules" ]; then
    echo "기존 node_modules를 정리합니다..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    echo "기존 package-lock.json을 정리합니다..."
    rm -f package-lock.json
fi

# Node.js 의존성 설치
echo "프론트엔드 의존성을 설치합니다..."
npm install

# .env.local 파일 생성
echo "프론트엔드 .env.local 파일을 생성합니다..."
cat > .env.local << 'EOL'
# 백엔드 API 서버 주소
NEXT_PUBLIC_API_URL=http://localhost:8000

# 개발 환경 설정
NODE_ENV=development
EOL

# 프로젝트 루트로 이동
cd ../..

# --- 5. 서비스 시작 스크립트 생성 ---
echo "### 5. 서비스 시작 스크립트 생성 ###"

# 백엔드 시작 스크립트
cat > start-backend.sh << 'EOL'
#!/bin/bash
echo "=== 백엔드 서버 시작 ==="
cd cc-webapp/backend
source venv/bin/activate
echo "FastAPI 서버를 포트 8000에서 시작합니다..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
EOL

# 프론트엔드 시작 스크립트
cat > start-frontend.sh << 'EOL'
#!/bin/bash
echo "=== 프론트엔드 서버 시작 ==="
cd cc-webapp/frontend
echo "Next.js 서버를 포트 3000에서 시작합니다..."
npm run dev
EOL

# 전체 서비스 시작 스크립트 (백그라운드)
cat > start-all.sh << 'EOL'
#!/bin/bash
echo "=== 전체 서비스 시작 ==="

# 백엔드 백그라운드 시작
echo "백엔드 서버를 백그라운드에서 시작합니다..."
cd cc-webapp/backend
source venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > ../../backend.log 2>&1 &
BACKEND_PID=$!
echo "백엔드 PID: $BACKEND_PID"
cd ../..

# 잠시 대기 (백엔드 시작 대기)
sleep 3

# 프론트엔드 백그라운드 시작
echo "프론트엔드 서버를 백그라운드에서 시작합니다..."
cd cc-webapp/frontend
nohup npm run dev > ../../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "프론트엔드 PID: $FRONTEND_PID"
cd ../..

echo "======"
echo "✅ 모든 서비스가 시작되었습니다!"
echo "백엔드: http://localhost:8000 (PID: $BACKEND_PID)"
echo "프론트엔드: http://localhost:3000 (PID: $FRONTEND_PID)"
echo "API 문서: http://localhost:8000/docs"
echo ""
echo "로그 확인:"
echo "- 백엔드 로그: tail -f backend.log"
echo "- 프론트엔드 로그: tail -f frontend.log"
echo ""
echo "서비스 중지: kill $BACKEND_PID $FRONTEND_PID"
echo "======"
EOL

# 스크립트들에 실행 권한 부여
chmod +x start-backend.sh start-frontend.sh start-all.sh

# --- 6. 환경 검증 ---
echo "### 6. 환경 검증 ###"

# 백엔드 환경 검증
echo "백엔드 환경을 검증합니다..."
cd cc-webapp/backend
source venv/bin/activate

# Python 패키지 확인
if python -c "import fastapi, sqlalchemy, alembic, uvicorn; print('✅ 필수 패키지 확인 완료')"; then
    echo "✅ 백엔드 Python 환경 정상"
else
    echo "❌ 백엔드 Python 환경 문제 발견"
    exit 1
fi

# 데이터베이스 연결 테스트
if python -c "
from app.database import engine
try:
    with engine.connect():
        print('✅ 데이터베이스 연결 성공')
except Exception as e:
    print(f'❌ 데이터베이스 연결 실패: {e}')
    exit(1)
"; then
    echo "✅ 데이터베이스 연결 정상"
else
    echo "❌ 데이터베이스 연결 문제"
    exit 1
fi

deactivate
cd ../..

# 프론트엔드 환경 검증
echo "프론트엔드 환경을 검증합니다..."
cd cc-webapp/frontend

if npm list next react >/dev/null 2>&1; then
    echo "✅ 프론트엔드 Node.js 환경 정상"
else
    echo "❌ 프론트엔드 Node.js 환경 문제 발견"
    exit 1
fi

cd ../..

echo "====== ✅ Jules 환경 설정 완료 ======"
echo ""
echo "🚀 다음 명령어로 서비스를 시작할 수 있습니다:"
echo ""
echo "1. 개발용 (터미널에서 직접 실행):"
echo "   ./start-backend.sh    # 백엔드만"
echo "   ./start-frontend.sh   # 프론트엔드만"
echo ""
echo "2. 프로덕션용 (백그라운드 실행):"
echo "   ./start-all.sh        # 전체 서비스"
echo ""
echo "3. 수동 실행:"
echo "   cd cc-webapp/backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "   cd cc-webapp/frontend && npm run dev"
echo ""
echo "📋 유용한 정보:"
echo "- 백엔드 API: http://localhost:8000"
echo "- 프론트엔드: http://localhost:3000"
echo "- API 문서: http://localhost:8000/docs"
echo "- 데이터베이스: SQLite (local_dev.db)"
echo ""
echo "🔧 이제 A.md 문서의 작업을 수행할 준비가 완료되었습니다!"
