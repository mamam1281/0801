"""create shop_transactions_shadow

Revision ID: 9043e151c7b9
Revises: 9dbe94486d67
Create Date: 2025-08-23 04:50:43.703276

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9043e151c7b9'
down_revision: Union[str, None] = '9dbe94486d67'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    Creates shop_transactions_shadow with required indexes/constraints and
    installs a replication trigger on shop_transactions to keep shadow in sync.
    """
    op.create_table(
        'shop_transactions_shadow',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer, nullable=False),
        sa.Column('product_id', sa.String(100), nullable=False),
        sa.Column('kind', sa.String(20), nullable=False),
        sa.Column('quantity', sa.Integer, nullable=False, server_default='1'),
        sa.Column('unit_price', sa.Integer, nullable=False),
        sa.Column('amount', sa.Integer, nullable=False),
        sa.Column('payment_method', sa.String(50)),
        sa.Column('status', sa.String(20), nullable=False, server_default='success'),
        sa.Column('receipt_code', sa.String(64), nullable=True),
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
    op.create_unique_constraint(
        'uq_shop_tx_user_product_idem_shadow',
        'shop_transactions_shadow',
        ['user_id', 'product_id', 'idempotency_key']
    )

    # indexes
    op.create_index('ix_shop_tx_shadow_product_id', 'shop_transactions_shadow', ['product_id'])
    op.create_index('ix_shop_tx_shadow_receipt_code', 'shop_transactions_shadow', ['receipt_code'], unique=True)
    op.create_index('ix_shop_tx_shadow_integrity_hash', 'shop_transactions_shadow', ['integrity_hash'])
    op.create_index('ix_shop_tx_shadow_idempotency_key', 'shop_transactions_shadow', ['idempotency_key'])

    # replication trigger function and trigger to keep shadow in sync
    op.execute(
        sa.text(
            """
            CREATE OR REPLACE FUNCTION shop_tx_shadow_replica()
            RETURNS trigger AS $$
            BEGIN
              IF TG_OP = 'INSERT' THEN
                INSERT INTO shop_transactions_shadow (
                    id, user_id, product_id, kind, quantity, unit_price, amount,
                    payment_method, status, receipt_code, failure_reason,
                    integrity_hash, original_tx_id, receipt_signature,
                    idempotency_key, extra, created_at, updated_at
                ) VALUES (
                    NEW.id, NEW.user_id, NEW.product_id, NEW.kind, NEW.quantity,
                    NEW.unit_price, NEW.amount, NEW.payment_method, NEW.status,
                    NEW.receipt_code, NEW.failure_reason, NEW.integrity_hash,
                    NEW.original_tx_id, NEW.receipt_signature, NEW.idempotency_key,
                    NEW.extra, NEW.created_at, NEW.updated_at
                )
                ON CONFLICT (id) DO UPDATE SET
                    user_id = EXCLUDED.user_id,
                    product_id = EXCLUDED.product_id,
                    kind = EXCLUDED.kind,
                    quantity = EXCLUDED.quantity,
                    unit_price = EXCLUDED.unit_price,
                    amount = EXCLUDED.amount,
                    payment_method = EXCLUDED.payment_method,
                    status = EXCLUDED.status,
                    receipt_code = EXCLUDED.receipt_code,
                    failure_reason = EXCLUDED.failure_reason,
                    integrity_hash = EXCLUDED.integrity_hash,
                    original_tx_id = EXCLUDED.original_tx_id,
                    receipt_signature = EXCLUDED.receipt_signature,
                    idempotency_key = EXCLUDED.idempotency_key,
                    extra = EXCLUDED.extra,
                    created_at = EXCLUDED.created_at,
                    updated_at = EXCLUDED.updated_at;
              ELSIF TG_OP = 'UPDATE' THEN
                UPDATE shop_transactions_shadow SET
                    user_id = NEW.user_id,
                    product_id = NEW.product_id,
                    kind = NEW.kind,
                    quantity = NEW.quantity,
                    unit_price = NEW.unit_price,
                    amount = NEW.amount,
                    payment_method = NEW.payment_method,
                    status = NEW.status,
                    receipt_code = NEW.receipt_code,
                    failure_reason = NEW.failure_reason,
                    integrity_hash = NEW.integrity_hash,
                    original_tx_id = NEW.original_tx_id,
                    receipt_signature = NEW.receipt_signature,
                    idempotency_key = NEW.idempotency_key,
                    extra = NEW.extra,
                    created_at = NEW.created_at,
                    updated_at = NEW.updated_at
                WHERE id = NEW.id;
              ELSIF TG_OP = 'DELETE' THEN
                DELETE FROM shop_transactions_shadow WHERE id = OLD.id;
              END IF;
              RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;

            DROP TRIGGER IF EXISTS trg_shop_tx_shadow_replica ON shop_transactions;
            CREATE TRIGGER trg_shop_tx_shadow_replica
            AFTER INSERT OR UPDATE OR DELETE ON shop_transactions
            FOR EACH ROW EXECUTE FUNCTION shop_tx_shadow_replica();
            """
        )
    )

def downgrade() -> None:
    """Downgrade schema."""
    # drop trigger and function first
    op.execute(sa.text("DROP TRIGGER IF EXISTS trg_shop_tx_shadow_replica ON shop_transactions;"))
    op.execute(sa.text("DROP FUNCTION IF EXISTS shop_tx_shadow_replica();"))

    # drop indexes/constraints and table
    op.drop_index('ix_shop_tx_shadow_idempotency_key', table_name='shop_transactions_shadow')
    op.drop_index('ix_shop_tx_shadow_integrity_hash', table_name='shop_transactions_shadow')
    op.drop_index('ix_shop_tx_shadow_receipt_code', table_name='shop_transactions_shadow')
    op.drop_index('ix_shop_tx_shadow_product_id', table_name='shop_transactions_shadow')
    op.drop_constraint('uq_shop_tx_user_product_idem_shadow', 'shop_transactions_shadow', type_='unique')
    op.drop_table('shop_transactions_shadow')
