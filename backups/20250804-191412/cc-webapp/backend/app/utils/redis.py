"""
Redis 유틸리티 함수들
- 사용자 데이터 캐싱
- 세션 관리
- 스트릭 카운터
- 실시간 데이터 저장
"""

import json
import redis
from typing import Any, Optional, Dict, List
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class RedisManager:
    """Redis 연결 및 데이터 관리 클래스"""
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        """
        Redis 매니저 초기화
        
        Args:
            redis_client: Redis 클라이언트 인스턴스
        """
        self.redis_client = redis_client
        self._fallback_cache = {}  # Redis 연결 실패시 임시 메모리 캐시
    
    def is_connected(self) -> bool:
        """Redis 연결 상태 확인"""
        try:
            if self.redis_client:
                self.redis_client.ping()
                return True
        except Exception as e:
            logger.warning(f"Redis connection failed: {str(e)}")
        return False
    
    def cache_user_data(self, user_id: str, data: Dict[str, Any], 
                       expire_seconds: int = 3600) -> bool:
        """
        사용자 데이터 캐싱
        
        Args:
            user_id: 사용자 ID
            data: 캐시할 데이터
            expire_seconds: 만료 시간 (초)
        
        Returns:
            캐싱 성공 여부
        """
        try:
            key = f"user:{user_id}:data"
            
            if self.is_connected():
                serialized_data = json.dumps(data, default=str)
                result = self.redis_client.setex(key, expire_seconds, serialized_data)
                return bool(result)
            else:
                # Fallback to memory cache
                self._fallback_cache[key] = {
                    "data": data,
                    "expires_at": datetime.utcnow() + timedelta(seconds=expire_seconds)
                }
                return True
                
        except Exception as e:
            logger.error(f"Failed to cache user data: {str(e)}")
            return False
    
    def get_cached_data(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        캐시된 사용자 데이터 조회
        
        Args:
            user_id: 사용자 ID
        
        Returns:
            캐시된 데이터 또는 None
        """
        try:
            key = f"user:{user_id}:data"
            
            if self.is_connected():
                cached_data = self.redis_client.get(key)
                if cached_data:
                    return json.loads(cached_data.decode('utf-8'))
            else:
                # Check fallback cache
                cached_item = self._fallback_cache.get(key)
                if cached_item and cached_item["expires_at"] > datetime.utcnow():
                    return cached_item["data"]
                elif cached_item:
                    # Remove expired item
                    del self._fallback_cache[key]
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get cached data: {str(e)}")
            return None
    
    def update_streak_counter(self, user_id: str, action_type: str, 
                             increment: bool = True) -> int:
        """
        사용자 스트릭 카운터 업데이트
        
        Args:
            user_id: 사용자 ID
            action_type: 액션 타입 (SLOT_SPIN, GACHA_PULL 등)
            increment: 증가(True) 또는 리셋(False)
        
        Returns:
            현재 스트릭 카운트
        """
        try:
            key = f"user:{user_id}:streak:{action_type}"
            
            if self.is_connected():
                if increment:
                    current_count = self.redis_client.incr(key)
                    # 24시간 만료 설정
                    self.redis_client.expire(key, 86400)
                else:
                    # 스트릭 리셋
                    self.redis_client.delete(key)
                    current_count = 0
                
                return current_count
            else:
                # Fallback to memory cache
                if increment:
                    current_count = self._fallback_cache.get(key, 0) + 1
                    self._fallback_cache[key] = current_count
                else:
                    self._fallback_cache[key] = 0
                    current_count = 0
                
                return current_count
                
        except Exception as e:
            logger.error(f"Failed to update streak counter: {str(e)}")
            return 0
    
    def manage_session_data(self, session_id: str, data: Optional[Dict[str, Any]] = None, 
                           delete: bool = False) -> Optional[Dict[str, Any]]:
        """
        세션 데이터 관리 (생성/조회/삭제)
        
        Args:
            session_id: 세션 ID
            data: 저장할 데이터 (None이면 조회)
            delete: 삭제 여부
        
        Returns:
            세션 데이터 또는 None
        """
        try:
            key = f"session:{session_id}"
            
            if delete:
                # 세션 삭제
                if self.is_connected():
                    self.redis_client.delete(key)
                else:
                    self._fallback_cache.pop(key, None)
                return None
            
            if data is not None:
                # 세션 데이터 저장
                if self.is_connected():
                    serialized_data = json.dumps(data, default=str)
                    self.redis_client.setex(key, 3600, serialized_data)  # 1시간 만료
                else:
                    self._fallback_cache[key] = {
                        "data": data,
                        "expires_at": datetime.utcnow() + timedelta(hours=1)
                    }
                return data
            else:
                # 세션 데이터 조회
                if self.is_connected():
                    cached_data = self.redis_client.get(key)
                    if cached_data:
                        return json.loads(cached_data.decode('utf-8'))
                else:
                    cached_item = self._fallback_cache.get(key)
                    if cached_item and cached_item["expires_at"] > datetime.utcnow():
                        return cached_item["data"]
                    elif cached_item:
                        del self._fallback_cache[key]
                
                return None
                
        except Exception as e:
            logger.error(f"Failed to manage session data: {str(e)}")
            return None
    
    def store_temp_data(self, key: str, data: Any, expire_seconds: int = 300) -> bool:
        """
        임시 데이터 저장 (기본 5분 만료)
        
        Args:
            key: 저장 키
            data: 저장할 데이터
            expire_seconds: 만료 시간 (초)
        
        Returns:
            저장 성공 여부
        """
        try:
            if self.is_connected():
                serialized_data = json.dumps(data, default=str)
                result = self.redis_client.setex(key, expire_seconds, serialized_data)
                return bool(result)
            else:
                self._fallback_cache[key] = {
                    "data": data,
                    "expires_at": datetime.utcnow() + timedelta(seconds=expire_seconds)
                }
                return True
                
        except Exception as e:
            logger.error(f"Failed to store temp data: {str(e)}")
            return False
    
    def get_temp_data(self, key: str) -> Optional[Any]:
        """
        임시 데이터 조회
        
        Args:
            key: 조회 키
        
        Returns:
            저장된 데이터 또는 None
        """
        try:
            if self.is_connected():
                cached_data = self.redis_client.get(key)
                if cached_data:
                    return json.loads(cached_data.decode('utf-8'))
            else:
                cached_item = self._fallback_cache.get(key)
                if cached_item and cached_item["expires_at"] > datetime.utcnow():
                    return cached_item["data"]
                elif cached_item:
                    del self._fallback_cache[key]
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get temp data: {str(e)}")
            return None
    
    def clean_expired_cache(self):
        """만료된 메모리 캐시 정리"""
        try:
            current_time = datetime.utcnow()
            expired_keys = [
                key for key, value in self._fallback_cache.items()
                if isinstance(value, dict) and 
                value.get("expires_at", current_time) <= current_time
            ]
            
            for key in expired_keys:
                del self._fallback_cache[key]
            
            logger.info(f"Cleaned {len(expired_keys)} expired cache entries")
            
        except Exception as e:
            logger.error(f"Failed to clean expired cache: {str(e)}")

# 전역 Redis 매니저 인스턴스
redis_manager = None

def init_redis_manager(redis_client: Optional[redis.Redis] = None):
    """Redis 매니저 초기화"""
    global redis_manager
    redis_manager = RedisManager(redis_client)

def get_redis_manager() -> RedisManager:
    """Redis 매니저 인스턴스 반환"""
    global redis_manager
    if redis_manager is None:
        redis_manager = RedisManager()
    return redis_manager

# 편의 함수들
def cache_user_data(user_id: str, data: Dict[str, Any], expire_seconds: int = 3600) -> bool:
    """사용자 데이터 캐싱 (편의 함수)"""
    return get_redis_manager().cache_user_data(user_id, data, expire_seconds)

def get_cached_data(user_id: str) -> Optional[Dict[str, Any]]:
    """캐시된 사용자 데이터 조회 (편의 함수)"""
    return get_redis_manager().get_cached_data(user_id)

def update_streak_counter(user_id: str, action_type: str, increment: bool = True) -> int:
    """스트릭 카운터 업데이트 (편의 함수)"""
    return get_redis_manager().update_streak_counter(user_id, action_type, increment)

def manage_session_data(session_id: str, data: Optional[Dict[str, Any]] = None, 
                       delete: bool = False) -> Optional[Dict[str, Any]]:
    """세션 데이터 관리 (편의 함수)"""
    return get_redis_manager().manage_session_data(session_id, data, delete)