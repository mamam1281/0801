import psycopg2
from psycopg2.extras import RealDictCursor

# DB 연결
conn = psycopg2.connect(
    host='localhost', 
    port=5433, 
    database='cc_webapp', 
    user='cc_user', 
    password='cc_password'
)

try:
    # Users 테이블 스키마 확인
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND table_schema = 'public'
        ORDER BY ordinal_position
        """)
        
        columns = cur.fetchall()
        print("=== Users 테이블 컬럼 ===")
        for col in columns:
            print(f"{col['column_name']}: {col['data_type']}")
        
        # Shop 관련 테이블 확인
        cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name LIKE '%shop%'
        ORDER BY table_name
        """)
        
        shop_tables = cur.fetchall()
        print("\n=== Shop 관련 테이블 ===")
        for table in shop_tables:
            print(table['table_name'])
        
        # 간단한 사용자 데이터 조회
        cur.execute("SELECT id, site_id, nickname FROM users LIMIT 5")
        users = cur.fetchall()
        print("\n=== 기존 사용자 샘플 ===")
        for user in users:
            print(f"ID: {user['id']}, site_id: {user['site_id']}, nickname: {user['nickname']}")

finally:
    conn.close()