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
        sa.Column('external_session_id', sa.String(64), nullable=False, unique=True, index=True),
        sa.Column('user_id', sa.Integer, nullable=False),
        sa.Column('game_id', sa.Integer, nullable=False),
        sa.Column('bet_amount', sa.Numeric(12,2), nullable=False),
        sa.Column('started_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('cashed_out_at', sa.DateTime, nullable=True),
        sa.Column('cashout_multiplier', sa.Numeric(8,2), nullable=True),
        sa.Column('payout_amount', sa.Numeric(12,2), nullable=True),
        sa.Column('status', sa.String(16), nullable=False, server_default='active'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_crash_sessions_user_id_users', ondelete='CASCADE'),
    )

    op.create_index('ix_crash_sessions_user_id', 'crash_sessions', ['user_id'])
    op.create_index('ix_crash_sessions_status', 'crash_sessions', ['status'])

    op.create_table(
        'crash_bets',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('session_id', sa.Integer, nullable=False),
        sa.Column('amount', sa.Numeric(12,2), nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['session_id'], ['crash_sessions.id'], name='fk_crash_bets_session_id_crash_sessions', ondelete='CASCADE'),
    )
    op.create_index('ix_crash_bets_session_id', 'crash_bets', ['session_id'])


def downgrade():
    op.drop_index('ix_crash_bets_session_id', table_name='crash_bets')
    op.drop_table('crash_bets')
    op.drop_index('ix_crash_sessions_status', table_name='crash_sessions')
    op.drop_index('ix_crash_sessions_user_id', table_name='crash_sessions')
    op.drop_table('crash_sessions')
