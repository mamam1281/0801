"""
데이터베이스 테이블을 생성하고 초기 데이터를 설정하는 스크립트
- 간소화된 인증 모델 사용
- 기본 초대 코드 생성
"""

import os
import sys
from pathlib import Path

# 프로젝트 루트 경로를 Python 경로에 추가
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from sqlalchemy import create_engine, text
from app.database import get_db_url, get_db
from app.models.auth_models import Base, User, InviteCode, LoginAttempt, RefreshToken, UserSession, SecurityEvent
from app.auth.auth_service import auth_service

def initialize_database():
    """데이터베이스 초기화"""
    print("🚀 데이터베이스 초기화 시작...")
    
    # 데이터베이스 엔진 생성
    db_url = get_db_url()
    engine = create_engine(db_url)
    
    print(f"📊 데이터베이스 URL: {db_url}")
    
    # 모든 테이블 생성
    print("📝 테이블 생성 중...")
    Base.metadata.create_all(bind=engine)
    print("✅ 테이블 생성 완료")
    
    # 데이터베이스 세션 생성
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # 기본 초대 코드 생성
        print("🎫 기본 초대 코드 생성 중...")
        
        default_codes = ["WELCOME1", "INVITE01", "START123", "CASINO1", "CLUB001"]
        
        for code in default_codes:
            existing = db.query(InviteCode).filter(InviteCode.code == code).first()
            if not existing:
                invite = InviteCode(code=code, is_used=False)
                db.add(invite)
                print(f"  ✅ 초대 코드 생성: {code}")
            else:
                print(f"  ⚠️ 초대 코드 이미 존재: {code}")
        
        # 테스트 관리자 계정 생성
        print("👤 테스트 관리자 계정 생성 중...")
        
        admin_site_id = "admin"
        existing_admin = db.query(User).filter(User.site_id == admin_site_id).first()
        
        if not existing_admin:
            admin_password = "admin123"
            password_hash = auth_service.hash_password(admin_password)
            
            admin_user = User(
                site_id=admin_site_id,
                nickname="관리자",
                phone_number="010-0000-0000",
                password_hash=password_hash,
                invite_code="WELCOME1",
                cyber_token_balance=10000,
                rank="admin"
            )
            
            db.add(admin_user)
            print(f"  ✅ 관리자 계정 생성: {admin_site_id} / {admin_password}")
        else:
            print(f"  ⚠️ 관리자 계정 이미 존재: {admin_site_id}")
        
        # 테스트 사용자 계정 생성
        print("🧪 테스트 사용자 계정 생성 중...")
        
        test_users = [
            ("testuser1", "테스트유저1", "010-1111-1111", "test123"),
            ("testuser2", "테스트유저2", "010-2222-2222", "test123"),
            ("demo", "데모유저", "010-9999-9999", "demo123")
        ]
        
        for site_id, nickname, phone, password in test_users:
            existing = db.query(User).filter(User.site_id == site_id).first()
            if not existing:
                password_hash = auth_service.hash_password(password)
                user = User(
                    site_id=site_id,
                    nickname=nickname,
                    phone_number=phone,
                    password_hash=password_hash,
                    invite_code="INVITE01",
                    cyber_token_balance=500
                )
                db.add(user)
                print(f"  ✅ 테스트 계정 생성: {site_id} / {password}")
            else:
                print(f"  ⚠️ 테스트 계정 이미 존재: {site_id}")
        
        # 변경사항 저장
        db.commit()
        print("💾 변경사항 저장 완료")
        
        # 생성된 테이블 확인
        print("\n📋 생성된 테이블 확인...")
        with engine.connect() as conn:
            if "sqlite" in db_url:
                result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
            else:  # PostgreSQL
                result = conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public'"))
            
            tables = [row[0] for row in result]
            for table in sorted(tables):
                print(f"  📊 {table}")
        
        # 생성된 데이터 확인
        print("\n🔍 생성된 데이터 확인...")
        
        invite_count = db.query(InviteCode).count()
        user_count = db.query(User).count()
        
        print(f"  🎫 초대 코드: {invite_count}개")
        print(f"  👤 사용자: {user_count}명")
        
        print("\n🎉 데이터베이스 초기화 완료!")
        
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    initialize_database()
