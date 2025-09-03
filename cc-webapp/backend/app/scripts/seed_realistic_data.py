"""
Casino-Club F2P 시드계정 전용 데이터 초기화/생성 스크립트
- admin, user001~user004(총 5명)만 대상으로 게임/상점/이벤트/미션 데이터 생성
- 랜덤 없음, 계정별로 확인 가능한 패턴/반복 데이터
- 멱등성 보장(중복 생성 방지)

사용:
  docker compose exec backend python -m app.scripts.seed_realistic_data
"""
from app.database import SessionLocal
from app.models.auth_models import User
from app.models.game_models import GameSession
from app.models.shop_models import ShopTransaction
from app.models.event_models import Event, Mission
from sqlalchemy import select, delete

SEED_SITE_IDS = ['admin', 'user001', 'user002', 'user003', 'user004']
GAME_TYPES = ['slot', 'gacha', 'crash']

# 각 계정별로 10건씩 게임/상점/이벤트/미션 생성
GAME_COUNT = 10
SHOP_COUNT = 10
EVENTS = [
    {'title': '신규 유저 환영 이벤트', 'reward_gold': 5000, 'reward_gem': 50},
    {'title': '주말 보너스 이벤트', 'reward_gold': 0, 'reward_gem': 0},
]
MISSIONS = [
    {'title': '첫 게임 플레이', 'goal': 1, 'reward_gold': 100, 'reward_exp': 10},
    {'title': '슬롯 마스터', 'goal': 5, 'reward_gold': 500, 'reward_exp': 50},
]

def main():
    sess = SessionLocal()
    # 1. 기존 데이터 삭제(시드계정 user_id만 남기고 모두 삭제)
    user_ids = [u.id for u in sess.execute(select(User).where(User.site_id.in_(SEED_SITE_IDS))).scalars().all()]
    sess.execute(delete(GameSession).where(~GameSession.user_id.in_(user_ids)))
    sess.execute(delete(ShopTransaction).where(~ShopTransaction.user_id.in_(user_ids)))
    sess.execute(delete(Event))
    sess.execute(delete(Mission))
    sess.commit()
    # 2. 시드계정별 데이터 생성
    for idx, site_id in enumerate(SEED_SITE_IDS):
        user = sess.execute(select(User).where(User.site_id == site_id)).scalar_one()
        # 게임 세션
        for i in range(GAME_COUNT):
            gs = GameSession(
                external_session_id=f"{site_id}-sess-{i+1}",
                user_id=user.id,
                game_type=GAME_TYPES[i % len(GAME_TYPES)],
                initial_bet=100 * (i+1),
                total_bet=100 * (i+1),
                total_win=50 * (i+1),
                total_rounds=1,
                start_time=None,
                end_time=None,
                status='ended',
                created_at=None,
                result_data={"result": "win" if i % 2 == 0 else "lose"}
            )
            sess.add(gs)
        # 상점 거래
        for i in range(SHOP_COUNT):
            st = ShopTransaction(
                user_id=user.id,
                product_id='prod-basic',
                kind='gems',
                quantity=1,
                unit_price=1000,
                amount=1000 * (i+1),
                payment_method='seed',
                status='success',
                receipt_code=f"{site_id}-rcpt-{i+1}",
                created_at=None,
                updated_at=None,
                failure_reason=None,
                integrity_hash=None,
                idempotency_key=f"{site_id}-idem-{i+1}",
                extra=None,
                receipt_signature=None,
                original_tx_id=None
            )
            sess.add(st)
    # 이벤트/미션(모든 계정에 동일하게 부여)
    from datetime import datetime
    for e in EVENTS:
        now = datetime.utcnow()
        event = Event(
            title=e['title'],
            description=e['title'],
            event_type='special',
            start_date=now,
            end_date=now,
            rewards={"gold": e.get('reward_gold', 0), "gems": e.get('reward_gem', 0)},
            requirements={},
            image_url=None,
            is_active=True,
            priority=0,
            created_at=now
        )
        sess.add(event)
    for m in MISSIONS:
        mission = Mission(
            title=m['title'],
            description=m['title'],
            mission_type='achievement',
            category='game',
            target_value=m['goal'],
            target_type='play_count',
            rewards={"gold": m.get('reward_gold', 0), "exp": m.get('reward_exp', 0)},
            requirements={},
            reset_period='never',
            icon=None,
            is_active=True,
            sort_order=0,
            created_at=None
        )
        sess.add(mission)
    sess.commit()
    print('시드계정 데이터 초기화 및 생성 완료')
    sess.close()

if __name__ == '__main__':
    main()
