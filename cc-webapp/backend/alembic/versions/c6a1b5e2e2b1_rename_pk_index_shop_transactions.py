"""rename pk index for shop_transactions

Revision ID: c6a1b5e2e2b1
Revises: be6edf74183a
Create Date: 2025-08-23 11:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c6a1b5e2e2b1'
down_revision: Union[str, None] = 'be6edf74183a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 0) 백업 테이블의 동일 이름 충돌 방지: 원래 메인에서 온 PK가 있다면 *_old로 변경
    op.execute(sa.text("ALTER INDEX IF EXISTS shop_transactions_pkey RENAME TO shop_transactions_pkey_old;"))

    # 1) 현재 메인 테이블에 남아있는 shadow 명명 PK를 표준 이름으로 변경
    op.execute(sa.text("ALTER INDEX IF EXISTS shop_transactions_shadow_pkey RENAME TO shop_transactions_pkey;"))


def downgrade() -> None:
    # 0) 표준 이름을 다시 shadow 접두로 되돌림
    op.execute(sa.text("ALTER INDEX IF EXISTS shop_transactions_pkey RENAME TO shop_transactions_shadow_pkey;"))

    # 1) 백업에서 *_old를 다시 표준 이름으로 환원
    op.execute(sa.text("ALTER INDEX IF EXISTS shop_transactions_pkey_old RENAME TO shop_transactions_pkey;"))
