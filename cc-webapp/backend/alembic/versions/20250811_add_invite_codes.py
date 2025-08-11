"""add invite_codes table

Revision ID: 20250811_add_invite_codes
Revises: 20250811_core_indexes_constraints
Create Date: 2025-08-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20250811_add_invite_codes'
down_revision: Union[str, None] = '20250811_core_indexes_constraints'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'invite_codes',
        sa.Column('code', sa.String(length=32), primary_key=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('max_uses', sa.Integer(), nullable=True),
        sa.Column('used_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
    )


def downgrade() -> None:
    op.drop_table('invite_codes')
