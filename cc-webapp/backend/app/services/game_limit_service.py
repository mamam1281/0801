from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
from sqlalchemy.orm import Session

from app.models.game_limits import UserGameLimit
from app.core.config import settings

class GameLimitService:
    """Service to manage game play limits for users"""
    
    # Default game limits by type
    DEFAULT_LIMITS = {
        "slot": 30,   # Slot machine: 30 plays/day
        "crash": 15,  # Crash game: 15 plays/day
        "rps": 3,     # Rock-paper-scissors: 3 plays/day for regular, 5 for VIP
        "gacha": 3    # Gacha system: 3 plays/day for regular, 5 for VIP
    }
    
    # Games with special VIP limits
    VIP_EXTRA_LIMITS = {
        "rps": 5,     # 5 instead of 3
        "gacha": 5    # 5 instead of 3
    }
    
    @staticmethod
    def get_user_limit(db: Session, user_id: str, game_type: str, is_vip: bool = False) -> UserGameLimit:
        """Get or create game limit record for user"""
        
        # Try to find existing limit
        limit = db.query(UserGameLimit).filter(
            UserGameLimit.user_id == user_id,
            UserGameLimit.game_type == game_type
        ).first()
        
        if not limit:
            # Create new limit with default values
            daily_max = GameLimitService.VIP_EXTRA_LIMITS.get(game_type, GameLimitService.DEFAULT_LIMITS.get(game_type, 0)) if is_vip else GameLimitService.DEFAULT_LIMITS.get(game_type, 0)
            
            limit = UserGameLimit(
                id=f"limit_{uuid.uuid4().hex[:8]}",
                user_id=user_id,
                game_type=game_type,
                daily_max=daily_max,
                daily_used=0,
                last_reset=datetime.utcnow()
            )
            db.add(limit)
            db.commit()
            db.refresh(limit)
        
        # Check if we need to reset (new day)
        if limit.needs_reset:
            limit.reset_count()
            db.commit()
            db.refresh(limit)
            
        return limit
    
    @staticmethod
    def use_game_play(db: Session, user_id: str, game_type: str, is_vip: bool = False) -> Dict[str, Any]:
        """
        Use one game play if available
        Returns dict with success status and remaining plays
        """
        limit = GameLimitService.get_user_limit(db, user_id, game_type, is_vip)
        
        if limit.remaining <= 0:
            return {
                "success": False, 
                "remaining": 0, 
                "error": "Daily limit reached",
                "reset_time": (datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) + 
                               timedelta(days=1)).isoformat()
            }
            
        remaining = limit.use_play()
        db.commit()
        
        return {
            "success": True,
            "remaining": remaining,
            "max": limit.daily_max
        }
        
    @staticmethod
    def get_all_user_limits(db: Session, user_id: str, is_vip: bool = False) -> Dict[str, Any]:
        """Get all game limits for a user"""
        limits = {}
        
        # Ensure we have entries for all game types
        for game_type in GameLimitService.DEFAULT_LIMITS.keys():
            limit = GameLimitService.get_user_limit(db, user_id, game_type, is_vip)
            limits[game_type] = {
                "max": limit.daily_max,
                "remaining": limit.remaining,
                "used": limit.daily_used
            }
            
        reset_time = (datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) + 
                     timedelta(days=1)).isoformat()
                     
        return {
            "user_id": user_id,
            "daily_limits": limits,
            "vip_status": is_vip,
            "reset_time": reset_time
        }
