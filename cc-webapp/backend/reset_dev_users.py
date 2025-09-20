"""
개발환경 전용: 사용자/연관 데이터 초기화 후, 관리자 2명 + 테스터 5명 시드.

요구사항
- 관리자 2명: 골드 1,000,000
- 테스터 5명 중 2명: 골드 1,000,000
- 나머지 3명: 골드 1,000
- 비밀번호: 관리자는 123456, 테스터는 123455 (DEV_* 환경변수로 오버라이드 가능)

주의: users TRUNCATE CASCADE 수행 → 모든 사용자 관련 데이터가 삭제됩니다.
"""
import os
import sys
from datetime import datetime
from sqlalchemy import text

APP_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app')
if APP_PATH not in sys.path:
    sys.path.insert(0, APP_PATH)

from app.database import SessionLocal  # type: ignore
from app.services.auth_service import AuthService  # type: ignore
from app.models.auth_models import User  # type: ignore


# 비밀번호 정책: 관리자=123456, 테스터=123455 (환경변수로 오버라이드 가능)
ADMIN_PASSWORD = os.getenv("DEV_ADMIN_PASSWORD", "123456")
TESTER_PASSWORD = os.getenv("DEV_TESTER_PASSWORD", "123455")


def _default_phone(site_id: str) -> str:
    # 한국형 11자리 기본 패턴, site_id 해시 일부로 유니크 보장 시도
    base = ''.join([c for c in site_id if c.isdigit()])
    suffix = (base + '0000000000')[:8]
    return '010' + suffix


def upsert_user(db, *, site_id: str, nickname: str, is_admin: bool, gold: int):
    user = db.query(User).filter(User.site_id == site_id).first()
    now = datetime.utcnow()
    pwd = ADMIN_PASSWORD if is_admin else TESTER_PASSWORD
    password_hash = AuthService.get_password_hash(pwd)
    phone = _default_phone(site_id)
    if user:
        setattr(user, 'nickname', nickname)
        setattr(user, 'is_admin', is_admin)
        setattr(user, 'is_active', True)
        setattr(user, 'gold_balance', gold)
        setattr(user, 'password_hash', password_hash)
        setattr(user, 'invite_code', '5858')
        setattr(user, 'phone_number', getattr(user, 'phone_number', None) or phone)
        setattr(user, 'updated_at', now)
    else:
        user = User(
            site_id=site_id,
            nickname=nickname,
            phone_number=phone,
            password_hash=password_hash,
            invite_code='5858',
            is_admin=is_admin,
            is_active=True,
            gold_balance=gold,
            created_at=now,
            updated_at=now,
        )
        db.add(user)
    db.flush()
    return user


def main():
    db = SessionLocal()
    try:
        # 1) 모든 사용자/연관 데이터 초기화
        db.execute(text("TRUNCATE TABLE users CASCADE"))
        db.commit()

        # 2) 시드 생성: 관리자 2명, 테스터 5명
        created = []
        created.append(upsert_user(db, site_id='admin', nickname='관리자', is_admin=True, gold=1_000_000))
        created.append(upsert_user(db, site_id='admin2', nickname='관리자2', is_admin=True, gold=1_000_000))

        # 테스터 5명: user001~user005
        created.append(upsert_user(db, site_id='user001', nickname='유저01', is_admin=False, gold=1_000_000))
        created.append(upsert_user(db, site_id='user002', nickname='유저02', is_admin=False, gold=1_000_000))
        created.append(upsert_user(db, site_id='user003', nickname='유저03', is_admin=False, gold=1_000))
        created.append(upsert_user(db, site_id='user004', nickname='유저04', is_admin=False, gold=1_000))
        created.append(upsert_user(db, site_id='user005', nickname='유저05', is_admin=False, gold=1_000))

        db.commit()

        print("✅ 초기화 및 시드 완료")
        for u in created:
            print(f" - {u.site_id} ({u.nickname}) | admin={u.is_admin} | gold={getattr(u, 'gold_balance', None)}")
        print(f"비밀번호 안내: admin 계정={ADMIN_PASSWORD} / tester 계정={TESTER_PASSWORD}")
    except Exception as e:
        db.rollback()
        print(f"❌ 오류: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
