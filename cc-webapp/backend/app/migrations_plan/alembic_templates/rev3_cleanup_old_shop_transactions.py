"""
rev3: drop old_shop_transactions after observation window
"""
from alembic import op


def upgrade() -> None:
    op.execute('DROP TABLE IF EXISTS old_shop_transactions;')


def downgrade() -> None:
    # No-op: cannot undelete safely; documented as non-reversible
    pass
