"""merge staff heads

Revision ID: 20251003_0035_merge_staff_heads
Revises: 20251003_0020_merge_heads_staff, 20251003_0020_staff_photo_and_taxonomy
Create Date: 2025-10-03
"""
from alembic import op

revision = '20251003_0035_merge_staff_heads'
down_revision = ('20251003_0020_merge_heads_staff', '20251003_0020_staff_photo_and_taxonomy')
branch_labels = None
depends_on = None

def upgrade():
    pass

def downgrade():
    pass
