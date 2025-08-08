"""harden crash tables and add useful indexes

Revision ID: 20250808b_harden_crash
Revises: 20250808_add_crash
Create Date: 2025-08-08
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250808b_harden_crash'
down_revision = '20250808_add_crash'
branch_labels = None
depends_on = None

def upgrade():
    # crash_sessions: add check constraints and more indexes
    op.create_check_constraint(
        'ck_crash_sessions_status',
        'crash_sessions',
        "status in ('active','cashed','expired')"
    )
    op.create_check_constraint(
        'ck_crash_sessions_bet_amount_nonneg',
        'crash_sessions',
        'bet_amount >= 0'
    )
    # useful composite index for admin queries
    op.create_index('ix_crash_sessions_user_status', 'crash_sessions', ['user_id','status'])
    op.create_index('ix_crash_sessions_started_at', 'crash_sessions', ['started_at'])

    # user_actions: fast filters on user and type/time
    op.create_index('ix_user_actions_user_id', 'user_actions', ['user_id'])
    op.create_index('ix_user_actions_type_created', 'user_actions', ['action_type','created_at'])

    # user_rewards: fast filters on user and claimed flag
    with op.batch_alter_table('user_rewards') as batch_op:
        # some schemas might not have is_used/claimed_at; if missing, ignore safely
        try:
            batch_op.create_index('ix_user_rewards_user_id', ['user_id'])
        except Exception:
            pass
        try:
            batch_op.create_index('ix_user_rewards_used', ['is_used'])
        except Exception:
            pass


def downgrade():
    # user_rewards
    try:
        op.drop_index('ix_user_rewards_used', table_name='user_rewards')
    except Exception:
        pass
    try:
        op.drop_index('ix_user_rewards_user_id', table_name='user_rewards')
    except Exception:
        pass

    # user_actions
    op.drop_index('ix_user_actions_type_created', table_name='user_actions')
    op.drop_index('ix_user_actions_user_id', table_name='user_actions')

    # crash_sessions
    op.drop_index('ix_crash_sessions_started_at', table_name='crash_sessions')
    op.drop_index('ix_crash_sessions_user_status', table_name='crash_sessions')
    op.drop_constraint('ck_crash_sessions_bet_amount_nonneg', 'crash_sessions', type_='check')
    op.drop_constraint('ck_crash_sessions_status', 'crash_sessions', type_='check')
