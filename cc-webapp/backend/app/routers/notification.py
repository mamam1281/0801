# cc-webapp/backend/app/routers/notification.py
from fastapi import APIRouter, Depends, HTTPException, Path

from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

from .. import models
from ..database import get_db
from ..services.notification_service import NotificationService
from ..services.user_service import UserService

router = APIRouter()

# Dependency provider for NotificationService
def get_notification_service(db = Depends(get_db)):
    return NotificationService(db=db)

# Dependency provider for UserService
def get_user_service(db = Depends(get_db)):
    return UserService(db)

# Pydantic model for the pending notification response
class PendingNotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: Optional[int] = None
    message: Optional[str] = None
    created_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None


@router.get(
    "/notification/pending/{user_id}", # Path maintained from original
    response_model=PendingNotificationResponse,
    tags=["notification"]
)
async def get_pending_notification(
    user_id: int = Path(..., title="The ID of the user to check for pending notifications", ge=1),
    service: NotificationService = Depends(get_notification_service),
    user_service: UserService = Depends(get_user_service)
):
    """
    Retrieves the oldest pending notification for a user, marks it as sent,
    and returns its details. If no pending notifications, returns empty object or specific fields as None.
    """
    try:
        user_service.get_user_or_error(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    notification = service.get_oldest_pending_notification(user_id=user_id)

    if not notification:
        # Return a response indicating no pending notification found
        # Based on the Pydantic model, all fields are Optional, so an empty call works
        return PendingNotificationResponse()

    # If service might raise an error that should be propagated as HTTP error:
    # try:
    #     notification = service.get_oldest_pending_notification(user_id=user_id)
    # except SomeServiceSpecificException as e:
    #     raise HTTPException(status_code=400, detail=str(e))

    # The service now handles committing and refreshing.
    # The router just needs to return the data.
    return PendingNotificationResponse.model_validate(notification) # Pydantic V2

# Example of how to create a notification (optional, for testing or direct use if needed)
# class NotificationCreateRequest(BaseModel):
#     user_id: int
#     message: str
#     notification_type: Optional[str] = "general"

# @router.post("/notification/create", response_model=PendingNotificationResponse, tags=["notification"])
# async def create_new_notification(
#     request: NotificationCreateRequest,
#     service: NotificationService = Depends(get_notification_service)
# ):
#     try:
#         notification = service.create_notification(
#             user_id=request.user_id,
#             message=request.message
#             # notification_type=request.notification_type # If model and service support it
#         )
#         return PendingNotificationResponse.from_orm(notification)
#     except Exception as e:
#         # Handle specific exceptions from service if any (e.g., user not found if service checked)
#         raise HTTPException(status_code=500, detail=f"Failed to create notification: {str(e)}")


# Ensure this router is included in app/main.py:
# from .routers import notification
# app.include_router(notification.router, prefix="/api", tags=["notification"])
# This should already be done.
