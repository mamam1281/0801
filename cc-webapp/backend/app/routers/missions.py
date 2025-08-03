from fastapi import APIRouter, Depends, HTTPException

from typing import List

from ..services.mission_service import MissionService
from ..database import get_db
# from .auth import get_current_user # Assuming an auth dependency

router = APIRouter(
    prefix="/missions",
    tags=["missions"],
)

def get_mission_service(db = Depends(get_db)) -> MissionService:
    return MissionService(db)

@router.get("/")
def get_user_missions(
    mission_service: MissionService = Depends(get_mission_service),
    # current_user: models.User = Depends(get_current_user)
):
    """
    Get the list of active missions and the current user's progress.
    """
    user_id = 1 # Placeholder for current_user.id
    return mission_service.list_user_missions(user_id=user_id)

@router.post("/{mission_id}/claim")
def claim_mission_reward(
    mission_id: int,
    mission_service: MissionService = Depends(get_mission_service),
    # current_user: models.User = Depends(get_current_user)
):
    """
    Claim the reward for a completed mission.
    """
    user_id = 1 # Placeholder for current_user.id
    try:
        user_reward = mission_service.claim_reward(user_id=user_id, mission_id=mission_id)
        return {"message": "Reward claimed successfully!", "reward_id": user_reward.id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
