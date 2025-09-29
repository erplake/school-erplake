"""baseline after manual schema.sql application

Revision ID: 20250929_1035
Revises: 20250929_1025
Create Date: 2025-09-29

This revision intentionally contains NO DDL. The database schema was applied manually via schema.sql.
Future migrations should be purely incremental.
"""
from alembic import op
import sqlalchemy as sa

revision = '20250929_1035'
down_revision = '20250929_1025'
branch_labels = None
depends_on = None

def upgrade():
    # No-op baseline: schema already present.
    pass

def downgrade():
    # No-op
    pass
