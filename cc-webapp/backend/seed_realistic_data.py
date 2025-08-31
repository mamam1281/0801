"""실제 시드계정들과 연결된 올바른 시드 데이터 생성

문제점:
- 기존 seed_and_explain.py는 존재하지 않는 1~200번 유저 ID 사용
- 실제 시드계정들(admin, user001~004)과 전혀 무관한 가짜 데이터 생성

해결책:
- 실제 시드계정들의 user_id를 사용
- 현실적인 게임 활동 패턴 생성
- 시드계정별 특성을 반영한 데이터
"""
import os, random, datetime
from sqlalchemy import text, create_engine
from app.database import SessionLocal
from app.models.auth_models import User

# 실제 시드계정들의 user_id 가져오기
def get_seed_user_ids():
    db = SessionLocal()
    try:
        users = db.query(User).filter(
            User.site_id.in_(['admin','user001','user002','user003','user004'])
        ).all()
        return {u.site_id: u.id for u in users}
    finally:
        db.close()

def create_realistic_seed_data():
    """실제 시드계정들의 현실적인 활동 데이터 생성"""
    
    # 실제 시드 계정 ID들
    seed_users = get_seed_user_ids()
    print(f"실제 시드계정들: {seed_users}")
    
    DB_URL = os.getenv("DATABASE_URL") or "postgresql://cc_user:cc_password@postgres:5432/cc_webapp"
    engine = create_engine(DB_URL)
    
    now = datetime.datetime.utcnow()
    GAME_TYPES = ["slot", "gacha", "crash"]
    
    with engine.begin() as conn:
        
        # 1. 기존 시드 데이터 정리 (실제 시드계정 것만)
        seed_user_ids = list(seed_users.values())
        print(f"기존 시드 데이터 정리: user_ids {seed_user_ids}")
        
        # 게임 세션 정리
        conn.execute(text("""
            DELETE FROM game_sessions 
            WHERE user_id = ANY(:user_ids) OR external_session_id LIKE 'seed-%'
        """), {"user_ids": seed_user_ids})
        
        # 상점 거래 정리
        conn.execute(text("""
            DELETE FROM shop_transactions 
            WHERE user_id = ANY(:user_ids)
        """), {"user_ids": seed_user_ids})
        
        # 2. 시드계정별 특성화된 게임 세션 생성
        for site_id, user_id in seed_users.items():
            
            if site_id == 'admin':
                # 관리자: 테스트용 가벼운 활동
                sessions = 10
                bet_range = (10, 100)
            elif site_id in ['user001', 'user002']:
                # 활성 유저: 많은 활동
                sessions = 50
                bet_range = (50, 1000)
            else:
                # 일반 유저: 보통 활동
                sessions = 25
                bet_range = (20, 500)
            
            print(f"{site_id} (user_id={user_id}): {sessions}개 세션 생성")
            
            for i in range(sessions):
                game_type = random.choice(GAME_TYPES)
                
                # 현실적인 시간 분포 (최근 2주)
                start_time = now - datetime.timedelta(
                    hours=random.randint(1, 24*14)
                )
                
                # 현실적인 베팅 패턴
                min_bet, max_bet = bet_range
                total_bet = random.randint(min_bet, max_bet)
                total_rounds = random.randint(1, 20)
                
                # 현실적인 승률 (약간 손해)
                win_rate = random.uniform(0.7, 1.3)  # 70%~130% 회수율
                total_win = int(total_bet * win_rate)
                
                # 세션 종료 시간
                end_time = start_time + datetime.timedelta(
                    minutes=total_rounds + random.randint(1, 10)
                )
                
                status = "ended" if random.random() < 0.9 else "active"
                
                conn.execute(text("""
                    INSERT INTO game_sessions (
                        external_session_id, user_id, game_type, 
                        initial_bet, total_win, total_bet, total_rounds,
                        start_time, end_time, status, created_at
                    ) VALUES (
                        :sid, :uid, :gt, :ib, :tw, :tb, :tr, :st, :et, :status, :created
                    )
                """), {
                    "sid": f"seed-{site_id}-{i}-{game_type}",
                    "uid": user_id,
                    "gt": game_type,
                    "ib": random.randint(10, 50),
                    "tw": total_win,
                    "tb": total_bet,
                    "tr": total_rounds,
                    "st": start_time,
                    "et": end_time,
                    "status": status,
                    "created": start_time,
                })
        
        # 3. 시드계정별 상점 거래 생성
        for site_id, user_id in seed_users.items():
            
            if site_id == 'admin':
                # 관리자: 테스트 구매만
                purchases = 3
                amount_range = (100, 500)
            elif site_id in ['user001', 'user002']:
                # 활성 유저: 많은 구매
                purchases = 15
                amount_range = (500, 5000)
            else:
                # 일반 유저: 보통 구매
                purchases = 8
                amount_range = (200, 2000)
            
            print(f"{site_id}: {purchases}개 구매 기록 생성")
            
            for i in range(purchases):
                amount = random.randint(*amount_range)
                created_time = now - datetime.timedelta(
                    hours=random.randint(1, 24*10)
                )
                
                # 다양한 상품 타입
                products = [
                    ('gems-small', 'gems'),
                    ('gems-medium', 'gems'), 
                    ('gems-large', 'gems'),
                    ('battlepass-premium', 'battlepass'),
                    ('special-package', 'package')
                ]
                product_id, kind = random.choice(products)
                
                conn.execute(text("""
                    INSERT INTO shop_transactions (
                        user_id, product_id, kind, quantity, 
                        unit_price, amount, status, created_at
                    ) VALUES (
                        :uid, :pid, :kind, 1, :amt, :amt, 'success', :created
                    )
                """), {
                    "uid": user_id,
                    "pid": product_id,
                    "kind": kind,
                    "amt": amount,
                    "created": created_time
                })
    
    print("✅ 실제 시드계정들과 연결된 현실적인 시드 데이터 생성 완료!")
    
    # 4. 생성된 데이터 요약 출력
    with engine.begin() as conn:
        for site_id, user_id in seed_users.items():
            # 게임 세션 수
            game_count = conn.execute(text("""
                SELECT COUNT(*) FROM game_sessions WHERE user_id = :uid
            """), {"uid": user_id}).scalar()
            
            # 총 구매 금액
            total_spent = conn.execute(text("""
                SELECT COALESCE(SUM(amount), 0) FROM shop_transactions WHERE user_id = :uid
            """), {"uid": user_id}).scalar()
            
            print(f"📊 {site_id}: 게임세션 {game_count}개, 총구매 {total_spent:,}원")

if __name__ == '__main__':
    create_realistic_seed_data()
