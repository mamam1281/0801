import os, random, datetime
from sqlalchemy import text, create_engine

DB_URL = os.getenv("SQLALCHEMY_DATABASE_URI") or os.getenv("DATABASE_URL") or "postgresql://cc_user:cc_password@cc_postgres:5432/cc_webapp"
engine = create_engine(DB_URL)

ROWS = int(os.getenv("SEED_ROWS", "5000"))
now = datetime.datetime.utcnow()

GAME_TYPES = ["slot","gacha","crash"]

with engine.begin() as conn:
    # minimal existence checks
    # seed game_sessions
    for i in range(ROWS):
        uid = random.randint(1, 200)
        gt = random.choice(GAME_TYPES)
        start = now - datetime.timedelta(minutes=random.randint(0, 10000))
        total_rounds = random.randint(1, 30)
        total_bet = random.randint(10, 5000)
        total_win = int(total_bet * random.uniform(0, 2))
        status = random.choice(["active","ended","aborted"]) if random.random()<0.9 else "ended"
        conn.execute(text("""
            INSERT INTO game_sessions (external_session_id,user_id,game_type,initial_bet,total_win,total_bet,total_rounds,start_time,end_time,status,created_at)
            VALUES (:sid,:uid,:gt,:ib,:tw,:tb,:tr,:st,:et,:status,:created)
            ON CONFLICT (external_session_id) DO NOTHING
        """), {
            "sid": f"seed-{i}-{uid}-{gt}",
            "uid": uid,
            "gt": gt,
            "ib": random.randint(1, 100),
            "tw": total_win,
            "tb": total_bet,
            "tr": total_rounds,
            "st": start,
            "et": start + datetime.timedelta(minutes=total_rounds),
            "status": status,
            "created": start,
        })
    # seed shop_transactions
    for i in range(ROWS):
        uid = random.randint(1, 200)
        amount = random.randint(100, 10000)
        created = now - datetime.timedelta(hours=random.randint(0, 24*14))
        conn.execute(text("""
            INSERT INTO shop_transactions (user_id, product_id, kind, quantity, unit_price, amount, status, created_at)
            VALUES (:uid,'prod-basic','gems',1,:amt,:amt,'success',:created)
        """), {"uid": uid, "amt": amount, "created": created})
    # seed notifications (assuming notifications table schema: id pk, user_id, is_read bool, created_at)
    try:
        for i in range(ROWS):
            uid = random.randint(1, 200)
            created = now - datetime.timedelta(hours=random.randint(0, 240))
            is_read = random.random() < 0.7
            conn.execute(text("""
                INSERT INTO notifications (user_id, is_read, created_at)
                VALUES (:uid, :is_read, :created)
            """), {"uid": uid, "is_read": is_read, "created": created})
    except Exception:
        pass

print("Seed complete")

EXPLAINS = [
    ("recent_sessions", "EXPLAIN SELECT * FROM game_sessions WHERE user_id=42 AND game_type='slot' ORDER BY start_time DESC LIMIT 20"),
    ("purchase_sum", "EXPLAIN SELECT SUM(amount) FROM shop_transactions WHERE user_id=42 AND created_at >= NOW() - INTERVAL '7 days'"),
    ("unread_count", "EXPLAIN SELECT COUNT(*) FROM notifications WHERE user_id=42 AND is_read = false"),
]

with engine.connect() as conn:
    for name, sql in EXPLAINS:
        print(f"--- {name} ---")
        for row in conn.execute(text(sql)):
            print(row[0])
