#!/bin/bash
set -e

echo "====== Initializing Test Data ======"

# Check if containers are running
if ! docker-compose ps | grep -q "Up"; then
  echo "Error: Docker containers are not running. Start them with 'docker-compose up -d' first."
  exit 1
fi

echo "Generating test data..."
docker-compose exec -T backend python -c "
import sys
sys.path.append('/app')
from scripts.generate_test_data import generate_test_data
generate_test_data()
print('Test data generated successfully')
"

# Load sample data for specific modules
echo "Loading sample game data..."
docker-compose exec -T postgres psql -U cc_user -d cc_webapp -c "
INSERT INTO games (id, name, description, min_bet, max_bet, created_at)
VALUES 
  (1, 'Neon Slots', 'Cyberpunk themed slot machine with neon aesthetics', 10, 1000, NOW()),
  (2, 'Cyber Roulette', 'Digital roulette with futuristic visuals', 5, 500, NOW()),
  (3, 'Neural Blackjack', 'AI-themed blackjack experience', 20, 2000, NOW())
ON CONFLICT (id) DO NOTHING;
"

echo "Loading sample user data..."
docker-compose exec -T postgres psql -U cc_user -d cc_webapp -c "
INSERT INTO users (id, nickname, email, vip_tier, battlepass_level, total_spent, created_at)
VALUES 
  (1, 'TestUser1', 'test1@example.com', 'STANDARD', 1, 0, NOW()),
  (2, 'TestUser2', 'test2@example.com', 'PREMIUM', 5, 1000, NOW()),
  (3, 'TestUser3', 'test3@example.com', 'VIP', 10, 5000, NOW())
ON CONFLICT (id) DO NOTHING;
"

echo "Loading sample rewards data..."
docker-compose exec -T postgres psql -U cc_user -d cc_webapp -c "
INSERT INTO user_rewards (id, user_id, reward_type, amount, source, created_at)
VALUES 
  (1, 1, 'COINS', 100, 'DAILY_BONUS', NOW()),
  (2, 2, 'GEMS', 50, 'PURCHASE', NOW()),
  (3, 3, 'COINS', 500, 'GAME_WIN', NOW())
ON CONFLICT (id) DO NOTHING;
"

echo "====== Test Data Initialization Complete ======"
