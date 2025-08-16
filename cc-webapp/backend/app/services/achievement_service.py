from __future__ import annotations

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from datetime import datetime

from ..models.achievement_models import Achievement, UserAchievement
from ..models.history_models import GameHistory
from ..models.notification_models import Notification
from ..realtime.hub import hub


class AchievementService:
    """Service layer for achievements evaluation and retrieval."""

    def __init__(self, db: Session):
        self.db = db

    def list_active(self) -> List[Achievement]:
        return self.db.scalars(select(Achievement).where(Achievement.is_active == True)).all()  # noqa: E712

    def user_progress(self, user_id: int) -> List[Dict[str, Any]]:
        ach_map = {a.id: a for a in self.list_active()}
        ua_rows = self.db.scalars(select(UserAchievement).where(UserAchievement.user_id == user_id)).all()
        response = []
        for a in ach_map.values():
            ua = next((r for r in ua_rows if r.achievement_id == a.id), None)
            progress_val = ua.progress_value if ua else 0
            unlocked = bool(ua and ua.is_unlocked)
            threshold = a.condition.get("threshold") if isinstance(a.condition, dict) else None
            response.append({
                "code": a.code,
                "title": a.title,
                "description": a.description,
                "icon": a.icon,
                "badge_color": a.badge_color,
                "reward_coins": a.reward_coins,
                "reward_gems": a.reward_gems,
                "progress": progress_val,
                "threshold": threshold,
                "unlocked": unlocked,
            })
        return response

    def evaluate_after_history(self, history: GameHistory) -> List[str]:
        """Evaluate achievements based on a new GameHistory record.

        Returns list of unlocked achievement codes.
        """
        unlocked_codes: List[str] = []
        active = self.list_active()
        for ach in active:
            cond = ach.condition if isinstance(ach.condition, dict) else {}
            ach_type = cond.get("type")
            if not ach_type:
                continue
            if ach_type == "CUMULATIVE_BET":
                if cond.get("game_type") and cond.get("game_type") != history.game_type:
                    continue
                threshold = cond.get("threshold", 0)
                total_bet = self._aggregate_user_bet(history.user_id, cond.get("game_type"))
                unlocked = total_bet >= threshold
                progress_val = total_bet
            elif ach_type == "TOTAL_WIN_AMOUNT":
                if cond.get("game_type") and cond.get("game_type") != history.game_type:
                    continue
                threshold = cond.get("threshold", 0)
                total_win = self._aggregate_user_win(history.user_id, cond.get("game_type"))
                unlocked = total_win >= threshold
                progress_val = total_win
            elif ach_type == "WIN_STREAK":
                if cond.get("game_type") and cond.get("game_type") != history.game_type:
                    continue
                threshold = cond.get("threshold", 0)
                streak = self._current_win_streak(history.user_id, cond.get("game_type"))
                unlocked = streak >= threshold
                progress_val = streak
            else:
                continue

            ua = self.db.scalar(select(UserAchievement).where(UserAchievement.user_id == history.user_id, UserAchievement.achievement_id == ach.id))
            if ua is None:
                ua = UserAchievement(user_id=history.user_id, achievement_id=ach.id, progress_value=progress_val, is_unlocked=False)
                self.db.add(ua)
            else:
                ua.progress_value = progress_val

            if not ua.is_unlocked and unlocked:
                ua.is_unlocked = True
                ua.unlocked_at = datetime.utcnow()
                unlocked_codes.append(ach.code)
                notif = Notification(
                    user_id=history.user_id,
                    title=f"Achievement Unlocked: {ach.title}",
                    message=ach.description or ach.code,
                    notification_type="achievement_unlock",
                    related_code=ach.code,
                )
                self.db.add(notif)
                hub.broadcast(history.user_id, {
                    "type": "achievement_unlock",
                    "code": ach.code,
                    "title": ach.title,
                    "reward_coins": ach.reward_coins,
                    "reward_gems": ach.reward_gems,
                })
        return unlocked_codes

    def _aggregate_user_bet(self, user_id: int, game_type: str | None) -> int:
        stmt = select(func.sum(GameHistory.delta_coin)).where(GameHistory.user_id == user_id, GameHistory.action_type == 'BET')
        if game_type:
            stmt = stmt.where(GameHistory.game_type == game_type)
        val = self.db.execute(stmt).scalar() or 0
        return int(val)

    def _aggregate_user_win(self, user_id: int, game_type: str | None) -> int:
        stmt = select(func.sum(GameHistory.delta_coin)).where(GameHistory.user_id == user_id, GameHistory.action_type == 'WIN')
        if game_type:
            stmt = stmt.where(GameHistory.game_type == game_type)
        val = self.db.execute(stmt).scalar() or 0
        return int(val)

    def _current_win_streak(self, user_id: int, game_type: str | None) -> int:
        q = select(GameHistory.action_type, GameHistory.game_type).where(GameHistory.user_id == user_id).order_by(GameHistory.created_at.desc()).limit(100)
        rows = self.db.execute(q).all()
        streak = 0
        for action_type, gtype in rows:
            if action_type != 'WIN':
                break
            if game_type and gtype != game_type:
                break
            streak += 1
        return streak
