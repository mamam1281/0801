"""cutover shop_transactions_shadow

Revision ID: be6edf74183a
Revises: 9043e151c7b9
Create Date: 2025-08-23 10:47:09.986647

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'be6edf74183a'
down_revision: Union[str, None] = '9043e151c7b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
        """Upgrade schema: cutover shadow -> main with safe renames, drop replica trigger."""
        # 0) Drop replica trigger/function if present (no longer needed post-cutover)
        op.execute(sa.text("DROP TRIGGER IF EXISTS trg_shop_tx_shadow_replica ON shop_transactions;"))
        op.execute(sa.text("DROP FUNCTION IF EXISTS shop_tx_shadow_replica();"))

        # 1) Rename current main to backup, and shadow to main
        op.execute(sa.text("ALTER TABLE IF EXISTS shop_transactions RENAME TO shop_transactions_old;"))
        op.execute(sa.text("ALTER TABLE shop_transactions_shadow RENAME TO shop_transactions;"))

        # 2) Resolve name conflicts: free canonical names on backup, then assign canonical names on new main
        # 2-1) On backup(old): rename canonical constraint to *_old if it exists
        op.execute(
                sa.text(
                        """
                        DO $$
                        BEGIN
                                IF EXISTS (
                                        SELECT 1 FROM pg_constraint c
                                        JOIN pg_class t ON t.oid = c.conrelid
                                        WHERE t.relname = 'shop_transactions_old'
                                          AND c.conname = 'uq_shop_tx_user_product_idem'
                                ) THEN
                                        ALTER TABLE shop_transactions_old RENAME CONSTRAINT uq_shop_tx_user_product_idem
                                        TO uq_shop_tx_user_product_idem_old;
                                END IF;
                        END$$;
                        """
                )
        )

        # 2-1b) On backup(old): rename canonical indexes to *_old to free names
        op.execute(sa.text("ALTER INDEX IF EXISTS ix_shop_tx_product_id RENAME TO ix_shop_tx_product_id_old;"))
        op.execute(sa.text("ALTER INDEX IF EXISTS ix_shop_tx_receipt_code RENAME TO ix_shop_tx_receipt_code_old;"))
        op.execute(sa.text("ALTER INDEX IF EXISTS ix_shop_tx_integrity_hash RENAME TO ix_shop_tx_integrity_hash_old;"))
        op.execute(sa.text("ALTER INDEX IF EXISTS ix_shop_tx_idempotency_key RENAME TO ix_shop_tx_idempotency_key_old;"))

        # 2-2) On new main: rename shadow constraint to canonical name
        op.execute(
                sa.text(
                        """
                        DO $$
                        BEGIN
                                IF EXISTS (
                                        SELECT 1 FROM pg_constraint c
                                        JOIN pg_class t ON t.oid = c.conrelid
                                        WHERE t.relname = 'shop_transactions'
                                          AND c.conname = 'uq_shop_tx_user_product_idem_shadow'
                                ) THEN
                                        ALTER TABLE shop_transactions RENAME CONSTRAINT uq_shop_tx_user_product_idem_shadow
                                        TO uq_shop_tx_user_product_idem;
                                END IF;
                        END$$;
                        """
                )
        )

        # 3) Rename indexes to non-shadow names (if they exist after table rename)
        op.execute(sa.text("ALTER INDEX IF EXISTS ix_shop_tx_shadow_product_id RENAME TO ix_shop_tx_product_id;"))
        op.execute(sa.text("ALTER INDEX IF EXISTS ix_shop_tx_shadow_receipt_code RENAME TO ix_shop_tx_receipt_code;"))
        op.execute(sa.text("ALTER INDEX IF EXISTS ix_shop_tx_shadow_integrity_hash RENAME TO ix_shop_tx_integrity_hash;"))
        op.execute(sa.text("ALTER INDEX IF EXISTS ix_shop_tx_shadow_idempotency_key RENAME TO ix_shop_tx_idempotency_key;"))


def downgrade() -> None:
        """Downgrade schema: revert cutover, restore trigger/function."""
        # 0) Rename indexes back to shadow names if present
        op.execute(sa.text("ALTER INDEX IF EXISTS ix_shop_tx_product_id RENAME TO ix_shop_tx_shadow_product_id;"))
        op.execute(sa.text("ALTER INDEX IF EXISTS ix_shop_tx_receipt_code RENAME TO ix_shop_tx_shadow_receipt_code;"))
        op.execute(sa.text("ALTER INDEX IF EXISTS ix_shop_tx_integrity_hash RENAME TO ix_shop_tx_shadow_integrity_hash;"))
        op.execute(sa.text("ALTER INDEX IF EXISTS ix_shop_tx_idempotency_key RENAME TO ix_shop_tx_shadow_idempotency_key;"))

        # 1) Rename constraint back if needed
        op.execute(
                sa.text(
                        """
                        DO $$
                        BEGIN
                                IF EXISTS (
                                        SELECT 1 FROM pg_constraint c
                                        JOIN pg_class t ON t.oid = c.conrelid
                                        WHERE t.relname = 'shop_transactions'
                                          AND c.conname = 'uq_shop_tx_user_product_idem'
                                ) THEN
                                        ALTER TABLE shop_transactions RENAME CONSTRAINT uq_shop_tx_user_product_idem
                                        TO uq_shop_tx_user_product_idem_shadow;
                                END IF;
                        END$$;
                        """
                )
        )

        # 2) Rename tables back (main -> shadow, backup -> main)
        op.execute(sa.text("ALTER TABLE shop_transactions RENAME TO shop_transactions_shadow;"))
        op.execute(sa.text("ALTER TABLE IF EXISTS shop_transactions_old RENAME TO shop_transactions;"))

        # 2-1) On restored main: rename *_old constraint back to canonical, if present
        op.execute(
                sa.text(
                        """
                        DO $$
                        BEGIN
                                IF EXISTS (
                                        SELECT 1 FROM pg_constraint c
                                        JOIN pg_class t ON t.oid = c.conrelid
                                        WHERE t.relname = 'shop_transactions'
                                          AND c.conname = 'uq_shop_tx_user_product_idem_old'
                                ) THEN
                                        ALTER TABLE shop_transactions RENAME CONSTRAINT uq_shop_tx_user_product_idem_old
                                        TO uq_shop_tx_user_product_idem;
                                END IF;
                        END$$;
                        """
                )
        )

        # 2-1b) On restored main: rename *_old indexes back to canonical names if present
        op.execute(sa.text("ALTER INDEX IF EXISTS ix_shop_tx_product_id_old RENAME TO ix_shop_tx_product_id;"))
        op.execute(sa.text("ALTER INDEX IF EXISTS ix_shop_tx_receipt_code_old RENAME TO ix_shop_tx_receipt_code;"))
        op.execute(sa.text("ALTER INDEX IF EXISTS ix_shop_tx_integrity_hash_old RENAME TO ix_shop_tx_integrity_hash;"))
        op.execute(sa.text("ALTER INDEX IF EXISTS ix_shop_tx_idempotency_key_old RENAME TO ix_shop_tx_idempotency_key;"))

        # 3) Restore replica trigger/function (for pre-cutover state)
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
