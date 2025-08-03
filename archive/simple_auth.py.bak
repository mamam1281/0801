"""
단순 초대코드 기반 인증 시스템
- 복잡한 JWT, 비밀번호, 이메일 인증 제거
- 초대코드로 즉시 가입 → 모든 서비스 접근 가능
- 랭크 시스템으로 서비스 레벨 제어 (VIP, PREMIUM, STANDARD)
"""

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import Optional
from app.models import User, InviteCode
from app.database import get_db
import random
import string
import time

# HTTP Bearer security scheme (optional, for future token-based auth)
security = HTTPBearer(auto_error=False)

class SimpleAuth:
    @staticmethod
    def generate_invite_code() -> str:
        """6자리 초대코드 생성"""
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        
    @staticmethod
    def register_with_invite_code(invite_code: str, nickname: str, db) -> User:
        """초대코드로 즉시 가입 - 모든 서비스 접근 가능"""
        # 초대코드 유효성 검사
        invite = db.query(InviteCode).filter(
            InviteCode.code == invite_code,
            InviteCode.is_used == False
        ).first()
        
        if not invite:
            raise HTTPException(status_code=400, detail="잘못된 초대코드입니다")
        
        # 닉네임 중복 검사
        existing_user = db.query(User).filter(User.nickname == nickname).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="이미 사용중인 닉네임입니다")
        
        # 사용자 생성 - 즉시 모든 서비스 접근 가능
        user_timestamp = int(time.time())
        user = User(
            site_id=f"casino_user_{user_timestamp}",  # 고유한 site_id 생성
            nickname=nickname,
            phone_number=f"000-{user_timestamp % 10000:04d}-{user_timestamp % 10000:04d}",  # 고유한 기본 전화번호
            password_hash="no_password_required",  # 초대코드 기반이므로 비밀번호 불필요
            invite_code=invite_code,
            rank="STANDARD",  # 기본 랭크
            cyber_token_balance=200
        )
        
        # 초대코드 사용 처리
        invite.is_used = True
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return user
        
    @staticmethod
    def check_rank_access(user_rank: str, required_rank: str) -> bool:
        """랭크 기반 접근 제어"""
        rank_hierarchy = {
            "VIP": 3,
            "PREMIUM": 2, 
            "STANDARD": 1
        }
        
        user_level = rank_hierarchy.get(user_rank, 1)
        required_level = rank_hierarchy.get(required_rank, 1)
        
        return user_level >= required_level
    
    @staticmethod
    def check_combined_access(user_rank: str, user_segment_level: int, 
                            required_rank: str, required_segment_level: int) -> bool:
        """랭크 + RFM 세그먼트 조합 접근 제어"""
        rank_ok = SimpleAuth.check_rank_access(user_rank, required_rank)
        segment_ok = user_segment_level >= required_segment_level
        
        return rank_ok and segment_ok

# FastAPI dependencies for authentication
def get_current_user(
    db: Session = Depends(get_db)
) -> Optional[int]:
    """
    테스트용 간단한 사용자 인증
    실제로는 토큰 기반 인증을 구현해야 함
    """
    # 테스트를 위해 기본 사용자 ID 1 반환
    return 1

def require_user(current_user_id: Optional[int] = Depends(get_current_user)) -> int:
    """인증된 사용자가 필요한 엔드포인트용 의존성"""
    if not current_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증이 필요합니다"
        )
    return current_user_id

# 테스트를 위한 간단한 사용자 ID 반환 함수
def get_current_user_id(
    current_user_id: Optional[int] = Depends(get_current_user)
) -> Optional[int]:
    """현재 사용자 ID 반환 (테스트용)"""
    return current_user_id
