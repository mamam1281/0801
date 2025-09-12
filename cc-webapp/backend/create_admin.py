"""
관리자 계정 생성 스크립트
"""
import asyncio
import sys
import os

# 현재 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.models import User
from app.core.auth import get_password_hash
from app.core.database import SessionLocal
from datetime import datetime

async def create_admin_user():
    """관리자 사용자 생성"""
    db = SessionLocal()
    try:
        # 기존 관리자 계정 확인
        admin_user = db.query(User).filter(User.email == 'admin@casino-club.com').first()
        
        if admin_user:
            # 기존 계정 업데이트
            admin_user.password_hash = get_password_hash('admin123!')
            admin_user.vip_tier = 'ADMIN'
            admin_user.is_active = True
            db.commit()
            print('✅ 기존 관리자 계정이 업데이트되었습니다.')
        else:
            # 새 관리자 계정 생성
            admin_user = User(
                email='admin@casino-club.com',
                nickname='관리자',
                password_hash=get_password_hash('admin123!'),
                vip_tier='ADMIN',
                total_spent=0,
                battlepass_level=1,
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print('✅ 새 관리자 계정이 생성되었습니다.')
        
        print(f'📧 이메일: admin@casino-club.com')
        print(f'🔑 비밀번호: admin123!')
        print(f'👑 VIP 등급: {admin_user.vip_tier}')
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
