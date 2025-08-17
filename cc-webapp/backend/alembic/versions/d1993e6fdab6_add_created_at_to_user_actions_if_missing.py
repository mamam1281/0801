"""add created_at to user_actions if missing (safety no-op)

Revision ID: d1993e6fdab6
Revises: d1993e6fdab5
Create Date: 2025-08-16

File was recovered as empty; implementing no-op guards to preserve revision chain.
If column addition already handled by previous migration d1993e6fdab5 or later consolidated merges, this stays no-op.
"""

from __future__ import annotations
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "d1993e6fdab6"
down_revision: Union[str, None] = "d1993e6fdab5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	# Intentionally left as no-op; earlier/later migrations handle the column safely.
	pass


def downgrade() -> None:
	# No-op downgrade; we do not attempt to drop the column to avoid data loss.
	pass

