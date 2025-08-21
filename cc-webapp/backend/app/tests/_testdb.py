from sqlalchemy import text
from sqlalchemy.engine import Engine


def reset_db(engine: Engine) -> None:
    """Reset the current schema for tests.

    - Drops known dependent views that can block DDL (e.g., gacha_log)
    - TRUNCATEs all tables with RESTART IDENTITY CASCADE to clear data and FKs

    주의(시퀀스 충돌 관련):
    RESTART IDENTITY 는 모든 sequence 를 초기화하여 이후 생성되는 user id 가 1 부터 다시 시작합니다.
    병렬/누적 테스트 환경에서 이전에 생성된 high id(예: 12345) 레코드가 그대로 남아 있고
    시퀀스가 낮은 값부터 재사용되면 user_id 충돌(중복 key 또는 논리적 per-user limit 오작동) 위험이 있습니다.
    현재 플로우에서는 전체 테이블 truncate 후 바로 새로 생성하므로 충돌 자체는 없지만
    다른 프로세스가 레코드를 유지한 상태에서 부분 truncate 만 수행하는 패턴은 절대 금지.
    필요 시 RESTART IDENTITY 를 건너뛰고 setval(max(id)+1) 보정 로직을 사용하십시오.
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
