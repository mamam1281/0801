"""add core indexes and unique constraints for game/activity tables

Revision ID: 20250811_core_ix
Revises: 20250810_align_users
Create Date: 2025-08-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '20250811_core_ix'
down_revision: Union[str, None] = '20250810_align_users'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Indexes for high-traffic tables
    op.create_index('ix_user_actions_user_created', 'user_actions', ['user_id', 'created_at'], unique=False)
    op.create_index('ix_user_activities_user_date', 'user_activities', ['user_id', 'activity_date'], unique=False)
    op.create_index('ix_user_rewards_user_claimed', 'user_rewards', ['user_id', 'claimed_at'], unique=False)
    op.create_index('ix_gacha_results_user_created', 'gacha_results', ['user_id', 'created_at'], unique=False)
    op.create_index('ix_user_progress_user_type', 'user_progress', ['user_id', 'progress_type'], unique=False)
    op.create_index('ix_game_sessions_user_type', 'game_sessions', ['user_id', 'game_type'], unique=False)

    # Uniqueness for per-user aggregates/limits
    op.create_unique_constraint('uq_game_stats_user_game', 'game_stats', ['user_id', 'game_type'])
    op.create_unique_constraint('uq_daily_game_limits_user_game_date', 'daily_game_limits', ['user_id', 'game_type', 'date'])


def downgrade() -> None:
    # Drop constraints first, then indexes
    with op.batch_alter_table('daily_game_limits'):
        op.drop_constraint('uq_daily_game_limits_user_game_date', type_='unique')
    with op.batch_alter_table('game_stats'):
        op.drop_constraint('uq_game_stats_user_game', type_='unique')

    op.drop_index('ix_game_sessions_user_type', table_name='game_sessions')
    op.drop_index('ix_user_progress_user_type', table_name='user_progress')
    op.drop_index('ix_gacha_results_user_created', table_name='gacha_results')
    op.drop_index('ix_user_rewards_user_claimed', table_name='user_rewards')
    op.drop_index('ix_user_activities_user_date', table_name='user_activities')
    op.drop_index('ix_user_actions_user_created', table_name='user_actions')
