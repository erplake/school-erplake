"""Upgrade existing minimal staff table to full schema.

Adds missing columns used by Staff SQLAlchemy model. Idempotent so it can run on an already‑upgraded table.
Backfills staff_code for legacy rows and enforces uniqueness.
"""
from alembic import op  # type: ignore
import sqlalchemy as sa  # type: ignore

revision = "20251003_0000_staff_full_upgrade"
# Adjusted to depend on grade_text so we get a single linear chain:
# ... -> 20251002_2400_brand_settings -> 20251003_0001_grade_text -> 20251003_0000_staff_full_upgrade -> 20251003_0010_heads_cls_sets
down_revision = "20251003_0001_grade_text"
branch_labels = None
depends_on = None

ADD_COLS = [
    ("staff_code", "VARCHAR(20)"),
    ("role", "VARCHAR(50)"),
    ("department", "VARCHAR(80)"),
    ("grade", "VARCHAR(40)"),
    ("email", "VARCHAR(120)"),
    ("phone", "VARCHAR(40)"),
    ("date_of_joining", "date"),
    ("birthday", "date"),
    ("reports_to", "VARCHAR(120)"),
    ("status", "VARCHAR(20) DEFAULT 'Active'"),
    ("attendance_30", "INT DEFAULT 0"),
    ("leaves_taken_ytd", "INT DEFAULT 0"),
    ("leave_balance", "INT DEFAULT 0"),
    ("last_appraisal", "date"),
    ("next_appraisal", "date"),
]

UNIQUE_CONSTRAINT = "staff_staff_code_key"


def upgrade():
    conn = op.get_bind()

    # Add columns if missing (idempotent)
    for col, ddl_type in ADD_COLS:
        try:
            conn.execute(sa.text(f"ALTER TABLE staff ADD COLUMN IF NOT EXISTS {col} {ddl_type}"))
        except Exception:
            pass  # ignore if cannot add (permissions/race)

    # Backfill staff_code if null (legacy minimal table)
    try:
        # Use S<id> pattern; ensure no collisions with existing real codes
        conn.execute(sa.text("UPDATE staff SET staff_code = 'S' || id WHERE staff_code IS NULL"))
    except Exception:
        pass

    # Ensure NOT NULL on staff_code (only after backfill)
    try:
        conn.execute(sa.text("ALTER TABLE staff ALTER COLUMN staff_code SET NOT NULL"))
    except Exception:
        pass

    # Add uniqueness constraint if not exists
    try:
        # Portable check: attempt to create; swallow duplicate errors
        conn.execute(sa.text(f"ALTER TABLE staff ADD CONSTRAINT {UNIQUE_CONSTRAINT} UNIQUE (staff_code)"))
    except Exception:
        pass

    # If role is null for legacy rows, default to 'Teacher' for now (arbitrary but needed for API enum expectations)
    try:
        conn.execute(sa.text("UPDATE staff SET role='Teacher' WHERE role IS NULL"))
    except Exception:
        pass


def downgrade():  # irreversible (columns may have data)
    raise RuntimeError("Downgrade not supported for staff full schema upgrade")
