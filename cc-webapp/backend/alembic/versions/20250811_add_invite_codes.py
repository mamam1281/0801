"""no-op: finalize invite code adjustments (kept for chain integrity)

Revision ID: 20250811_add_invite_codes
Revises: 20250811_core_ix
Create Date: 2025-08-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
# NOTE: Alembic expects simple assignments without type annotations for parsing.
revision = '20250811_add_invite_codes'
down_revision = '20250811_core_ix'
branch_labels = None
depends_on = None


def upgrade() -> None:
	"""No-op upgrade to preserve a single linear head.

	Notes:
	- Initial schema already includes invite_codes table.
	- Users table invite_code added in 20250810_align_users.
	- Keep as a placeholder to avoid parallel heads.
	"""
	pass


def downgrade() -> None:
	"""No-op downgrade."""
	pass

