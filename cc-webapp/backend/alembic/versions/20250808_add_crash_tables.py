"""add crash session tables

Revision ID: 20250808_add_crash
Revises: 79b9722f373c
Create Date: 2025-08-08
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250808_add_crash'
down_revision = '79b9722f373c'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'crash_sessions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer, nullable=False),
        sa.Column('game_id', sa.Integer, nullable=False),
        sa.Column('bet_amount', sa.Numeric(12,2), nullable=False),
        sa.Column('started_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('cashed_out_at', sa.DateTime, nullable=True),
        sa.Column('cashout_multiplier', sa.Numeric(8,2), nullable=True),
        sa.Column('payout_amount', sa.Numeric(12,2), nullable=True),
        sa.Column('status', sa.String(16), nullable=False, server_default='active'),
    )

    op.create_table(
        'crash_bets',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('session_id', sa.Integer, nullable=False),
        sa.Column('amount', sa.Numeric(12,2), nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )


def downgrade():
    op.drop_table('crash_bets')
    op.drop_table('crash_sessions')
