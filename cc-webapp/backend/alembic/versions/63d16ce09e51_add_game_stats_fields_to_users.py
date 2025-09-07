"""add_game_stats_fields_to_users

Revision ID: 63d16ce09e51
Revises: dfc50f6893e3
Create Date: 2025-09-07 05:03:18.332760

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '63d16ce09e51'
down_revision: Union[str, None] = 'dfc50f6893e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add game statistics fields to users table."""
    # Add daily_streak field
    op.add_column('users', sa.Column('daily_streak', sa.Integer(), nullable=False, server_default='0'))
    
    # Add experience_points field
    op.add_column('users', sa.Column('experience_points', sa.Integer(), nullable=False, server_default='0'))
    
    # Add total_games_played field
    op.add_column('users', sa.Column('total_games_played', sa.Integer(), nullable=False, server_default='0'))
    
    # Add total_wins field
    op.add_column('users', sa.Column('total_wins', sa.Integer(), nullable=False, server_default='0'))
    
    # Add total_losses field
    op.add_column('users', sa.Column('total_losses', sa.Integer(), nullable=False, server_default='0'))
    
    # Add win_rate field (calculated field, stored for performance)
    op.add_column('users', sa.Column('win_rate', sa.Numeric(5, 4), nullable=False, server_default='0.0000'))
    
    # Add updated_at field if not exists
    op.add_column('users', sa.Column('updated_at', sa.TIMESTAMP(), nullable=False, server_default=sa.text('now()')))


def downgrade() -> None:
    """Remove game statistics fields from users table."""
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'win_rate')
    op.drop_column('users', 'total_losses')
    op.drop_column('users', 'total_wins')
    op.drop_column('users', 'total_games_played')
    op.drop_column('users', 'experience_points')
    op.drop_column('users', 'daily_streak')
