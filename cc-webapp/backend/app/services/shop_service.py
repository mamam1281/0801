from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime

from .. import models
from .token_service import TokenService

class ShopService:
    def __init__(self, db: Session, token_service: TokenService | None = None):
        self.db = db
        self.token_service = token_service or TokenService(db)

    def purchase_item(self, user_id: int, item_id: int, item_name: str, price: int, description: str | None) -> Dict[str, Any]:
        """
        Handles the logic for a user purchasing an item from the shop.
        """
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        if user.cyber_token_balance < price:
            return {
                "success": False,
                "message": "토큰이 부족합니다.",
                "new_balance": user.cyber_token_balance,
            }

        # Deduct tokens using the service
        self.token_service.deduct_tokens(user_id, price)

        # Create a reward record for the purchased item
        reward = models.UserReward(
            user_id=user.id,
            reward_type="SHOP_ITEM",
            reward_value=str(item_id),
            awarded_at=datetime.utcnow(),
            source_description=f"{item_name}: {description or ''}"
        )
        self.db.add(reward)
        self.db.commit()

        # Get the new count of the purchased item
        item_count = self.db.query(models.UserReward).filter(
            models.UserReward.user_id == user.id,
            models.UserReward.reward_type == "SHOP_ITEM",
            models.UserReward.reward_value == str(item_id)
        ).count()

        new_balance = self.token_service.get_token_balance(user_id)

        return {
            "success": True,
            "message": f"{item_name} 구매 성공!",
            "new_balance": new_balance,
            "item_id": item_id,
            "item_name": item_name,
            "new_item_count": item_count,
        }
