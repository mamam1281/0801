"""merge heads to single head (force-claim-logs, users no-op, vouchers)

Revision ID: 20250921_merge_heads_unify
Revises: 20250918_add_admin_event_force_claim_logs, 3cc7cc77afe4, fc2e8a6c11a1
Create Date: 2025-09-20 16:53:39.399346

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20250921_merge_heads_unify'
down_revision: Union[str, None] = ('20250918_add_admin_event_force_claim_logs', '3cc7cc77afe4', 'fc2e8a6c11a1')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
