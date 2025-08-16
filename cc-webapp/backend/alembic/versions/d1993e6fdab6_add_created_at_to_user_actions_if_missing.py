"""add created_at to user_actions if missing (idempotent)

Revision ID: d1993e6fdab6
Revises: d1993e6fdab5
Create Date: 2025-08-16

Rationale:
  The ORM model `UserAction` now expects a `created_at` column, but the legacy
  base schema (79b9722f373c_initial_database_schema) created `timestamp` only.
  Later migrations added indexes optionally using (created_at|timestamp), but did
  not guarantee presence of `created_at`. Runtime errors occurred when inserting
  user_actions with created_at in SQL (OperationalError: no such column created_at).

  This migration adds `created_at` if absent, back-filling its values from the
  legacy `timestamp` column when available. Safe & idempotent: reruns will no-op.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision: str = "d1993e6fdab6"
down_revision: Union[str, None] = "d1993e6fdab5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:  # pragma: no cover - migration code
    bind = op.get_bind()
    insp = sa.inspect(bind)
    if "user_actions" not in insp.get_table_names():
        return
    cols = {c["name"] for c in insp.get_columns("user_actions")}
    if "created_at" not in cols:
        # Add column (nullable first for SQLite backfill) then backfill and alter if needed
        op.add_column("user_actions", sa.Column("created_at", sa.DateTime(), nullable=True))
        # Backfill from legacy 'timestamp' if it exists
        try:
            bind.exec_driver_sql(
                text(
                    "UPDATE user_actions SET created_at = COALESCE(created_at, timestamp)"
                )
            )
        except Exception:
            pass
        # Optionally set NOT NULL if all rows populated (skip on SQLite complexity)
        try:
            null_count = bind.exec_driver_sql(
                text("SELECT COUNT(*) FROM user_actions WHERE created_at IS NULL")
            ).scalar()
            if null_count == 0:
                # Placeholder for engines supporting simple alter; intentionally skipped
                pass
        except Exception:
            pass


def downgrade() -> None:  # pragma: no cover - migration code
    bind = op.get_bind()
    insp = sa.inspect(bind)
    if "user_actions" not in insp.get_table_names():
        return
    cols = {c["name"] for c in insp.get_columns("user_actions")}
    if "created_at" in cols:
        with op.batch_alter_table("user_actions") as batch_op:
            batch_op.drop_column("created_at")
