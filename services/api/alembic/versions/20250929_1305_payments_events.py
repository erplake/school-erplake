"""Add payment_event table for webhook ingestion

Revision ID: 20250929_1305
Revises: 20250929_1255
Create Date: 2025-09-29
"""
from alembic import op
import sqlalchemy as sa

revision = '20250929_1305'
down_revision = '20250929_1255'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'payment_event',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('school_id', sa.BigInteger(), sa.ForeignKey('core.school.id', ondelete='CASCADE'), nullable=False),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('event_id', sa.String(), nullable=False),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('pg_transaction_id', sa.BigInteger(), sa.ForeignKey('payments.pg_transaction.id', ondelete='SET NULL'), nullable=True),
        sa.Column('status_derived', sa.String(), nullable=True),
        sa.Column('raw', sa.JSON(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        schema='payments'
    )
    op.create_index('uq_payment_event_provider_event_id', 'payment_event', ['school_id','provider','event_id'], unique=True, schema='payments')


def downgrade():
    op.drop_index('uq_payment_event_provider_event_id', table_name='payment_event', schema='payments')
    op.drop_table('payment_event', schema='payments')
