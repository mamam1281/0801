#!/usr/bin/env python3
"""
시드 계정 데이터 초기화 스크립트
Usage: python reset_seed_accounts.py
Docker: docker compose exec backend python reset_seed_accounts.py
"""

import sys
import os
from sqlalchemy.orm import Session
from datetime import datetime

# 프로젝트 루트 경로 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import get_db
from app.models import User, UserAction, UserReward, StreakLog
from app.core.config import settings
import redis

# 시드 계정 목록
SEED_ACCOUNTS = [
    'user001', 'user002', 'user003', 'user004', 'user005', 
    'admin', 'testuser'
]

# 초기 계정 설정값
INITIAL_VALUES = {
    'gold_balance': 1000,
    'gem_balance': 0, 
    'experience_points': 0,
    'daily_streak': 0,
    'total_spent': 0.0,
    'battlepass_level': 1,
    'vip_tier': 'STANDARD'
}

def reset_database_records(db: Session):
    """데이터베이스 레코드 초기화"""
    print("🗃️ 데이터베이스 레코드 초기화 중...")
    
    # 시드 계정 조회
    users = db.query(User).filter(User.site_id.in_(SEED_ACCOUNTS)).all()
    user_ids = [user.id for user in users]
    
    if not users:
        print("❌ 시드 계정을 찾을 수 없습니다.")
        return
    
    print(f"📋 찾은 계정: {[user.site_id for user in users]}")
    
    # 1. UserAction 레코드 삭제
    deleted_actions = db.query(UserAction).filter(UserAction.user_id.in_(user_ids)).delete()
    print(f"🗑️ UserAction 레코드 {deleted_actions}개 삭제")
    
    # 2. UserReward 레코드 삭제  
    deleted_rewards = db.query(UserReward).filter(UserReward.user_id.in_(user_ids)).delete()
    print(f"🗑️ UserReward 레코드 {deleted_rewards}개 삭제")
    
    # 3. StreakLog 레코드 삭제
    deleted_streaks = db.query(StreakLog).filter(StreakLog.user_id.in_(user_ids)).delete()
    print(f"🗑️ StreakLog 레코드 {deleted_streaks}개 삭제")
    
    # 4. User 테이블 초기값으로 업데이트
    for user in users:
        for field, value in INITIAL_VALUES.items():
            setattr(user, field, value)
        user.updated_at = datetime.utcnow()
        print(f"🔄 {user.site_id}: 초기값으로 복원")
    
    # 변경사항 커밋
    db.commit()
    print("✅ 데이터베이스 초기화 완료")

def reset_redis_cache():
    """Redis 캐시 초기화"""
    print("🔄 Redis 캐시 초기화 중...")
    
    try:
        # Redis 연결
        r = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD,
            db=0,
            decode_responses=True
        )
        
        # 시드 계정 관련 Redis 키 패턴
        patterns = [
            "user:*:streak_daily_lock:*",
            "user:*:last_action_ts",
            "user:*:streak_count", 
            "user:*:pending_gems",
            "battlepass:*:xp",
            "user:*:balance",
            "user:*:profile"
        ]
        
        total_deleted = 0
        for pattern in patterns:
            keys = r.keys(pattern)
            if keys:
                deleted = r.delete(*keys)
                total_deleted += deleted
                print(f"🗑️ Redis 패턴 '{pattern}': {deleted}개 키 삭제")
        
        print(f"✅ Redis 캐시 초기화 완료 (총 {total_deleted}개 키 삭제)")
        
    except Exception as e:
        print(f"⚠️ Redis 초기화 중 오류: {e}")
        print("Redis 서비스가 실행 중인지 확인해주세요.")

def main():
    """메인 실행 함수"""
    print("=" * 50)
    print("🎰 Casino-Club F2P 시드 계정 초기화 스크립트")
    print("=" * 50)
    
    print(f"📋 초기화 대상 계정: {', '.join(SEED_ACCOUNTS)}")
    print(f"🔧 초기값: {INITIAL_VALUES}")
    
    # 확인 프롬프트
    confirm = input("\n⚠️ 정말로 시드 계정 데이터를 초기화하시겠습니까? (y/N): ")
    if confirm.lower() != 'y':
        print("❌ 초기화가 취소되었습니다.")
        return
    
    try:
        # 데이터베이스 초기화
        db = next(get_db())
        reset_database_records(db)
        
        # Redis 캐시 초기화
        reset_redis_cache()
        
        print("\n" + "=" * 50)
        print("🎉 시드 계정 초기화가 완료되었습니다!")
        print("=" * 50)
        print("\n📊 초기화된 내용:")
        print("- 모든 UserAction/UserReward/StreakLog 기록 삭제")
        print("- 사용자 잔액, 경험치, 스트릭 초기화")
        print("- Redis 캐시 (스트릭 락, 잔액 등) 초기화")
        print("\n🔄 서비스 재시작을 권장합니다.")
        
    except Exception as e:
        print(f"\n❌ 초기화 중 오류가 발생했습니다: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
