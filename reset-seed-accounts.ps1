# 시드 계정 초기화 PowerShell 스크립트
# Usage: .\reset-seed-accounts.ps1

Write-Host "🎰 Casino-Club F2P 시드 계정 초기화 스크립트" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# 시드 계정 목록
$seedAccounts = @('user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser')

Write-Host "📋 초기화 대상 계정: $($seedAccounts -join ', ')" -ForegroundColor Yellow
Write-Host "🔧 초기값: 골드 1000, 젬 0, 경험치 0, 스트릭 0" -ForegroundColor Yellow

# 확인 프롬프트
$confirm = Read-Host "`n⚠️ 정말로 시드 계정 데이터를 초기화하시겠습니까? (y/N)"
if ($confirm -ne 'y') {
    Write-Host "❌ 초기화가 취소되었습니다." -ForegroundColor Red
    exit
}

Write-Host "`n🔄 초기화 시작..." -ForegroundColor Green

try {
    # 1. 데이터베이스 레코드 초기화
    Write-Host "🗃️ 데이터베이스 레코드 초기화 중..." -ForegroundColor Yellow
    
    $dbScript = @"
import sys
import os
sys.path.append('/app')

from app.database import get_db
from app.models import User, UserAction, UserReward, StreakLog
from datetime import datetime

# 시드 계정 목록
seed_accounts = ['user001', 'user002', 'user003', 'user004', 'user005', 'admin', 'testuser']

# 데이터베이스 연결
db = next(get_db())

try:
    # 시드 계정 조회
    users = db.query(User).filter(User.site_id.in_(seed_accounts)).all()
    user_ids = [user.id for user in users]
    
    print(f'찾은 계정: {[user.site_id for user in users]}')
    
    if users:
        # UserAction 레코드 삭제
        deleted_actions = db.query(UserAction).filter(UserAction.user_id.in_(user_ids)).delete()
        print(f'UserAction {deleted_actions}개 삭제')
        
        # UserReward 레코드 삭제
        deleted_rewards = db.query(UserReward).filter(UserReward.user_id.in_(user_ids)).delete()
        print(f'UserReward {deleted_rewards}개 삭제')
        
        # StreakLog 레코드 삭제
        deleted_streaks = db.query(StreakLog).filter(StreakLog.user_id.in_(user_ids)).delete()
        print(f'StreakLog {deleted_streaks}개 삭제')
        
        # User 초기값 복원
        for user in users:
            user.gold_balance = 1000
            user.gem_balance = 0
            user.experience_points = 0
            user.daily_streak = 0
            user.total_spent = 0.0
            user.battlepass_level = 1
            user.vip_tier = 'STANDARD'
            user.updated_at = datetime.utcnow()
            print(f'{user.site_id}: 초기값으로 복원')
        
        # 변경사항 커밋
        db.commit()
        print('데이터베이스 초기화 완료')
    else:
        print('시드 계정을 찾을 수 없습니다')
        
except Exception as e:
    print(f'오류: {e}')
    db.rollback()
finally:
    db.close()
"@

    # Python 스크립트 실행
    $dbScript | docker compose exec -T backend python -c "exec(input())"
    
    # 2. Redis 캐시 초기화
    Write-Host "🔄 Redis 캐시 초기화 중..." -ForegroundColor Yellow
    
    $redisScript = @"
import redis
import os

try:
    # Redis 연결
    r = redis.Redis(
        host=os.getenv('REDIS_HOST', 'redis'),
        port=int(os.getenv('REDIS_PORT', '6379')),
        password=os.getenv('REDIS_PASSWORD'),
        db=0,
        decode_responses=True
    )
    
    # 시드 계정 관련 Redis 키 패턴
    patterns = [
        'user:*:streak_daily_lock:*',
        'user:*:last_action_ts',
        'user:*:streak_count',
        'user:*:pending_gems',
        'battlepass:*:xp',
        'user:*:balance',
        'user:*:profile'
    ]
    
    total_deleted = 0
    for pattern in patterns:
        keys = r.keys(pattern)
        if keys:
            deleted = r.delete(*keys)
            total_deleted += deleted
            print(f'Redis 패턴 {pattern}: {deleted}개 키 삭제')
    
    print(f'Redis 캐시 초기화 완료 (총 {total_deleted}개 키 삭제)')
    
except Exception as e:
    print(f'Redis 초기화 중 오류: {e}')
"@

    # Redis 스크립트 실행
    $redisScript | docker compose exec -T backend python -c "exec(input())"
    
    Write-Host "`n" + "=" * 50 -ForegroundColor Green
    Write-Host "🎉 시드 계정 초기화가 완료되었습니다!" -ForegroundColor Green
    Write-Host "=" * 50 -ForegroundColor Green
    
    Write-Host "`n📊 초기화된 내용:" -ForegroundColor Cyan
    Write-Host "- 모든 UserAction/UserReward/StreakLog 기록 삭제" -ForegroundColor White
    Write-Host "- 사용자 잔액, 경험치, 스트릭 초기화" -ForegroundColor White
    Write-Host "- Redis 캐시 (스트릭 락, 잔액 등) 초기화" -ForegroundColor White
    
    Write-Host "`n🔄 서비스 재시작을 권장합니다." -ForegroundColor Yellow
    
} catch {
    Write-Host "`n❌ 초기화 중 오류가 발생했습니다: $($_.Exception.Message)" -ForegroundColor Red
}
