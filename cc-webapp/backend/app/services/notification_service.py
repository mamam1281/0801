from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app import models


class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def get_oldest_pending_notification(self, user_id: int) -> Optional[models.Notification]:
        """
        Retrieves the oldest pending notification for a user, marks it as sent,
        and returns it.
        """
        try:
            notification = (
                self.db.query(models.Notification)
                .filter(
                    models.Notification.user_id == user_id,
                    models.Notification.is_sent == False,
                )
                .order_by(models.Notification.created_at.asc())
                .first()
            )

            if notification:
                notification.is_sent = True
                notification.sent_at = datetime.utcnow().replace(tzinfo=timezone.utc)
                self.db.commit()
                self.db.refresh(notification)
                return notification
            return None
        except SQLAlchemyError as e:
            # Log the error e.g., logging.error(f"Database error in get_oldest_pending_notification: {e}")
            self.db.rollback()
            # Depending on policy, you might want to raise a custom service exception
            # or return None and let the caller handle it.
            # For now, re-raising.
            # Consider specific exception handling for different error types if necessary.
            raise e # Re-raise the exception after rollback

    def create_notification(
        self, user_id: int, message: str # Removed notification_type default arg
    ) -> models.Notification:
        """
        Creates a new notification for a user.
        """
        db_notification = models.Notification(
            user_id=user_id,
            message=message,
            is_sent=False,
            created_at=datetime.utcnow().replace(tzinfo=timezone.utc),
        )

        try:
            self.db.add(db_notification)
            self.db.commit()
            self.db.refresh(db_notification)
            return db_notification
        except SQLAlchemyError as e:
            # Log the error
            self.db.rollback()
            # Raise a custom service exception or handle as per application policy
            raise # Re-raising for now, or transform into a service-specific exception.

    # Potential future method for batch creation or more complex logic
    # def create_notifications_batch(self, notifications_data: List[Dict]) -> List[models.Notification]:
    #     pass

    # Potential future method for marking as read (distinct from sent, if UI supports it)
    # def mark_notification_as_read(self, notification_id: int, user_id: int) -> Optional[models.Notification]:
    #     pass
