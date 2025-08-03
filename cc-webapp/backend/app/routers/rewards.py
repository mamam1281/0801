# cc-webapp/backend/app/routers/rewards.py
from fastapi import APIRouter, Depends, HTTPException, Query, Path

from typing import List, Any # Any might not be needed if using specific Pydantic models
from pydantic import BaseModel, ConfigDict, Field, field_serializer
from datetime import timezone
from datetime import datetime

# Assuming models and database session setup are in these locations
from .. import models  # This should import UserReward and User
from ..database import get_db
from ..services.user_service import UserService

router = APIRouter()

from ..services.reward_service import RewardService

# Pydantic model for distribution request
class RewardDistributionRequest(BaseModel):
    user_id: int
    reward_type: str
    amount: int
    source_description: str

# Pydantic model for individual reward item in the response
class RewardItem(BaseModel):
    id: int = Field(alias="reward_id")
    reward_type: str
    reward_value: str
    awarded_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @field_serializer("awarded_at")
    def serialize_awarded_at(self, dt: datetime):  # noqa: D401
        """Return ISO string with Z timezone."""
        return dt.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")

# Pydantic model for the overall response
class PaginatedRewardsResponse(BaseModel):
    rewards: List[RewardItem]
    page: int
    page_size: int
    total_rewards: int # Renamed from 'total' for clarity
    total_pages: int

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


@router.get(
    "/users/{user_id}/rewards",
    response_model=PaginatedRewardsResponse,
    tags=["users", "rewards"]
)
async def get_user_rewards(
    user_id: int = Path(..., title="The ID of the user to get rewards for", ge=1),
    page: int = Query(1, ge=1, description="Page number, 1-indexed"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    db = Depends(get_db),
    user_service: UserService = Depends(lambda db=Depends(get_db): UserService(db))
):
    """
    Retrieves a paginated list of rewards for a specific user.
    """
    # First, check if user exists (optional, but good practice for FK constraints)
    try:
        user_service.get_user_or_error(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Calculate offset
    offset = (page - 1) * page_size

    # Query for total count of rewards for the user
    total_rewards_count = db.query(models.UserReward).filter(models.UserReward.user_id == user_id).count()

    if total_rewards_count == 0:
        return PaginatedRewardsResponse(
            rewards=[],
            page=page,
            page_size=page_size,
            total_rewards=0,
            total_pages=0
        )

    total_pages = (total_rewards_count + page_size - 1) // page_size # Calculate total pages

    if offset >= total_rewards_count and page > 1 : # if page requested is beyond the total items
         raise HTTPException(
             status_code=404,
             detail=f"Page not found. Total items: {total_rewards_count}, total pages: {total_pages}. Requested page: {page}."
        )

    # Query for the paginated list of rewards
    rewards_query_result = db.query(models.UserReward).filter(
        models.UserReward.user_id == user_id
    ).order_by(
        models.UserReward.awarded_at.desc() # Order by most recent
    ).offset(offset).limit(page_size).all()

    # FastAPI will handle the conversion of rewards_query_result (list of UserReward
    # SQLAlchemy objects) to a list of RewardItem Pydantic objects because of the
    # defined response_model configuration.

    return PaginatedRewardsResponse(
        rewards=rewards_query_result,
        page=page,
        page_size=page_size,
        total_rewards=total_rewards_count,
        total_pages=total_pages
    )

@router.post("/distribute", response_model=RewardItem, tags=["rewards"])
async def distribute_reward_to_user(
    request: RewardDistributionRequest,
    db = Depends(get_db)
):
    """
    Distributes a specific reward to a user.
    This is the central endpoint for granting rewards from games or events.
    """
    reward_service = RewardService(db=db)
    try:
        user_reward = reward_service.distribute_reward(
            user_id=request.user_id,
            reward_type=request.reward_type,
            amount=request.amount,
            source_description=request.source_description
        )
        # We need to map the UserReward SQLAlchemy model to the RewardItem Pydantic model.
        # The alias in RewardItem helps, but we need to ensure all fields match.
        # Let's create a dictionary that matches the RewardItem structure.
        return {
            "reward_id": user_reward.id,
            "reward_type": user_reward.reward_type,
            "reward_value": user_reward.reward_value,
            "awarded_at": user_reward.awarded_at,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Ensure this router is included in app/main.py:
# from .routers import rewards
# app.include_router(rewards.router, prefix="/api", tags=["rewards"]) # Ensure tags are appropriate
