"""Add indexes & constraints for settings config and payments tables

Revision ID: 20250929_1315
Revises: 20250929_1305
Create Date: 2025-09-29
"""
from alembic import op
import sqlalchemy as sa

revision = '20250929_1315'
down_revision = '20250929_1305'
branch_labels = None
depends_on = None


def upgrade():
    # settings.config uniqueness
    op.create_unique_constraint('uq_config_school_key', 'config', ['school_id','key'], schema='settings')
    op.create_index('ix_config_school_key', 'config', ['school_id','key'], unique=False, schema='settings')

    # payments.pg_transaction indexes
    op.create_index('ix_pg_tx_school_provider_order', 'pg_transaction', ['school_id','provider','order_id'], unique=False, schema='payments')
    op.create_index('ix_pg_tx_school_payment', 'pg_transaction', ['school_id','payment_id'], unique=False, schema='payments')
    op.create_index('ix_pg_tx_invoice', 'pg_transaction', ['invoice_id'], unique=False, schema='payments')

    # payments.recon_ledger index
    op.create_index('ix_recon_pg_tx', 'recon_ledger', ['pg_transaction_id'], unique=False, schema='payments')

    # Optional: enforce basic status domain via CHECK (skip if column absent)
    try:
        op.execute("ALTER TABLE payments.pg_transaction ADD CONSTRAINT ck_pg_transaction_status CHECK (status IN ('CREATED','AUTHORIZED','CAPTURED','REFUNDED','FAILED'))")
    except Exception:
        pass


def downgrade():
    # Drop CHECK constraint if exists
    try:
        op.execute("ALTER TABLE payments.pg_transaction DROP CONSTRAINT ck_pg_transaction_status")
    except Exception:
        pass

    op.drop_index('ix_recon_pg_tx', table_name='recon_ledger', schema='payments')
    op.drop_index('ix_pg_tx_invoice', table_name='pg_transaction', schema='payments')
    op.drop_index('ix_pg_tx_school_payment', table_name='pg_transaction', schema='payments')
    op.drop_index('ix_pg_tx_school_provider_order', table_name='pg_transaction', schema='payments')

    op.drop_index('ix_config_school_key', table_name='config', schema='settings')
    op.drop_constraint('uq_config_school_key', 'config', schema='settings', type_='unique')
