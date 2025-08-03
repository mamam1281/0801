#!/usr/bin/env python3
"""
새로운 데이터베이스 생성 스크립트
"""

from sqlalchemy import create_engine
from app.models import Base
from app.database import DATABASE_URL

def create_new_database():
    """새로운 데이터베이스 테이블 생성"""
    engine = create_engine(DATABASE_URL)
    
    # 모든 테이블 삭제
    Base.metadata.drop_all(bind=engine)
    
    # 새로운 테이블 생성 (User 모델의 최신 구조로)
    Base.metadata.create_all(bind=engine)
    
    print("✅ 새로운 데이터베이스가 생성되었습니다!")
    print("✅ User 테이블에 site_id, phone_number 필드가 포함되었습니다!")

if __name__ == "__main__":
    create_new_database()
