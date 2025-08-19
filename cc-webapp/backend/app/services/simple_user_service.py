"""
사용자 서비스 간소화 버전
"""
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from ..models.auth_models import User

class SimpleUserService:
    """
    간소화된 사용자 서비스
    """
    
    @staticmethod
    def get_user_tokens(db: Session, user_id: int) -> int:
        """사용자 골드(단일 통화) 잔액 조회 (legacy cyber_token_balance -> gold_balance)"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return 0
        return getattr(user, 'gold_balance', 0)
    
    @staticmethod
    def update_user_tokens(db: Session, user_id: int, amount: int) -> int:
        """사용자 골드 잔액 업데이트 (하한 0)"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return 0
        current = getattr(user, 'gold_balance', 0) or 0
        new_balance = current + amount
        if new_balance < 0:
            new_balance = 0
        setattr(user, 'gold_balance', new_balance)
        db.commit()
        return new_balance
    
    @staticmethod
    def get_user_profile(db: Session, user_id: int) -> Dict[str, Any]:
        """사용자 프로필 정보 조회 (gold_balance 표준화)"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {}
        return {
            "id": user.id,
            "site_id": user.site_id,
            "nickname": user.nickname,
            "gold_balance": getattr(user, 'gold_balance', 0),
            "is_active": user.is_active
        }
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """사용자 조회"""
        return db.query(User).filter(User.id == user_id).first()
