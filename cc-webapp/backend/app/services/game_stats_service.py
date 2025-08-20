from __future__ import annotations
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from decimal import Decimal
from ..models.game_stats_models import UserGameStats
from ..models.history_models import GameHistory
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class GameStatsService:
    """Server-authoritative aggregated user game stats.

    Update path: call update_from_round after a round is *settled* (win or loss determined).
    Supports idempotent increment via passing a unique round identifier (future extension not yet stored).
    """
    def __init__(self, db: Session):
        self.db = db

    def get_or_create(self, user_id: int) -> UserGameStats:
        stats = self.db.get(UserGameStats, user_id)
        if stats:
            return stats
        stats = UserGameStats(user_id=user_id)
        self.db.add(stats)
        # flush to assign defaults now (no commit yet; caller decides)
        self.db.flush()
        return stats

    def update_from_round(self, *, user_id: int, bet_amount: int, win_amount: int, final_multiplier: float) -> UserGameStats:
        """Apply a single crash round result.

        bet_amount: amount wagered (positive integer)
        win_amount: amount returned (0 if loss) (positive int) -> profit = win_amount - bet_amount
        final_multiplier: achieved multiplier (>=1.0). If win, this is the cashout multiplier; if loss, the crash multiplier.
        """
        stats = self.get_or_create(user_id)
        profit = win_amount - bet_amount
        stats.total_bets = (stats.total_bets or 0) + 1
        if win_amount > 0:
            stats.total_wins = (stats.total_wins or 0) + 1
        else:
            stats.total_losses = (stats.total_losses or 0) + 1
        # highest multiplier logic: only update if larger
        try:
            if final_multiplier and final_multiplier > 0:
                if stats.highest_multiplier is None or float(final_multiplier) > float(stats.highest_multiplier):
                    stats.highest_multiplier = Decimal(str(final_multiplier))
                elif float(final_multiplier) < float(stats.highest_multiplier):
                    logger.warning("highest_multiplier regression observed user=%s final=%s stored=%s", user_id, final_multiplier, stats.highest_multiplier)
        except Exception:  # pragma: no cover
            logger.debug("highest_multiplier compare failed", exc_info=True)
        # profit accumulation
        stats.total_profit = Decimal(str(stats.total_profit or 0)) + Decimal(str(profit))
        stats.updated_at = datetime.utcnow()
        self.db.commit()
        return stats

    def recalculate_user(self, user_id: int) -> Optional[UserGameStats]:
        """Full authoritative recomputation from GameHistory for crash only (MVP).

        Current history logging stores WIN rows with positive delta_coin (net) and BET rows for losses (delta negative +win_amount 0).
        We infer losses = bets - wins. Profit is simply sum(delta_coin) (wins add net positive, bets subtract wager).
        """
        q = (
            self.db.query(
                func.sum(func.case((GameHistory.action_type == 'BET', 1), else_=0)).label('bet_rows'),
                func.sum(func.case((GameHistory.action_type == 'WIN', 1), else_=0)).label('win_rows'),
                func.coalesce(func.sum(GameHistory.delta_coin), 0).label('delta_sum'),
            )
            .filter(GameHistory.user_id == user_id, GameHistory.game_type == 'crash')
        )
        row = q.one()
        bets = int(row.bet_rows or 0)
        wins = int(row.win_rows or 0)
        losses = max(0, bets - wins)
        delta_sum = int(row.delta_sum or 0)
        stats = self.get_or_create(user_id)
        stats.total_bets = bets
        stats.total_wins = wins
        stats.total_losses = losses
        stats.total_profit = Decimal(str(delta_sum))
        # highest_multiplier cannot be recomputed without multiplier in history -> leave as-is
        stats.updated_at = datetime.utcnow()
        self.db.commit()
        return stats
