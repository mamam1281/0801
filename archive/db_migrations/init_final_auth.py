"""
최종 인증 시스템 데이터베이스 초기화
회원가입 필수: 사이트아이디, 닉네임, 전화번호, 초대코드, 비밀번호생성
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, SessionLocal, Base
from app.models.auth_models import User
from app.models.invite_code import InviteCode
from app.services.auth_service import AuthService

def init_final_auth_db():
    """최종 인증 데이터베이스 초기화"""
    print("🚀 최종 인증 시스템 데이터베이스 초기화 시작...")
    
    # 모든 테이블 삭제 후 재생성
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("✅ 데이터베이스 테이블 재생성 완료")
    
    # 세션 생성
    db = SessionLocal()
    
    try:
        # 초대코드 생성 (무제한 사용)
        invite_code = InviteCode(
            code="5858",
            max_uses=999999,
            current_uses=0,
            is_active=True
        )
        db.add(invite_code)
        
        # 관리자 계정 생성
        admin_user = User(
            site_id="admin",
            nickname="관리자",
            phone_number="01000000000",
            hashed_password=AuthService.get_password_hash("admin123"),
            invite_code="5858",
            is_admin=True,
            is_active=True
        )
        db.add(admin_user)
        
        # 테스트 사용자 생성
        test_user = User(
            site_id="testuser",
            nickname="테스터",
            phone_number="01012345678",
            hashed_password=AuthService.get_password_hash("test123"),
            invite_code="5858",
            is_admin=False,
            is_active=True
        )
        db.add(test_user)
        
        db.commit()
        
        print("✅ 초대코드 생성: 5858 (무제한)")
        print("✅ 관리자 계정: admin / admin123 / 관리자 / 01000000000")
        print("✅ 테스트 계정: testuser / test123 / 테스터 / 01012345678")
        print("🎉 최종 인증 시스템 준비 완료!")
        
    except Exception as e:
        print(f"❌ 데이터베이스 초기화 실패: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_final_auth_db()
