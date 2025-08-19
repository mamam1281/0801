"""Achievements 보정 및 Alembic stamp 스크립트

역할:
 1) achievements.reward_gems -> reward_gold rename (존재 시)
 2) alembic_version 테이블 생성/정리 후 최신 head(20250819_rename_achievement_reward_gems_to_gold)로 stamp
 3) 실행 결과 콘솔 출력

반복 실행 시 안전(no-op) 하도록 설계.
"""
from __future__ import annotations

import os
from sqlalchemy import create_engine, inspect, text

TARGET_HEAD = "20250819_rename_achievement_reward_gems_to_gold"


def _build_url() -> str:
    # 우선순위: DATABASE_URL -> 환경 변수 조합
    url = os.getenv("DATABASE_URL")
    if url:
        return url
    user = os.getenv("POSTGRES_USER", "cc_user")
    pwd = os.getenv("POSTGRES_PASSWORD", "cc_password")
    host = os.getenv("POSTGRES_HOST", "postgres")
    db = os.getenv("POSTGRES_DB", "cc_webapp")
    port = os.getenv("POSTGRES_PORT", "5432")
    return f"postgresql://{user}:{pwd}@{host}:{port}/{db}"


def main() -> None:
    url = _build_url()
    engine = create_engine(url)
    insp = inspect(engine)
    cols = []
    try:
        cols = [c["name"] for c in insp.get_columns("achievements")]  # type: ignore
    except Exception as e:  # pragma: no cover - 존재하지 않을 경우
        print("[WARN] achievements 테이블 조회 실패:", e)
    renamed = False
    if "reward_gems" in cols and "reward_gold" not in cols:
        # rename 수행
        with engine.begin() as conn:
            conn.exec_driver_sql("ALTER TABLE achievements RENAME COLUMN reward_gems TO reward_gold")
        renamed = True
        print("[APPLY] reward_gems -> reward_gold rename 완료")
    else:
        print("[SKIP] rename 조건 불충족 (reward_gems not in cols or reward_gold already 존재)")

    # alembic_version 테이블 및 stamp 처리
    insp = inspect(engine)
    tables = insp.get_table_names()
    with engine.begin() as conn:
        if "alembic_version" not in tables:
            conn.exec_driver_sql("CREATE TABLE alembic_version (version_num varchar(64) NOT NULL)")
            print("[APPLY] alembic_version 테이블 생성")
        # 단일 row 유지
        conn.exec_driver_sql("DELETE FROM alembic_version")
        conn.execute(text("INSERT INTO alembic_version (version_num) VALUES (:v)"), {"v": TARGET_HEAD})
        print(f"[STAMP] alembic_version -> {TARGET_HEAD}")

    # 결과 재검증
    insp = inspect(engine)
    final_cols = [c["name"] for c in insp.get_columns("achievements")] if "achievements" in insp.get_table_names() else []
    with engine.connect() as conn:
        version_rows = conn.exec_driver_sql("SELECT version_num FROM alembic_version").fetchall()
    print("[RESULT] achievements cols=", final_cols)
    print("[RESULT] alembic_version rows=", version_rows)
    print("[SUMMARY] renamed=", renamed, " head=", TARGET_HEAD)


if __name__ == "__main__":  # pragma: no cover
    main()
