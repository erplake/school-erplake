"""extend brand settings + integration settings

Revision ID: 20250928_0006
Revises: 20250928_0005
Create Date: 2025-09-28
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '20250928_0006'
down_revision = '20250928_0005'
branch_labels = None
depends_on = None

def upgrade():
    # Add new columns to brand_settings if table exists
    with op.batch_alter_table('brand_settings') as b:
        b.add_column(sa.Column('address_line1', sa.String(), nullable=True))
        b.add_column(sa.Column('address_line2', sa.String(), nullable=True))
        b.add_column(sa.Column('city', sa.String(), nullable=True))
        b.add_column(sa.Column('state', sa.String(), nullable=True))
        b.add_column(sa.Column('country', sa.String(), nullable=True))
        b.add_column(sa.Column('postal_code', sa.String(), nullable=True))
        b.add_column(sa.Column('tagline', sa.String(), nullable=True))
        b.add_column(sa.Column('social_links', postgresql.JSONB(astext_type=sa.Text()), nullable=True))

    op.create_table('integration_settings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('config', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('updated_by', sa.String(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.UniqueConstraint('provider', name='uq_integration_provider')
    )

def downgrade():
    op.drop_table('integration_settings')
    with op.batch_alter_table('brand_settings') as b:
        b.drop_column('social_links')
        b.drop_column('tagline')
        b.drop_column('postal_code')
        b.drop_column('country')
        b.drop_column('state')
        b.drop_column('city')
        b.drop_column('address_line2')
        b.drop_column('address_line1')
    # end downgrade