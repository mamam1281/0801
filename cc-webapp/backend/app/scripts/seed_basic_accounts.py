"""기본 관리자/유저 4명 시드 스크립트 (멱등)

사용:
    docker compose exec backend python -m app.scripts.seed_basic_accounts

계정 목록:
  관리자: site_id=admin  nickname=어드민  pw=123456  is_admin=True
  유저:   site_id=user001..user004  nickname=유저01..유저04  pw=123455
조건:
  - 존재하면 비밀번호만 재동기화(옵션) 및 is_admin 보정
  - invite_code 기본 '5858'
  - phone_number 필수 → 패턴 0100000XXXX 사용
"""
from __future__ import annotations

from sqlalchemy import select
from app.database import SessionLocal
from app.models.auth_models import User
from app.services.auth_service import AuthService

ADMIN_SPEC = {
    'site_id': 'admin',
    'nickname': '어드민',
    'password': '123456',
    'is_admin': True,
}

# user002 (유저02) 는 정책상 완전 삭제/비생성 요구 → 기본 시드에서 제외
# 환경변수 INCLUDE_USER02=1 설정 시 임시 복구 가능
import os
EXCLUDED_SITE_IDS = {"user002"}
INCLUDE_USER02 = os.getenv('INCLUDE_USER02', '0') == '1'

USER_SPECS = []
for n in range(1,5):
    sid = f'user{n:03d}'
    if sid in EXCLUDED_SITE_IDS and not INCLUDE_USER02:
        continue
    USER_SPECS.append({'site_id': sid, 'nickname': f'유저{n:02d}', 'password': '123455'})

INVITE_CODE = '5858'


def ensure_user(sess, spec):
    site_id = spec['site_id']
    user = sess.execute(select(User).where(User.site_id == site_id)).scalar_one_or_none()
    raw_pw = spec['password']
    if user is None:
        user = User(
            site_id=site_id,
            nickname=spec['nickname'],
            phone_number=f"0100000{site_id[-3:]}" if site_id.startswith('user') else '01000000000',
            invite_code=INVITE_CODE,
            password_hash=AuthService.get_password_hash(raw_pw),
            is_admin=spec.get('is_admin', False),
        )
        sess.add(user)
        action = 'created'
    else:
        # 비밀번호 재설정 및 admin 플래그 동기화(필요 시)
        updated = False
        if spec.get('is_admin') and not user.is_admin:
            user.is_admin = True
            updated = True
        # 항상 해시 재적용 (원하면 조건부로 변경 가능)
        user.password_hash = AuthService.get_password_hash(raw_pw)
        action = 'updated' if updated else 'refreshed'
    return user, action


def main():
    sess = SessionLocal()
    results = []
    try:
        # 먼저 제외 대상(user002) 존재 시 삭제 또는 익명화
        for sid in EXCLUDED_SITE_IDS:
            u = sess.execute(select(User).where(User.site_id == sid)).scalar_one_or_none()
            if u is not None:
                try:
                    sess.delete(u)
                    sess.flush()
                    results.append({'site_id': sid, 'action': 'deleted'})
                except Exception:
                    # 삭제 실패(외래키 참조 등) 시 최소 익명화 처리
                    u.nickname = f'{sid}_removed'
                    u.password_hash = AuthService.get_password_hash('REMOVED!')
                    u.is_active = False
                    results.append({'site_id': sid, 'action': 'anonymized'})
        u, a = ensure_user(sess, ADMIN_SPEC)
        results.append({'site_id': u.site_id, 'action': a, 'is_admin': u.is_admin})
        for spec in USER_SPECS:
            u, a = ensure_user(sess, spec)
            results.append({'site_id': u.site_id, 'action': a, 'is_admin': u.is_admin})
        sess.commit()
        print(results)
    except Exception as e:  # pragma: no cover
        sess.rollback()
        raise
    finally:
        sess.close()


if __name__ == '__main__':  # pragma: no cover
    main()
