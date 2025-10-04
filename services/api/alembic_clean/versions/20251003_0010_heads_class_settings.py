"""Head mistress table, wing head_id FK, storage/meet columns (clean chain)

Revision ID: 20251003_0010_heads_class_settings
Revises: 20251003_0001_grade_text
Create Date: 2025-10-03

Mirrors logic from legacy alembic version 20251003_0010_head_mistress_and_class_settings
with shortened revision id for the clean linear lineage.
"""
from alembic import op  # type: ignore
import sqlalchemy as sa  # type: ignore

revision = "20251003_0010_heads_class_settings"
down_revision = "20251003_0001_grade_text"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    # If everything already exists, behave as no-op (align with parallel 0010 variant)
    pre = conn.execute(sa.text(
        """
        SELECT
          (SELECT COUNT(*)>0 FROM information_schema.tables WHERE table_name='head_mistress') AS has_hm,
          (SELECT COUNT(*)>0 FROM information_schema.columns WHERE table_name='wings' AND column_name='head_id') AS has_head_id,
          (SELECT COUNT(*)>0 FROM information_schema.columns WHERE table_name='school_classes' AND column_name='storage_path') AS has_storage,
          (SELECT COUNT(*)>0 FROM information_schema.columns WHERE table_name='school_classes' AND column_name='meet_link') AS has_meet
        """
    )).fetchone()
    if pre and all(pre):
        return

    # Create head_mistress safely
    try:
        conn.execute(sa.text(
            """CREATE TABLE IF NOT EXISTS head_mistress (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                active BOOLEAN NOT NULL DEFAULT true,
                created_at timestamptz DEFAULT now()
            )"""
        ))
    except Exception:
        pass

    # Add head_id column if missing
    try:
        conn.execute(sa.text("ALTER TABLE wings ADD COLUMN IF NOT EXISTS head_id INT"))
    except Exception:
        pass
    # Foreign key (skip if exists)
    fk_exists = conn.execute(sa.text(
        """SELECT 1 FROM information_schema.table_constraints
             WHERE table_name='wings' AND constraint_name='fk_wings_head_id'"""
    )).fetchone()
    if not fk_exists:
        try:
            op.create_foreign_key(
                "fk_wings_head_id", "wings", "head_mistress", ["head_id"], ["id"], ondelete="SET NULL"
            )
        except Exception:
            pass
    # Index
    try:
        op.create_index("ix_wings_head_id", "wings", ["head_id"])
    except Exception:
        pass

    # school_classes columns
    for col in ("storage_path", "meet_link"):
        try:
            conn.execute(sa.text(f"ALTER TABLE school_classes ADD COLUMN IF NOT EXISTS {col} TEXT"))
        except Exception:
            pass

    # Backfill
    try:
        conn.execute(sa.text("UPDATE school_classes SET storage_path = CONCAT('/classes/', grade, '-', section) WHERE storage_path IS NULL;"))
    except Exception:
        pass
    try:
        conn.execute(sa.text("UPDATE school_classes SET meet_link = CONCAT('https://meet.google.com/lookup/', grade, section, id::text) WHERE meet_link IS NULL;"))
    except Exception:
        pass


def downgrade():
    # Remove new columns/tables (order matters)
    op.drop_column("school_classes", "meet_link")
    op.drop_column("school_classes", "storage_path")
    op.drop_index("ix_wings_head_id", table_name="wings")
    op.drop_constraint("fk_wings_head_id", "wings", type_="foreignkey")
    op.drop_column("wings", "head_id")
    op.drop_table("head_mistress")
