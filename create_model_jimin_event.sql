-- 모델지민 스페셜 이벤트 생성 SQL
-- 기존 이벤트 데이터 삭제
DELETE FROM events;

-- 모델지민 이벤트 생성
INSERT INTO events (
    id, title, description, event_type, 
    start_date, end_date, rewards, requirements,
    image_url, is_active, priority, created_at
) VALUES (
    1,
    '모델지민 스페셜 이벤트',
    '아름다운 모델 지민과 함께하는 특별한 이벤트! 매일 로그인하고 게임을 플레이하여 풍성한 보상을 받아보세요. 연속 7일 참여 시 특별 보너스가 제공됩니다.',
    'daily_login',
    '2025-09-07 00:00:00'::timestamp,
    '2025-09-21 23:59:59'::timestamp,
    '{"daily_reward": {"gold": 500, "experience": 100}, "milestone_rewards": [{"day": 3, "gold": 1500, "description": "3일 연속 참여 보너스"}, {"day": 7, "gold": 5000, "description": "일주일 연속 참여 특별 보상"}, {"day": 14, "gold": 15000, "description": "2주 연속 참여 럭셔리 보상"}], "special_bonus": {"gold": 10000, "description": "모델지민 스페셜 보너스"}}',
    '{"min_level": 1, "daily_login": true, "games_required": 1, "description": "매일 로그인 후 게임 1회 이상 플레이"}',
    '/images/events/model_jimin_special.jpg',
    true,
    1,
    NOW()
);

-- 생성된 이벤트 확인
SELECT 
    id, title, event_type, 
    start_date, end_date, is_active,
    LENGTH(rewards::text) as rewards_length,
    LENGTH(requirements::text) as requirements_length
FROM events;
