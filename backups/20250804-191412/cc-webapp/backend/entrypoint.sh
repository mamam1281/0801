#!/bin/bash

# PostgreSQL 연결 대기
echo "Waiting for PostgreSQL..."
while ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
    sleep 1
done
echo "PostgreSQL is ready!"

# PostgreSQL DB 자동 생성
echo "Checking if database $DB_NAME exists..."
DB_EXIST=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -p $DB_PORT -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';")
if [ "$DB_EXIST" != "1" ]; then
  echo "Database $DB_NAME does not exist. Creating..."
  PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -U $DB_USER -p $DB_PORT $DB_NAME
  echo "Database $DB_NAME created."
else
  echo "Database $DB_NAME already exists."
fi

# Redis 연결 확인
echo "Checking Redis connection..."
python -c "
import redis
import os
r = redis.Redis(host=os.getenv('REDIS_HOST', 'localhost'), port=int(os.getenv('REDIS_PORT', 6379)))
r.ping()
print('Redis is ready!')
"

# Alembic 마이그레이션 실행
echo "Running database migrations..."
alembic upgrade head

# 초기 데이터 설정 (초대 코드 생성 등)
echo "Setting up initial data... (SKIPPED: app/core/init_db.py not found)"
# python -c "
# from app.core.init_db import init_db
# init_db()
# print('Initial data setup completed!')
# "

# FastAPI 애플리케이션 실행
echo "Starting FastAPI application..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload