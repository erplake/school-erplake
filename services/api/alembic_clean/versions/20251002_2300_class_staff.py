"""Add staff linkage columns to school_classes.

Adds teacher_staff_id (primary teacher), assistant_teacher_id, support_staff_ids (INT[]).
Backfills teacher_staff_id from existing teacher_name by attempting to match staff.name (case-insensitive) if possible.
"""
from alembic import op  # type: ignore
import sqlalchemy as sa  # type: ignore

revision = "20251002_2300_class_staff"
down_revision = "20251002_2200_classroom"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    # Ensure minimal staff table exists to satisfy FK references (idempotent)
    try:
        conn.execute(sa.text(
            """
            CREATE TABLE IF NOT EXISTS staff (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              active BOOLEAN DEFAULT true NOT NULL,
              created_at timestamptz DEFAULT now() NOT NULL,
              updated_at timestamptz DEFAULT now() NOT NULL
            );
            """
        ))
    except Exception:
        pass
    # Add columns if not exist (idempotent pattern)
    for ddl in [
        "ALTER TABLE school_classes ADD COLUMN IF NOT EXISTS teacher_staff_id INT REFERENCES staff(id) ON DELETE SET NULL",
        "ALTER TABLE school_classes ADD COLUMN IF NOT EXISTS assistant_teacher_id INT REFERENCES staff(id) ON DELETE SET NULL",
        "ALTER TABLE school_classes ADD COLUMN IF NOT EXISTS support_staff_ids INT[]"
    ]:
        try:
            conn.execute(sa.text(ddl))
        except Exception:
            pass
    # Attempt backfill mapping teacher_name -> staff.id (simple case-insensitive name match)
    try:
        res = conn.execute(sa.text("""
            SELECT sc.id, sc.teacher_name, s.id as staff_id
            FROM school_classes sc
            JOIN staff s ON lower(s.name)=lower(sc.teacher_name)
            WHERE sc.teacher_name IS NOT NULL AND sc.teacher_staff_id IS NULL
        """))
        rows = res.fetchall()
        for cid, tname, staff_id in rows:
            conn.execute(sa.text("UPDATE school_classes SET teacher_staff_id=:sid WHERE id=:cid"), {"sid": staff_id, "cid": cid})
    except Exception:
        pass


def downgrade():
    raise RuntimeError("Downgrade not supported (would drop new columns)")
