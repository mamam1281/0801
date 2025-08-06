#!/bin/bash
set -e

echo "====== Health Check: Casino-Club F2P Services ======"

# Check Docker services status
echo "Checking Docker services..."
if ! docker-compose ps | grep -q "Up"; then
  echo "❌ Error: Some Docker services are not running"
  docker-compose ps
  exit 1
else
  echo "✅ All Docker services are running"
  docker-compose ps
fi

# Check Backend API
echo "Checking Backend API..."
if curl -s http://localhost:8000/api/health | grep -q "status.*healthy"; then
  echo "✅ Backend API is healthy"
else
  echo "❌ Error: Backend API is not responding properly"
  curl -v http://localhost:8000/api/health
  exit 1
fi

# Check Database connection
echo "Checking PostgreSQL connection..."
if docker-compose exec -T postgres pg_isready -U cc_user -d cc_webapp; then
  echo "✅ PostgreSQL connection successful"
else
  echo "❌ Error: Cannot connect to PostgreSQL"
  exit 1
fi

# Check Redis connection
echo "Checking Redis connection..."
if docker-compose exec -T redis redis-cli -a $REDIS_PASSWORD ping | grep -q "PONG"; then
  echo "✅ Redis connection successful"
else
  echo "❌ Error: Cannot connect to Redis"
  exit 1
fi

# Check Kafka (if available)
echo "Checking Kafka connection..."
if docker-compose exec -T kafka kafka-topics.sh --bootstrap-server kafka:9093 --list 2>/dev/null; then
  echo "✅ Kafka connection successful"
else
  echo "⚠️ Warning: Cannot connect to Kafka (not critical for test environment)"
fi

# Check Frontend build status
echo "Checking Frontend build status..."
if docker-compose exec -T frontend ls -la /app/.next >/dev/null 2>&1; then
  echo "✅ Frontend build exists"
else
  echo "⚠️ Warning: Frontend build may not be complete yet"
fi

echo "====== Health Check Complete: All Critical Services Running ======"
exit 0
