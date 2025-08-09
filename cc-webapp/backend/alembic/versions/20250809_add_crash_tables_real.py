"""create crash_sessions and crash_bets tables

Revision ID: 20250809_add_crash_real
Revises: f79d04ea1016
Create Date: 2025-08-09

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '20250809_add_crash_real'
down_revision: Union[str, None] = 'f79d04ea1016'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # crash_sessions: one row per crash game session per user
    op.create_table(
        'crash_sessions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('external_session_id', sa.String(length=64), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('bet_amount', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=16), nullable=False, server_default='active'),
        sa.Column('auto_cashout_multiplier', sa.Numeric(6, 2), nullable=True),
        sa.Column('actual_multiplier', sa.Numeric(6, 2), nullable=True),
        sa.Column('win_amount', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('cashed_out_at', sa.DateTime(), nullable=True),
    )
    op.create_unique_constraint('uq_crash_sessions_external_id', 'crash_sessions', ['external_session_id'])
    op.create_index('ix_crash_sessions_user_id', 'crash_sessions', ['user_id'])
    op.create_index('ix_crash_sessions_status', 'crash_sessions', ['status'])

    # crash_bets: optional extension to track payouts/cashouts separate from session
    op.create_table(
        'crash_bets',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('session_id', sa.Integer(), sa.ForeignKey('crash_sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('bet_amount', sa.Integer(), nullable=False),
        sa.Column('payout_amount', sa.Integer(), nullable=True),
        sa.Column('cashout_multiplier', sa.Numeric(6, 2), nullable=True),
        sa.Column('status', sa.String(length=16), nullable=False, server_default='placed'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('cashed_out_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_crash_bets_session_id', 'crash_bets', ['session_id'])
    op.create_index('ix_crash_bets_user_id', 'crash_bets', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_crash_bets_user_id', table_name='crash_bets')
    op.drop_index('ix_crash_bets_session_id', table_name='crash_bets')
    op.drop_table('crash_bets')
    op.drop_index('ix_crash_sessions_status', table_name='crash_sessions')
    op.drop_index('ix_crash_sessions_user_id', table_name='crash_sessions')
    op.drop_constraint('uq_crash_sessions_external_id', 'crash_sessions', type_='unique')
    op.drop_table('crash_sessions')
