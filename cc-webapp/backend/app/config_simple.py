"""단순화된 설정 모듈"""
import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    """애플리케이션 설정"""
    # JWT 관련 설정
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "super-secret-key-for-development-only")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_access_token_expire_minutes: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 30))

    # 서버 관련 설정
    api_version: str = "0.1.0"
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"

    # 기타 설정
    default_admin_username: str = os.getenv("DEFAULT_ADMIN_USERNAME", "admin")
    default_admin_password: str = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin")

settings = Settings()
