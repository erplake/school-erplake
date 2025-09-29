"""Add invoice linkage columns to payments tables

Revision ID: 20250929_1245
Revises: 20250929_1235
Create Date: 2025-09-29
"""
from alembic import op
import sqlalchemy as sa

revision = '20250929_1245'
down_revision = '20250929_1235'
branch_labels = None
depends_on = None

def upgrade():
    with op.batch_alter_table('pg_transaction', schema='payments') as batch:
        batch.add_column(sa.Column('invoice_id', sa.BigInteger(), nullable=True))
    with op.batch_alter_table('recon_ledger', schema='payments') as batch:
        batch.add_column(sa.Column('invoice_id', sa.BigInteger(), nullable=True))

def downgrade():
    with op.batch_alter_table('recon_ledger', schema='payments') as batch:
        batch.drop_column('invoice_id')
    with op.batch_alter_table('pg_transaction', schema='payments') as batch:
        batch.drop_column('invoice_id')