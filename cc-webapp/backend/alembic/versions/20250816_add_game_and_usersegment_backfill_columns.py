"""add game bet/payout and usersegment name columns

Revision ID: 20250816_add_game_and_usersegment_cols
Revises: 20250816_add_game_session_result_data
Create Date: 2025-08-16

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250816_add_game_and_usersegment_cols'
down_revision = '20250816_add_game_session_result_data'
branch_labels = None
depends_on = None

def column_exists(table: str, column: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    cols = [c['name'] for c in inspector.get_columns(table)]
    return column in cols

def upgrade():
    # games.bet_amount
    if not column_exists('games', 'bet_amount'):
        op.add_column('games', sa.Column('bet_amount', sa.Integer(), server_default='0', nullable=False))
    # games.payout
    if not column_exists('games', 'payout'):
        op.add_column('games', sa.Column('payout', sa.Integer(), server_default='0', nullable=False))
    # user_segments.name
    if not column_exists('user_segments', 'name'):
        op.add_column('user_segments', sa.Column('name', sa.String(length=50), nullable=True))


def downgrade():
    # 안전을 위해 존재할 때만 제거
    if column_exists('games', 'bet_amount'):
        op.drop_column('games', 'bet_amount')
    if column_exists('games', 'payout'):
        op.drop_column('games', 'payout')
    if column_exists('user_segments', 'name'):
        op.drop_column('user_segments', 'name')
