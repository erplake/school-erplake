"""Drop school_user table after reverting multi-school plan

Revision ID: 20250929_1330
Revises: 20250929_1325
Create Date: 2025-09-29
"""
from alembic import op

revision = '20250929_1330'
down_revision = '20250929_1325'
branch_labels = None
depends_on = None


def upgrade():
    try:
        op.drop_table('school_user', schema='core')
    except Exception:
        pass


def downgrade():
    # No automatic recreation (would require role info); intentionally left minimal
    pass
