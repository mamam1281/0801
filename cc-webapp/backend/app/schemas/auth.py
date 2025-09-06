"""인증 관련 Pydantic 스키마"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class UserSignup(BaseModel):
    """사용자 회원가입 스키마"""
    site_id: str = Field(..., description="사이트 아이디")
    nickname: str = Field(..., description="닉네임")
    phone_number: str = Field(..., description="전화번호")
    password: str = Field(..., description="비밀번호")
    invite_code: str = Field(..., description="초대코드")
    
    model_config = ConfigDict(json_schema_extra={
            "example": {
                "site_id": "testuser123",
                "nickname": "테스트유저",
                "phone_number": "01012345678",
                "invite_code": "5858",
                "password": "1234"
            }
        })


class UserCreate(BaseModel):
    """사용자 생성 스키마 (내부용)"""
    site_id: str = Field(..., description="사이트 아이디")
    nickname: str = Field(..., description="닉네임")
    phone_number: str = Field(..., description="전화번호")
    password: str = Field(..., description="비밀번호")
    invite_code: str = Field(..., description="초대코드")


class UserLogin(BaseModel):
    """사용자 로그인 스키마"""
    site_id: str = Field(..., description="사이트 아이디")
    password: str = Field(..., description="비밀번호")
    
    model_config = ConfigDict(json_schema_extra={
            "example": {
                "site_id": "testuser123",
                "password": "password123"
            }
        })


class AdminLogin(BaseModel):
    """관리자 로그인 스키마"""
    site_id: str = Field(..., description="관리자 사이트 아이디")
    password: str = Field(..., description="관리자 비밀번호")
    
    model_config = ConfigDict(json_schema_extra={
            "example": {
                "site_id": "admin",
                "password": "admin123"
            }
        })


class UserResponse(BaseModel):
    """사용자 응답 스키마"""
    id: int
    site_id: str
    nickname: str
    phone_number: str
    is_active: bool
    is_admin: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    # 단일 통화 시스템 - 골드만 사용
    gold_balance: int = 0
    # VIP 일일 포인트 (별도 적립 시스템)
    vip_points: int = 0
    # Progress / level (추가: 프론트 경험치/레벨 표시 정합성 확보)
    battlepass_level: int = 1
    experience: int = 0  # total_experience (없으면 0)
    max_experience: int = 1000  # UI에서 maxExperience fallback 사용
    
    # 🎯 새로운 게임 통계 필드들
    level: int = 1
    experience_points: int = 0
    total_games_played: int = 0
    total_games_won: int = 0
    total_games_lost: int = 0
    daily_streak: int = 0
    
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """토큰 응답 스키마"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    # 선택: 리프레시 토큰 동봉(초기 로그인/회원가입 시)
    refresh_token: Optional[str] = None


class TokenData(BaseModel):
    """토큰 데이터 스키마"""
    site_id: Optional[str] = None
    user_id: Optional[int] = None
    is_admin: bool = False
