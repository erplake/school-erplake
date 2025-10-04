"""Add staff.photo_url and create staff_roles & staff_departments tables.

Revision ID: 20251003_0020_staff_photo_and_taxonomy
Revises: 20251003_0011_staff_leave
Create Date: 2025-10-03

Idempotent where practical.
"""
from alembic import op  # type: ignore
import sqlalchemy as sa  # type: ignore

revision = "20251003_0020_staff_photo_and_taxonomy"
down_revision = "20251003_0011_staff_leave"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    # Add photo_url column if missing
    try:
        conn.execute(sa.text("ALTER TABLE staff ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255)"))
    except Exception:
        pass

    # Create taxonomy tables if not exist
    conn.execute(sa.text(
        """
        CREATE TABLE IF NOT EXISTS staff_roles (
          id SERIAL PRIMARY KEY,
          name VARCHAR(80) UNIQUE NOT NULL,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at timestamptz DEFAULT now() NOT NULL,
          updated_at timestamptz DEFAULT now() NOT NULL
        );
        CREATE TABLE IF NOT EXISTS staff_departments (
          id SERIAL PRIMARY KEY,
          name VARCHAR(80) UNIQUE NOT NULL,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at timestamptz DEFAULT now() NOT NULL,
          updated_at timestamptz DEFAULT now() NOT NULL
        );
        """
    ))

    # Seed base data if empty
    for tbl, values in [
        ("staff_roles", ["Teacher","Principal","Admin","Accountant","Librarian","Counselor"]),
        ("staff_departments", ["Mathematics","Science","English","Humanities","Sports","Administration","Finance"]),
    ]:
        res = conn.execute(sa.text(f"SELECT COUNT(*) FROM {tbl}"))
        if (res.scalar() or 0) == 0:
            for v in values:
                try:
                    conn.execute(sa.text(f"INSERT INTO {tbl} (name) VALUES (:v)"), {"v": v})
                except Exception:
                    pass


def downgrade():  # pragma: no cover
    raise RuntimeError("Downgrade not supported for staff photo & taxonomy migration")
