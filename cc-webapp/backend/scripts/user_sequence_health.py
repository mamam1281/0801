"""User sequence health & cleanup utility.

Usage (inside backend container):
  python -m scripts.user_sequence_health --check
  python -m scripts.user_sequence_health --fix
  python -m scripts.user_sequence_health --purge-nonseed --dry-run

Features:
- Check drift: users_id_seq vs max(users.id)
- Fix drift: setval to max+1 (no RESTART)
- Purge non-seed users: keep admins & seed accounts (site_id LIKE 'admin%' OR is_admin) else delete

Safety:
- Refuses to run destructive purge unless --confirm token provided or interactive confirmation.
"""
from __future__ import annotations

import argparse
import os
import sys
from typing import Sequence
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://cc_user:cc_pass@postgres:5432/cc_webapp")
SEED_PATTERNS = ["admin", "seed", "system"]  # simple heuristics


def get_engine():  # lazy
    return create_engine(DATABASE_URL)


def _fetch_one(conn, sql: str):
    return conn.execute(text(sql)).fetchone()


def check_sequence(conn) -> tuple[int, int | None]:
    max_id_row = _fetch_one(conn, "SELECT COALESCE(MAX(id),0) AS max_id FROM users")
    seq_row = _fetch_one(conn, "SELECT last_value, is_called FROM users_id_seq")
    max_id = max_id_row.max_id  # type: ignore
    # next value semantics: if is_called is false, next nextval returns last_value, else last_value+1
    next_alloc = seq_row.last_value if not seq_row.is_called else seq_row.last_value + 1  # type: ignore
    return max_id, next_alloc


def fix_sequence(conn) -> int:
    max_id_row = _fetch_one(conn, "SELECT COALESCE(MAX(id),0) AS max_id FROM users")
    target = max_id_row.max_id + 1  # type: ignore
    conn.execute(text("SELECT setval('users_id_seq', :target, false)"), {"target": target})
    return target


def purge_nonseed(conn, dry_run: bool) -> int:
    # identify keepers
    keep_conditions = ["is_admin = true"] + [f"site_id ILIKE '%{p}%'" for p in SEED_PATTERNS]
    where_keep = " OR ".join(keep_conditions)
    # select victims first
    victims = conn.execute(text(f"SELECT id FROM users WHERE NOT ({where_keep})")).fetchall()
    count = len(victims)
    if count and not dry_run:
        conn.execute(text(f"DELETE FROM users WHERE NOT ({where_keep})"))
    return count


def main(argv: Sequence[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--fix", action="store_true")
    ap.add_argument("--purge-nonseed", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--confirm", help="confirmation token for destructive ops")
    args = ap.parse_args(argv)

    if not (args.check or args.fix or args.purge_nonseed):
        ap.print_help()
        return 1

    engine = get_engine()
    with engine.begin() as conn:
        if args.check:
            max_id, next_alloc = check_sequence(conn)
            print(f"[CHECK] users.max_id={max_id} seq_next={next_alloc} drift={(next_alloc - (max_id+1))}")
        if args.fix:
            target = fix_sequence(conn)
            print(f"[FIX] set sequence to {target}")
        if args.purge_nonseed:
            if not args.dry_run and args.confirm != "YES_PURGE":
                print("Refusing to purge without --confirm YES_PURGE or --dry-run")
                return 2
            n = purge_nonseed(conn, args.dry_run)
            action = "WOULD_DELETE" if args.dry_run else "DELETED"
            print(f"[PURGE] {action} {n} non-seed users")
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
