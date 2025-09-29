"""Add settlement_summary table

Revision ID: 20250929_1340
Revises: 20250929_1335
Create Date: 2025-09-29
"""
from alembic import op
import sqlalchemy as sa

revision = '20250929_1340'
down_revision = '20250929_1335'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'settlement_summary',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('school_id', sa.BigInteger(), sa.ForeignKey('core.school.id', ondelete='CASCADE'), nullable=False),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('settlement_date', sa.Date(), nullable=False),
        sa.Column('currency', sa.String(), nullable=False, server_default='INR'),
        sa.Column('gross_amount', sa.Numeric(14,2), server_default='0'),
        sa.Column('fees_amount', sa.Numeric(14,2), server_default='0'),
        sa.Column('refunds_amount', sa.Numeric(14,2), server_default='0'),
        sa.Column('net_amount', sa.Numeric(14,2), server_default='0'),
        sa.Column('tx_count', sa.Integer(), server_default='0'),
        sa.Column('refund_count', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('school_id','provider','settlement_date', name='uq_settlement_day'),
        schema='payments'
    )


def downgrade():
    op.drop_table('settlement_summary', schema='payments')
