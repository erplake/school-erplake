"""Merge heads before taxonomy application.

Revision ID: 20251003_0025_merge_staff_taxonomy_branches
Revises: 20251003_0020_merge_heads_staff, 20251003_0020_staff_photo_and_taxonomy
Create Date: 2025-10-03
"""
from alembic import op  # type: ignore

revision = '20251003_0025_merge_staff_taxonomy_branches'
down_revision = ('20251003_0020_merge_heads_staff', '20251003_0020_staff_photo_and_taxonomy')
branch_labels = None
depends_on = None

def upgrade():
    # Pure merge point, no schema ops. 0020_staff_photo_and_taxonomy holds actual DDL.
    pass

def downgrade():  # pragma: no cover
    raise RuntimeError('Downgrading a merge revision is not supported')
