"""create crash_sessions and crash_bets tables

Revision ID: 20250809_add_crash_real
Revises: f79d04ea1016
Create Date: 2025-08-09

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = '20250809_add_crash_real'
down_revision: Union[str, None] = 'f79d04ea1016'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    # crash_sessions (idempotent)
    conn.execute(text(
        """
        CREATE TABLE IF NOT EXISTS crash_sessions (
            id SERIAL PRIMARY KEY,
            external_session_id VARCHAR(64) NOT NULL,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            bet_amount INTEGER NOT NULL,
            status VARCHAR(16) NOT NULL DEFAULT 'active',
            auto_cashout_multiplier NUMERIC(6,2),
            actual_multiplier NUMERIC(6,2),
            win_amount INTEGER NOT NULL DEFAULT '0',
            created_at TIMESTAMP NOT NULL DEFAULT now(),
            cashed_out_at TIMESTAMP NULL
        )
        """
    ))
    conn.execute(text(
        """
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'uq_crash_sessions_external_id'
            ) THEN
                ALTER TABLE crash_sessions
                ADD CONSTRAINT uq_crash_sessions_external_id UNIQUE (external_session_id);
            END IF;
        END $$;
        """
    ))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_crash_sessions_user_id ON crash_sessions(user_id)"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_crash_sessions_status ON crash_sessions(status)"))

    # crash_bets (idempotent)
    conn.execute(text(
        """
        CREATE TABLE IF NOT EXISTS crash_bets (
            id SERIAL PRIMARY KEY,
            session_id INTEGER NOT NULL REFERENCES crash_sessions(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            bet_amount INTEGER NOT NULL,
            payout_amount INTEGER NULL,
            cashout_multiplier NUMERIC(6,2) NULL,
            status VARCHAR(16) NOT NULL DEFAULT 'placed',
            created_at TIMESTAMP NOT NULL DEFAULT now(),
            cashed_out_at TIMESTAMP NULL
        )
        """
    ))
    # Create indexes only if columns exist (legacy tables may differ)
    conn.execute(text(
        """
        DO $$ BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='crash_bets' AND column_name='session_id'
            ) THEN
                CREATE INDEX IF NOT EXISTS ix_crash_bets_session_id ON crash_bets(session_id);
            END IF;
        END $$;
        """
    ))
    conn.execute(text(
        """
        DO $$ BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='crash_bets' AND column_name='user_id'
            ) THEN
                CREATE INDEX IF NOT EXISTS ix_crash_bets_user_id ON crash_bets(user_id);
            END IF;
        END $$;
        """
    ))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(text("DROP TABLE IF EXISTS crash_bets"))
    conn.execute(text("DROP TABLE IF EXISTS crash_sessions"))
