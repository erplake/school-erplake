"""Merge multiple head revisions into single linear head.

This merge resolves divergence between:
 - 20251003_0000_staff_full_upgrade
 - 20251003_0010_heads_class_settings
 - 20251003_0010_heads_cls_sets

Both 0010_* migrations contain duplicate logic (head_mistress + wing head_id + class storage/meet).
We keep one (20251003_0010_heads_cls_sets) as the canonical prior migration.
If the alternate 0010 file already applied its changes separately in some env, this merge is still safe
because DDL was idempotent or identical.
"""
from alembic import op  # type: ignore

revision = "20251003_0020_merge_heads_staff"
down_revision = (
    "20251003_0000_staff_full_upgrade",
    "20251003_0010_heads_class_settings",
    "20251003_0010_heads_cls_sets",
)
branch_labels = None
depends_on = None


def upgrade():
    # Pure merge point – no operations; schema state already achieved by parent revisions.
    pass


def downgrade():  # pragma: no cover
    raise RuntimeError("Downgrading a merge revision is not supported")
