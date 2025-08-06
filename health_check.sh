#!/bin/bash
set -e  # Exit immediately if a command fails

echo "====== Running health checks for Casino-Club F2P services ======"

# Check Docker services status
echo "Checking Docker services..."
services_down=$(docker-compose ps --services --filter "status=stopped" | wc -l)
if [ $services_down -gt 0 ]; then
  echo "❌ Error: Some services are not running"
  docker-compose ps
  exit 1
else
  echo "✅ All Docker services are running"
fi

# Check Backend API health
echo "Checking Backend API health..."
if curl -s http://localhost:8000/api/health | grep -q "status.*ok"; then
  echo "✅ Backend API is healthy"
else
  echo "❌ Error: Backend API is not responding properly"
  exit 1
fi

# Check Database connection
echo "Checking PostgreSQL connection..."
if docker-compose exec -T postgres pg_isready -U cc_user -d cc_webapp; then
  echo "✅ PostgreSQL connection is working"
else
  echo "❌ Error: PostgreSQL connection failed"
  exit 1
fi

# Check Redis connection
echo "Checking Redis connection..."
if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
  echo "✅ Redis connection is working"
else
  echo "❌ Error: Redis connection failed"
  exit 1
fi

# Check Kafka (if running)
echo "Checking Kafka connection..."
if docker-compose ps | grep -q "kafka.*Up"; then
  if docker-compose exec -T kafka kafka-topics.sh --bootstrap-server localhost:9092 --list; then
    echo "✅ Kafka connection is working"
  else
    echo "❌ Error: Kafka connection failed"
    exit 1
  fi
else
  echo "⚠️ Kafka service is not running (skipping check)"
fi

# Check Frontend availability (if running)
echo "Checking Frontend availability..."
if docker-compose ps | grep -q "frontend.*Up"; then
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|304"; then
    echo "✅ Frontend is accessible"
  else
    echo "⚠️ Warning: Frontend is running but HTTP check failed"
  fi
else
  echo "⚠️ Frontend service is not running (skipping check)"
fi

echo "====== Health checks completed successfully ======"
