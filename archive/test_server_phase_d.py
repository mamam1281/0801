"""
Phase D 테스트용 간단한 FastAPI 서버
"""
import sys
sys.path.insert(0, '.')

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import uvicorn

# 모델과 데이터베이스 임포트
from app.models import User, InviteCode, Base
from app.database import SessionLocal, engine

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)
print("✅ 데이터베이스 테이블 생성 완료")

# bcrypt 컨텍스트
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# FastAPI 앱 생성
app = FastAPI(title="Phase D Test Server", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 의존성
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 헬스 체크 엔드포인트
@app.get("/health")
async def health_check():
    """서버 상태 확인"""
    return {"status": "healthy", "message": "Phase D 테스트 서버가 정상 작동 중입니다"}

# 요청 모델
class SignUpRequest(BaseModel):
    site_id: str
    nickname: str
    phone_number: str
    password: str
    invite_code: str

class LoginRequest(BaseModel):
    site_id: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    message: str

# 회원가입 엔드포인트
@app.post("/api/auth/signup", response_model=TokenResponse)
async def signup(data: SignUpRequest, db: Session = Depends(get_db)):
    """새로운 회원가입 API"""
    try:
        print(f"📝 회원가입 요청: {data.site_id}, {data.nickname}, {data.phone_number}")
        
        # 1. 사이트ID 중복 검사
        if db.query(User).filter(User.site_id == data.site_id).first():
            raise HTTPException(status_code=400, detail="사이트ID가 이미 사용 중입니다")
        
        # 2. 닉네임 중복 검사
        if db.query(User).filter(User.nickname == data.nickname).first():
            raise HTTPException(status_code=400, detail="닉네임이 이미 사용 중입니다")
        
        # 3. 전화번호 중복 검사
        if db.query(User).filter(User.phone_number == data.phone_number).first():
            raise HTTPException(status_code=400, detail="전화번호가 이미 사용 중입니다")
        
        # 4. 초대코드 검증
        invite = db.query(InviteCode).filter(
            InviteCode.code == data.invite_code,
            InviteCode.is_used == False
        ).first()
        if not invite:
            raise HTTPException(status_code=400, detail="유효하지 않은 초대코드입니다")
        
        # 5. 비밀번호 해싱
        password_hash = pwd_context.hash(data.password)
        
        # 6. 사용자 생성
        user = User(
            site_id=data.site_id,
            nickname=data.nickname,
            phone_number=data.phone_number,
            password_hash=password_hash,
            invite_code=data.invite_code
        )
        db.add(user)
        invite.is_used = True
        db.commit()
        db.refresh(user)
        
        print(f"✅ 회원가입 성공: ID={user.id}, 사이트ID={user.site_id}")
        
        return TokenResponse(
            access_token="fake-jwt-token-for-testing", 
            message=f"회원가입 성공! 사용자 ID: {user.id}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 회원가입 오류: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

# 로그인 엔드포인트
@app.post("/api/auth/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    """새로운 로그인 API"""
    try:
        print(f"🔐 로그인 요청: {data.site_id}")
        
        # 1. 사이트ID로 사용자 찾기
        user = db.query(User).filter(User.site_id == data.site_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="사이트ID 또는 비밀번호가 틀렸습니다")
        
        # 2. 비밀번호 검증
        if not user.password_hash or not pwd_context.verify(data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="사이트ID 또는 비밀번호가 틀렸습니다")
        
        print(f"✅ 로그인 성공: {user.nickname} (ID: {user.id})")
        
        return TokenResponse(
            access_token="fake-jwt-token-for-testing",
            message=f"로그인 성공! {user.nickname}님 환영합니다"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 로그인 오류: {e}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")

# 초대코드 생성 엔드포인트 (테스트용)
@app.post("/api/admin/invite-codes")
async def create_invite_code(count: int = 1, db: Session = Depends(get_db)):
    """테스트용 초대코드 생성"""
    import random
    import string
    
    codes = []
    for _ in range(count):
        code = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        invite = InviteCode(code=code)
        db.add(invite)
        codes.append(code)
    
    db.commit()
    print(f"✅ 초대코드 생성: {codes}")
    return {"codes": codes}

# 헬스체크 엔드포인트
@app.get("/")
async def health_check():
    return {"message": "Phase D Test Server is running!", "status": "healthy"}

@app.get("/api/health")
async def api_health_check():
    return {"message": "API is working!", "endpoints": ["/api/auth/signup", "/api/auth/login"]}

if __name__ == "__main__":
    print("🚀 Phase D 테스트 서버 시작")
    print("📡 API 엔드포인트:")
    print("   - POST /api/auth/signup (회원가입)")
    print("   - POST /api/auth/login (로그인)")
    print("   - POST /api/admin/invite-codes (초대코드 생성)")
    print("🌐 서버 주소: http://127.0.0.1:8002")
    
    uvicorn.run(app, host="127.0.0.1", port=8002, reload=False)
