"""
rev1: create shop_transactions_shadow with indexes & constraints

IMPORTANT: Generate real revision via `alembic revision -m "create shop_transactions_shadow"`.
Then copy the op.* calls below into the generated file, adjusting heads and dependencies.
"""
from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    op.create_table(
        'shop_transactions_shadow',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer, nullable=False),
        sa.Column('product_id', sa.String(100), nullable=False, index=True),
        sa.Column('kind', sa.String(20), nullable=False),
        sa.Column('quantity', sa.Integer, nullable=False, server_default='1'),
        sa.Column('unit_price', sa.Integer, nullable=False),
        sa.Column('amount', sa.Integer, nullable=False),
        sa.Column('payment_method', sa.String(50)),
        sa.Column('status', sa.String(20), nullable=False, server_default='success'),
        sa.Column('receipt_code', sa.String(64), unique=True),
        sa.Column('failure_reason', sa.String(500)),
        sa.Column('integrity_hash', sa.String(64)),
        sa.Column('original_tx_id', sa.Integer, nullable=True),
        sa.Column('receipt_signature', sa.String(128)),
        sa.Column('idempotency_key', sa.String(80)),
        sa.Column('extra', sa.JSON),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    # constraints
    op.create_unique_constraint('uq_shop_tx_user_product_idem_shadow', 'shop_transactions_shadow', ['user_id','product_id','idempotency_key'])
    # indexes
    op.create_index('ix_shop_tx_shadow_product_id', 'shop_transactions_shadow', ['product_id'])
    op.create_index('ix_shop_tx_shadow_receipt_code', 'shop_transactions_shadow', ['receipt_code'], unique=True)
    op.create_index('ix_shop_tx_shadow_integrity_hash', 'shop_transactions_shadow', ['integrity_hash'])
    op.create_index('ix_shop_tx_shadow_idempotency_key', 'shop_transactions_shadow', ['idempotency_key'])


def downgrade() -> None:
    op.drop_index('ix_shop_tx_shadow_idempotency_key', table_name='shop_transactions_shadow')
    op.drop_index('ix_shop_tx_shadow_integrity_hash', table_name='shop_transactions_shadow')
    op.drop_index('ix_shop_tx_shadow_receipt_code', table_name='shop_transactions_shadow')
    op.drop_index('ix_shop_tx_shadow_product_id', table_name='shop_transactions_shadow')
    op.drop_constraint('uq_shop_tx_user_product_idem_shadow', 'shop_transactions_shadow', type_='unique')
    op.drop_table('shop_transactions_shadow')
