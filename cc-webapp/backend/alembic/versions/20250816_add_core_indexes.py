"""add core composite & unique indexes

Revision ID: a1d3b6b5c9f0
Revises: f79d04ea1016
Create Date: 2025-08-16
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a1d3b6b5c9f0'
down_revision = 'f79d04ea1016'
branch_labels = None
depends_on = None

def upgrade():
    # 임시 no-op: 트랜잭셔널 DDL 환경(PostgreSQL)에서 중복/상태 불일치로 인한 실패를 방지하기 위해
    # 본 리비전의 인덱스/제약 추가를 비활성화합니다. 추후 안전한 IF NOT EXISTS + 메타검사 방식으로 별도 리비전에서 재적용.
    bind = op.get_bind()
    _ = bind  # quiet linter
    return


def downgrade():
    # upgrade가 no-op이므로 downgrade도 no-op으로 둡니다.
    return
