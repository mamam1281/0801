-- 시드 계정 완전 초기화 SQL 스크립트
-- 모든 게임 데이터, 통계, 스트릭 기록 삭제 및 초기화

\echo '🎰 Casino-Club F2P 시드 계정 완전 초기화 시작...'

-- 시드 계정 목록
-- user001, user002, user003, user004, user005, admin, testuser

-- 1. 현재 상태 확인
SELECT 
    '현재 시드 계정 상태' as status,
    site_id, 
    gold_balance, 
    experience_points, 
    daily_streak,
    battlepass_level,
    vip_tier,
    total_spent
FROM users 
WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser')
ORDER BY site_id;

-- 2. 게임 관련 테이블 데이터 삭제
-- 게임 세션 및 통계 데이터 삭제

-- 게임 세션 데이터 삭제
DELETE FROM crash_sessions 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

DELETE FROM crash_bets 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

DELETE FROM slot_sessions 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

DELETE FROM roulette_sessions 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

DELETE FROM blackjack_sessions 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

DELETE FROM baccarat_sessions 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

DELETE FROM poker_sessions 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

-- 게임 통계 및 리더보드 삭제
DELETE FROM game_leaderboards 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

DELETE FROM tournament_participants 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

-- 가챠 결과 삭제
DELETE FROM gacha_results 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

-- 게임 히스토리 삭제
DELETE FROM game_history 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

DELETE FROM game_sessions 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

-- 게임 통계 삭제
DELETE FROM game_stats 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

DELETE FROM user_game_stats 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

-- 3. 사용자 활동 및 보상 데이터 삭제
DELETE FROM user_actions 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

DELETE FROM user_rewards 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

DELETE FROM user_activities 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

DELETE FROM user_analytics 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

-- 4. 상점 및 구매 이력 삭제
DELETE FROM shop_transactions 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

DELETE FROM shop_promo_usage 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

-- 5. 미션 및 이벤트 참여 이력 삭제
DELETE FROM user_missions 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

DELETE FROM event_participations 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

-- 6. 기타 사용자 데이터 삭제
DELETE FROM user_achievements 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

DELETE FROM user_preferences 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

DELETE FROM user_progress 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

DELETE FROM user_sessions 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

DELETE FROM user_segments 
WHERE user_id IN (SELECT id FROM users WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser'));

-- 7. Users 테이블 초기화
UPDATE users 
SET 
    gold_balance = 1000,
    experience_points = 0,
    daily_streak = 0,
    total_spent = 0.0,
    battlepass_level = 1,
    vip_tier = 'STANDARD',
    updated_at = NOW()
WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser');

-- 8. 초기화 결과 확인
SELECT 
    '초기화 완료' as status,
    COUNT(*) as total_accounts,
    SUM(gold_balance) as total_gold,
    SUM(experience_points) as total_xp,
    SUM(daily_streak) as total_streaks
FROM users 
WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser');

SELECT 
    '각 계정별 최종 상태' as status,
    site_id,
    gold_balance,
    experience_points,
    daily_streak,
    battlepass_level,
    vip_tier,
    total_spent,
    updated_at
FROM users 
WHERE site_id IN ('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser')
ORDER BY site_id;
