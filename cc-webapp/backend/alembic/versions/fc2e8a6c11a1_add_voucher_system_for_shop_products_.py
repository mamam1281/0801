"""Add voucher system for shop products - tracking usage and external services

Revision ID: fc2e8a6c11a1
Revises: 0996a1ceabb7
Create Date: 2025-09-12 18:04:36.532203

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fc2e8a6c11a1'
down_revision: Union[str, None] = '0996a1ceabb7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add voucher-specific columns to shop_products table
    op.add_column('shop_products', sa.Column('voucher_type', sa.String(length=50), nullable=True))
    op.add_column('shop_products', sa.Column('external_service', sa.String(length=100), nullable=True))
    op.add_column('shop_products', sa.Column('external_service_id', sa.String(length=100), nullable=True))
    op.add_column('shop_products', sa.Column('stock_total', sa.Integer(), nullable=True))
    op.add_column('shop_products', sa.Column('stock_remaining', sa.Integer(), nullable=True))
    op.add_column('shop_products', sa.Column('redemption_url', sa.Text(), nullable=True))
    op.add_column('shop_products', sa.Column('redemption_instructions', sa.Text(), nullable=True))
    
    # Create voucher_usage table
    op.create_table('voucher_usage',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('purchase_id', sa.String(length=100), nullable=False),
        sa.Column('usage_status', sa.String(length=20), nullable=False),
        sa.Column('purchased_at', sa.DateTime(), nullable=False),
        sa.Column('used_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('external_reference', sa.String(length=200), nullable=True),
        sa.Column('redemption_details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['product_id'], ['shop_products.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_voucher_usage_id'), 'voucher_usage', ['id'], unique=False)
    op.create_index(op.f('ix_voucher_usage_purchase_id'), 'voucher_usage', ['purchase_id'], unique=False)
    op.create_index(op.f('ix_voucher_usage_user_id'), 'voucher_usage', ['user_id'], unique=False)
    op.create_index(op.f('ix_voucher_usage_usage_status'), 'voucher_usage', ['usage_status'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop voucher_usage table
    op.drop_index(op.f('ix_voucher_usage_usage_status'), table_name='voucher_usage')
    op.drop_index(op.f('ix_voucher_usage_user_id'), table_name='voucher_usage')
    op.drop_index(op.f('ix_voucher_usage_purchase_id'), table_name='voucher_usage')
    op.drop_index(op.f('ix_voucher_usage_id'), table_name='voucher_usage')
    op.drop_table('voucher_usage')
    
    # Remove voucher-specific columns from shop_products table
    op.drop_column('shop_products', 'redemption_instructions')
    op.drop_column('shop_products', 'redemption_url')
    op.drop_column('shop_products', 'stock_remaining')
    op.drop_column('shop_products', 'stock_total')
    op.drop_column('shop_products', 'external_service_id')
    op.drop_column('shop_products', 'external_service')
    op.drop_column('shop_products', 'voucher_type')
