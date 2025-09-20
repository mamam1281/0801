"""add admin_event_force_claim_logs table for force-claim idempotency & audit

Revision ID: 20250918_add_admin_event_force_claim_logs
Revises: 86171b66491f_add_progress_meta_uniques_for_events_
Create Date: 2025-09-18 09:15:00

설명:
  관리자 이벤트 강제 보상(force-claim)의 멱등성과 감사 추적을 위한 로그 테이블을 추가한다.
  프론트엔드는 이미 X-Idempotency-Key 헤더를 전송하도록 구현되어 있으므로, 서버는
  동일 키 재호출 시 기존 성공 결과를 재구성 가능해야 한다.

테이블: admin_event_force_claim_logs
  id                PK
  idempotency_key   VARCHAR(80) UNIQUE  (충분한 길이, 충돌 방지)
  admin_user_id     FK -> users.id (ON DELETE CASCADE 아님; 보존 목적)
  target_user_id    FK -> users.id
  event_id          FK -> events.id
  rewards           JSONB (지급된 보상 스냅샷)
  completed_before  BOOLEAN (강제 지급 시 이미 participation.completed 상태였는지)
  created_at        TIMESTAMP (UTC)

인덱스:
  ix_admin_event_force_claim_logs_event_target (event_id, target_user_id)
  ix_admin_event_force_claim_logs_admin_created (admin_user_id, created_at)

주의:
  - 조건부 생성 패턴 사용 (재실행 시 실패 회피)
  - JSONB 사용 (PostgreSQL), 비-Postgres 환경(개발 SQLite)에서는 JSON으로 생성
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20250918_add_admin_event_force_claim_logs"
# down_revision은 파일명이 아닌 실제 리비전 ID를 가리켜야 합니다.
down_revision: Union[str, None] = "86171b66491f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:  # noqa: D401
    conn = op.get_bind()
    insp = sa.inspect(conn)
    table_name = "admin_event_force_claim_logs"

    if table_name in insp.get_table_names():
        return  # 이미 존재

    is_postgres = conn.dialect.name == "postgresql"
    json_type = sa.dialects.postgresql.JSONB if is_postgres else sa.JSON

    op.create_table(
        table_name,
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("idempotency_key", sa.String(length=80), nullable=False, unique=True, index=True),
        sa.Column("admin_user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("target_user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("event_id", sa.Integer, sa.ForeignKey("events.id"), nullable=False),
        sa.Column("rewards", json_type, nullable=False),
        sa.Column("completed_before", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )

    # Composite indexes (조건부 생성)
    try:
        op.create_index(
            "ix_admin_event_force_claim_logs_event_target",
            table_name,
            ["event_id", "target_user_id"],
        )
    except Exception:
        pass
    try:
        op.create_index(
            "ix_admin_event_force_claim_logs_admin_created",
            table_name,
            ["admin_user_id", "created_at"],
        )
    except Exception:
        pass


def downgrade() -> None:  # noqa: D401
    table_name = "admin_event_force_claim_logs"
    for idx in [
        "ix_admin_event_force_claim_logs_event_target",
        "ix_admin_event_force_claim_logs_admin_created",
    ]:
        try:
            op.drop_index(idx, table_name=table_name)
        except Exception:
            pass
    try:
        op.drop_table(table_name)
    except Exception:
        pass
