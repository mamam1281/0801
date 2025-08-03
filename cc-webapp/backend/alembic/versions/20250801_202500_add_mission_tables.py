"""add mission tables

Revision ID: 20250801_202500
Revises: 20250801_190200
Create Date: 2025-08-01 20:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20250801_202500'
down_revision: Union[str, None] = '20250801_190200'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('missions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(), nullable=False),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('mission_type', sa.String(), nullable=True),
    sa.Column('target_action', sa.String(), nullable=True),
    sa.Column('target_count', sa.Integer(), nullable=False),
    sa.Column('reward_type', sa.String(), nullable=False),
    sa.Column('reward_amount', sa.Integer(), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.Column('start_date', sa.DateTime(), nullable=True),
    sa.Column('end_date', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_missions_id'), 'missions', ['id'], unique=False)

    op.create_table('user_mission_progress',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('mission_id', sa.Integer(), nullable=False),
    sa.Column('current_count', sa.Integer(), nullable=True),
    sa.Column('is_completed', sa.Boolean(), nullable=True),
    sa.Column('is_claimed', sa.Boolean(), nullable=True),
    sa.Column('completed_at', sa.DateTime(), nullable=True),
    sa.Column('claimed_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['mission_id'], ['missions.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_mission_progress_id'), 'user_mission_progress', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_user_mission_progress_id'), table_name='user_mission_progress')
    op.drop_table('user_mission_progress')
    op.drop_index(op.f('ix_missions_id'), table_name='missions')
    op.drop_table('missions')
