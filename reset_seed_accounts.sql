-- 시드 계정 데이터 초기화 SQL 스크립트
-- Usage: docker compose exec postgres psql -U cc_user -d cc_webapp -f /sql/reset_seed_accounts.sql

-- 1. 시드 계정 목록 확인
SELECT 
    id, site_id, gold_balance, gem_balance, experience_points, daily_streak
FROM users 
WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser')
ORDER BY site_id;

-- 2. 시드 계정의 모든 활동 기록 삭제
DELETE FROM user_actions 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser')
);

-- 3. 시드 계정의 모든 보상 기록 삭제
DELETE FROM user_rewards 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser')
);

-- 4. 시드 계정의 모든 스트릭 로그 삭제
DELETE FROM streak_logs 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser')
);

-- 5. 시드 계정의 사용자 데이터 초기화
UPDATE users 
SET 
    gold_balance = 1000,
    gem_balance = 0,
    experience_points = 0,
    daily_streak = 0,
    total_spent = 0.0,
    battlepass_level = 1,
    vip_tier = 'STANDARD',
    updated_at = NOW()
WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser');

-- 6. 초기화 결과 확인
SELECT 
    '초기화 완료' as status,
    COUNT(*) as total_accounts,
    SUM(gold_balance) as total_gold,
    SUM(gem_balance) as total_gems,
    SUM(experience_points) as total_xp,
    SUM(daily_streak) as total_streaks
FROM users 
WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser');

-- 7. 각 계정별 최종 상태 확인
SELECT 
    site_id,
    gold_balance,
    gem_balance, 
    experience_points,
    daily_streak,
    battlepass_level,
    vip_tier,
    updated_at
FROM users 
WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser')
ORDER BY site_id;
