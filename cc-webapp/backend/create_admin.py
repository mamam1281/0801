"""
관리자 계정 생성 스크립트
"""
import asyncio
import os
import sys
from datetime import datetime

# app 패키지 경로 추가 (이 스크립트 위치 기준)
APP_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app')
if APP_PATH not in sys.path:
    sys.path.insert(0, APP_PATH)

from app.database import SessionLocal  # type: ignore
from app.services.auth_service import AuthService  # type: ignore
from app.models.auth_models import User  # type: ignore

async def create_admin_user():
    """관리자 사용자 생성"""
    db = SessionLocal()
    try:
        # 기존 관리자 계정 확인
        admin_user = db.query(User).filter(User.site_id == 'admin').first()
        
        if admin_user:
            # 기존 계정 업데이트
            setattr(admin_user, 'password_hash', AuthService.get_password_hash('admin123!'))
            setattr(admin_user, 'user_rank', 'ADMIN')
            setattr(admin_user, 'is_active', True)
            db.commit()
            print('✅ 기존 관리자 계정이 업데이트되었습니다.')
        else:
            # 새 관리자 계정 생성
            admin_user = User(
                site_id='admin',
                nickname='관리자',
                phone_number='01000000000',
                password_hash=AuthService.get_password_hash('admin123!'),
                invite_code='5858',
                user_rank='ADMIN',
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print('✅ 새 관리자 계정이 생성되었습니다.')
        
        print(f'� 사이트 ID: admin')
        print(f'🔑 비밀번호: admin123!')
        print(f'👑 VIP 등급: {admin_user.user_rank}')
        print(f'🆔 사용자 ID: {admin_user.id}')
        
        return admin_user
        
    except Exception as e:
        print(f'❌ 오류 발생: {str(e)}')
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(create_admin_user())
