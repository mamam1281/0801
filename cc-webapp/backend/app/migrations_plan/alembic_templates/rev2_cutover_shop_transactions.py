"""
rev2: cutover shop_transactions (rename shadow -> live)

Apply during low-traffic with short locks.
"""
from alembic import op


def upgrade() -> None:
    # rename live to old_ and shadow to live
    op.execute('ALTER TABLE shop_transactions RENAME TO old_shop_transactions;')
    op.execute('ALTER TABLE shop_transactions_shadow RENAME TO shop_transactions;')
    # TODO: reattach FKs, sequences, and verify defaults if needed


def downgrade() -> None:
    # rollback rename
    op.execute('ALTER TABLE shop_transactions RENAME TO shop_transactions_shadow;')
    op.execute('ALTER TABLE old_shop_transactions RENAME TO shop_transactions;')
