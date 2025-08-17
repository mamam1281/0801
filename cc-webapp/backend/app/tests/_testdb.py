from sqlalchemy import text
from sqlalchemy.engine import Engine


def reset_db(engine: Engine) -> None:
    """Reset the current schema for tests.

    - Drops known dependent views that can block DDL (e.g., gacha_log)
    - TRUNCATEs all tables with RESTART IDENTITY CASCADE to clear data and FKs
    """
    with engine.connect() as conn:
        # Drop dependent views first (best-effort)
        try:
            conn.execute(text("DROP VIEW IF EXISTS gacha_log CASCADE"))
        except Exception:
            pass

        # Collect all tables in the current schema
        rows = conn.execute(
            text(
                """
                SELECT tablename
                FROM pg_tables
                WHERE schemaname = current_schema()
                """
            )
        ).fetchall()
        table_names = [r[0] for r in rows]

        if table_names:
            idents = ", ".join([f'"{n}"' for n in table_names])
            conn.execute(text(f"TRUNCATE TABLE {idents} RESTART IDENTITY CASCADE"))

        conn.commit()
