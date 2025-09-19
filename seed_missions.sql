-- 샘플 미션 데이터 삽입
INSERT INTO missions (title, description, mission_type, category, target_value, target_type, rewards, requirements, reset_period, icon, is_active, sort_order)
VALUES
('첫 번째 게임 플레이', '게임을 처음 플레이해보세요', 'daily', 'game', 1, 'play_count', '{"gold": 100, "exp": 10}', '{}', 'daily', '🎮', true, 1),
('5회 게임 플레이', '게임을 5회 플레이하세요', 'daily', 'game', 5, 'play_count', '{"gold": 500, "exp": 50}', '{}', 'daily', '🎯', true, 2),
('첫 승리 달성', '게임에서 첫 승리를 거두세요', 'achievement', 'game', 1, 'win_count', '{"gold": 200, "exp": 25}', '{}', 'never', '🏆', true, 3),
('주간 20회 플레이', '일주일 동안 게임을 20회 플레이하세요', 'weekly', 'game', 20, 'play_count', '{"gold": 2000, "exp": 200}', '{}', 'weekly', '📅', true, 4);