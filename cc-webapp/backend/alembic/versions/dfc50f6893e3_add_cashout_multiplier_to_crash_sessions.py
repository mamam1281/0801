"""add_cashout_multiplier_to_crash_sessions

Revision ID: dfc50f6893e3
Revises: c6a1b5e2e2b1
Create Date: 2025-09-06 11:56:45.526726

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dfc50f6893e3'
down_revision: Union[str, None] = 'c6a1b5e2e2b1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add cashout_multiplier column to crash_sessions table
    op.add_column('crash_sessions', sa.Column('cashout_multiplier', sa.Numeric(10, 2), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove cashout_multiplier column from crash_sessions table
    op.drop_column('crash_sessions', 'cashout_multiplier')
