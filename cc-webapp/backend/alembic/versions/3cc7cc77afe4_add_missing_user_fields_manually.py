"""add_missing_user_fields_manually (no-op placeholder)

Revision ID: 3cc7cc77afe4
Revises: 63d16ce09e51
Create Date: 2025-09-18 12:00:00

이 리비전 파일은 과거 수동 스키마 보정 흔적을 정리하기 위한 no-op placeholder입니다.
실제 스키마 변경은 포함하지 않으며, Alembic head 단일성 유지를 목적으로 합니다.
"""

from alembic import op  # noqa: F401
import sqlalchemy as sa  # noqa: F401

# revision identifiers, used by Alembic.
revision = '3cc7cc77afe4'
down_revision = '63d16ce09e51'
branch_labels = None
depends_on = None


def upgrade() -> None:
	# No-op: 스키마 변경 없음
	pass


def downgrade() -> None:
	# No-op: 스키마 변경 없음
	pass

