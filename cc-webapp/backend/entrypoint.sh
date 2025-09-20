#!/bin/sh

# Map env defaults from POSTGRES_* to expected vars if not set
: "${DB_HOST:=${POSTGRES_SERVER:-postgres}}"
: "${DB_PORT:=${POSTGRES_PORT:-5432}}"
: "${DB_USER:=${POSTGRES_USER:-cc_user}}"
: "${DB_PASSWORD:=${POSTGRES_PASSWORD:-cc_password}}"
: "${DB_NAME:=${POSTGRES_DB:-cc_webapp}}"

# PostgreSQL 연결 대기
echo "Waiting for PostgreSQL..."
while ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
    sleep 1
done
echo "PostgreSQL is ready!"

# PostgreSQL DB 자동 생성
echo "Checking if database $DB_NAME exists..."
DB_EXIST=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -p $DB_PORT -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';")
if [ "$DB_EXIST" != "1" ]; then
  echo "Database $DB_NAME does not exist. Creating..."
  PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -U $DB_USER -p $DB_PORT $DB_NAME
  echo "Database $DB_NAME created."
else
  echo "Database $DB_NAME already exists."
fi

# --- Seed shop products (9 items: 5 gold-type, 4 voucher-type) ---
seed_shop_products() {
  if [ "${AUTO_SEED_BASIC:-0}" != "1" ]; then
    echo "AUTO_SEED_BASIC disabled. Skipping shop_products seed."
    return
  fi
  # Ensure target table exists before seeding
  TABLE_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -p $DB_PORT -d $DB_NAME -tAc "SELECT to_regclass('public.shop_products') IS NOT NULL;" | tr -d '[:space:]')
  if [ "$TABLE_EXISTS" != "t" ]; then
    echo "shop_products table not found. Skipping seed."
    return
  fi
  echo "Seeding shop_products (idempotent) ..."
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -p $DB_PORT -d $DB_NAME -v ON_ERROR_STOP=1 <<'SQL'
-- Insert 9 products (5 gold-type utility, 4 model-point vouchers)
INSERT INTO shop_products (product_id, name, description, price, is_active, extra) VALUES
('anti_bankruptcy', '한폴방지', '한폴방지 상품', 20000, true, '{"type":"gold","gold_amount":20000}'),
('attendance_connect', '출석연결', '출석연결 상품 (월 3회)', 30000, true, '{"type":"gold","gold_amount":30000,"monthly_limit":3}'),
('daily_comp_2x', '1일 콤프2배', '1일 콤프2배 상품', 40000, true, '{"type":"gold","gold_amount":40000}'),
('charge_30_percent', '충전30%', '충전30% 상품 (주 1회)', 50000, true, '{"type":"gold","gold_amount":50000,"weekly_limit":1}'),
('early_promotion', '조기등업', '조기등업 상품 (1회만 구매가능)', 500000, true, '{"type":"gold","gold_amount":500000,"purchase_limit":1}'),
('model_30k_voucher', '모델 30,000 포인트교환권', '모델 30,000 포인트교환권', 30000, true, '{"type":"voucher","gold_amount":30000,"model_points":30000}'),
('model_105k_voucher', '모델 105,000 포인트교환권', '모델 105,000 포인트교환권', 100000, true, '{"type":"voucher","gold_amount":100000,"model_points":105000}'),
('model_330k_voucher', '모델 330,000 포인트교환권', '모델 330,000 포인트교환권', 300000, true, '{"type":"voucher","gold_amount":300000,"model_points":330000}'),
('model_1150k_voucher', '모델 1,150,000 포인트교환권', '모델 1,150,000 포인트교환권', 1000000, true, '{"type":"voucher","gold_amount":1000000,"model_points":1150000}')
ON CONFLICT (product_id) DO NOTHING;
SQL
}

# Redis 연결 확인 (비밀번호 지원)
echo "Checking Redis connection..."
python - <<'PY'
import os
import redis

host = os.getenv('REDIS_HOST', 'localhost')
port = int(os.getenv('REDIS_PORT', 6379))
password = os.getenv('REDIS_PASSWORD')

try:
  r = redis.Redis(host=host, port=port, password=password, socket_connect_timeout=3)
  r.ping()
  print('Redis is ready!')
except Exception as e:
  print(f'Redis check skipped/failed: {e}')
PY

# Alembic 버전 테이블 생성 보장 후 컬럼 길이 보정
echo "Ensuring alembic_version table and column width..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -p $DB_PORT -d $DB_NAME -v ON_ERROR_STOP=1 -c \
  "CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(255) NOT NULL);" || true
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -p $DB_PORT -d $DB_NAME -v ON_ERROR_STOP=0 -c \
  "ALTER TABLE IF EXISTS alembic_version ALTER COLUMN version_num TYPE VARCHAR(255);" || true

# If alembic_version was pre-seeded but core tables are missing, reset it
USERS_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -p $DB_PORT -d $DB_NAME -tAc "SELECT to_regclass('public.users') IS NOT NULL;" | tr -d '[:space:]')
CUR_VER=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -p $DB_PORT -d $DB_NAME -tAc "SELECT version_num FROM alembic_version LIMIT 1;" 2>/dev/null | tr -d '[:space:]')
if [ "$USERS_EXISTS" = "f" ] && [ "$CUR_VER" = "79b9722f373c" ]; then
  echo "Users table missing but alembic_version is at base. Resetting alembic_version to rerun initial migration..."
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -p $DB_PORT -d $DB_NAME -c "DELETE FROM alembic_version;" || true
fi

# If core tables exist but alembic_version is empty, stamp to head to avoid duplicate-creation errors
if [ "$USERS_EXISTS" = "t" ] && [ -z "$CUR_VER" ]; then
  echo "Core tables exist but alembic_version is empty. Stamping head to align..."
  alembic stamp head || true
  echo "Alembic stamped successfully. Skipping further migrations..."
  echo "Setting up initial data... (SKIPPED: app/core/init_db.py not found)"
  # Seed shop products (idempotent)
  seed_shop_products || true
  echo "Starting FastAPI application..."
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  exit 0
fi

# If core tables exist and alembic_version has a version, skip migration to avoid duplicate table errors
if [ "$USERS_EXISTS" = "t" ] && [ -n "$CUR_VER" ]; then
  echo "Core tables exist and alembic_version is at $CUR_VER. Skipping migration to avoid DuplicateTable errors..."
  echo "Use 'alembic upgrade head' manually if schema changes are needed."
  echo "Setting up initial data... (SKIPPED: app/core/init_db.py not found)"
  # Seed shop products (idempotent)
  seed_shop_products || true
  echo "Starting FastAPI application..."
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  exit 0
else
  # Alembic 마이그레이션 실행
  echo "Running database migrations..."
  alembic upgrade head || { echo "Alembic migration failed"; exit 1; }
fi

# 초기 데이터 설정 (초대 코드 생성 등)
echo "Setting up initial data... (SKIPPED: app/core/init_db.py not found)"
# python -c "
# from app.core.init_db import init_db
# init_db()
# print('Initial data setup completed!')
# "

# FastAPI 애플리케이션 실행
# Seed shop products (idempotent)
seed_shop_products || true

echo "Starting FastAPI application..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload