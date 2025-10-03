"""Single-lineage baseline after reset (2025-10-02).
(Clean script_location copy)
"""
from alembic import op  # type: ignore
import sqlalchemy as sa  # type: ignore

revision = "20251002_2100_baseline"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    pass

def downgrade():
    raise RuntimeError("Downgrading past baseline is not supported")
