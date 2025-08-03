"""
JWT 토큰 블랙리스트 관리
Redis를 사용한 토큰 무효화 시스템
"""
from typing import Optional
from datetime import datetime, timedelta
import json
import redis
from ..core.logging import get_logger

logger = get_logger("token_blacklist")

class TokenBlacklist:
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        """
        토큰 블랙리스트 매니저 초기화
        
        Args:
            redis_client: Redis 클라이언트 (None이면 메모리 기반 임시 저장소 사용)
        """
        self.redis_client = redis_client
        self._memory_blacklist = set()  # Redis 없을 때 임시 메모리 저장소
        
    def add_to_blacklist(self, token: str, expires_at: datetime) -> bool:
        """
        토큰을 블랙리스트에 추가
        
        Args:
            token: 블랙리스트에 추가할 JWT 토큰
            expires_at: 토큰 만료 시간
            
        Returns:
            성공 여부
        """
        try:
            if self.redis_client:
                # Redis에 토큰 저장 (만료 시간까지만)
                ttl = int((expires_at - datetime.utcnow()).total_seconds())
                if ttl > 0:
                    self.redis_client.setex(
                        f"blacklist:{token}",
                        ttl,
                        json.dumps({
                            "blacklisted_at": datetime.utcnow().isoformat(),
                            "expires_at": expires_at.isoformat(),
                            "reason": "user_logout"
                        })
                    )
                logger.info(f"Token added to blacklist (Redis): {token[:20]}...")
            else:
                # 메모리 기반 저장소
                self._memory_blacklist.add(token)
                logger.info(f"Token added to blacklist (Memory): {token[:20]}...")
            
            return True
        except Exception as e:
            logger.error(f"Failed to add token to blacklist: {str(e)}")
            return False
    
    def is_blacklisted(self, token: str) -> bool:
        """
        토큰이 블랙리스트에 있는지 확인
        
        Args:
            token: 확인할 JWT 토큰
            
        Returns:
            블랙리스트 여부
        """
        try:
            if self.redis_client:
                # Redis에서 확인
                result = self.redis_client.get(f"blacklist:{token}")
                return result is not None
            else:
                # 메모리에서 확인
                return token in self._memory_blacklist
        except Exception as e:
            logger.error(f"Failed to check token blacklist: {str(e)}")
            # 오류 시 안전을 위해 블랙리스트로 간주
            return True
    
    def remove_from_blacklist(self, token: str) -> bool:
        """
        토큰을 블랙리스트에서 제거
        
        Args:
            token: 제거할 JWT 토큰
            
        Returns:
            성공 여부
        """
        try:
            if self.redis_client:
                # Redis에서 제거
                result = self.redis_client.delete(f"blacklist:{token}")
                logger.info(f"Token removed from blacklist (Redis): {token[:20]}...")
                return result > 0
            else:
                # 메모리에서 제거
                if token in self._memory_blacklist:
                    self._memory_blacklist.remove(token)
                    logger.info(f"Token removed from blacklist (Memory): {token[:20]}...")
                    return True
                return False
        except Exception as e:
            logger.error(f"Failed to remove token from blacklist: {str(e)}")
            return False
    
    def cleanup_expired(self) -> int:
        """
        만료된 블랙리스트 토큰 정리 (메모리 기반에서만 필요)
        Redis는 TTL로 자동 만료됨
        
        Returns:
            정리된 토큰 수
        """
        if self.redis_client:
            # Redis는 TTL로 자동 정리됨
            return 0
        
        # 메모리 기반은 만료 시간 추적이 어려우므로 주기적으로 전체 정리
        cleaned_count = len(self._memory_blacklist)
        self._memory_blacklist.clear()
        
        if cleaned_count > 0:
            logger.info(f"Cleaned {cleaned_count} tokens from memory blacklist")
        
        return cleaned_count

# 글로벌 블랙리스트 인스턴스
_blacklist_instance: Optional[TokenBlacklist] = None

def get_token_blacklist() -> TokenBlacklist:
    """
    토큰 블랙리스트 인스턴스 반환
    """
    global _blacklist_instance
    
    if _blacklist_instance is None:
        try:
            # Redis 연결 시도
            redis_client = redis.Redis(
                host='localhost',
                port=6379,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # 연결 테스트
            redis_client.ping()
            _blacklist_instance = TokenBlacklist(redis_client)
            logger.info("Token blacklist initialized with Redis")
        except Exception as e:
            # Redis 연결 실패시 메모리 기반으로 fallback
            logger.warning(f"Redis connection failed, using memory-based blacklist: {str(e)}")
            _blacklist_instance = TokenBlacklist(None)
    
    return _blacklist_instance
