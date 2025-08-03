"SQLAlchemy engine and session configuration."
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Base class for all models
Base = declarative_base()

def get_database_url():
    """Return database URL based on environment"""
    # Docker/Production environment - PostgreSQL
    if os.getenv('DB_HOST'):
        db_host = os.getenv('DB_HOST', 'localhost')
        db_port = os.getenv('DB_PORT', '5432')
        db_name = os.getenv('DB_NAME', 'cc_webapp')
        db_user = os.getenv('DB_USER', 'cc_user')
        db_password = os.getenv('DB_PASSWORD', 'cc_password')
        return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    
    # 개발 환경 fallback - SQLite
    return os.getenv("DATABASE_URL", "sqlite:///./auth.db")

# 데이터베이스 URL 설정
DATABASE_URL = get_database_url()

# PostgreSQL vs SQLite 연결 옵션
if DATABASE_URL.startswith("postgresql"):
    connect_args = {}
    echo = os.getenv('DEBUG', 'false').lower() == 'true'
else:
    connect_args = {"check_same_thread": False}
    echo = False

try:
    engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=echo)
    # 연결 테스트
    with engine.connect():
        pass
    print(f"✅ 데이터베이스 연결 성공: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
except Exception as e:
    print(f"⚠️ 주 데이터베이스 연결 실패: {e}")
    # Fallback to local SQLite
    fallback_url = "sqlite:///./fallback.db"
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False})
    print(f"🔄 Fallback 데이터베이스 사용: {fallback_url}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db_url():
    """현재 데이터베이스 URL 반환"""
    return DATABASE_URL

def get_db():
    """Database session dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()