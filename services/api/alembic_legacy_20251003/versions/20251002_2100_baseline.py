"""Single-lineage baseline after reset (2025-10-02).

This migration intentionally performs no DDL. The current live database
state is treated as the new starting baseline for future migrations.

Commands for future reference (not executed here):
    alembic revision -m "add_new_feature"

WARNING: Downgrading past this baseline is unsupported; create a backup
before future destructive changes.
"""

from alembic import op  # type: ignore  # noqa: F401 (kept for forward edits)
import sqlalchemy as sa  # type: ignore  # noqa: F401

revision: str = "20251002_2100_baseline"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:  # pragma: no cover
    # No-op baseline. Database schema at reset time is authoritative.
    pass


def downgrade() -> None:  # pragma: no cover
    raise RuntimeError("Downgrading past baseline is not supported")
