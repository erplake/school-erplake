"""brand settings table

Revision ID: 20250928_0003
Revises: 20250928_0002
Create Date: 2025-09-28
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '20250928_0003'
down_revision = '20250928_0002'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('brand_settings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('school_name', sa.String(), nullable=False, server_default='My School'),
        sa.Column('principal_name', sa.String(), nullable=True),
        sa.Column('phone_primary', sa.String(), nullable=True),
        sa.Column('phone_transport', sa.String(), nullable=True),
        sa.Column('email_contact', sa.String(), nullable=True),
        sa.Column('location_address', sa.String(), nullable=True),
        sa.Column('logo_url', sa.String(), nullable=True),
        sa.Column('website_url', sa.String(), nullable=True),
        sa.Column('updated_by', sa.String(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

def downgrade():
    op.drop_table('brand_settings')
