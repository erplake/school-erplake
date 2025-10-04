"""Enhance staff taxonomy tables (metadata columns, indexes, protected rows).

Revision ID: 20251003_0030_taxonomy_enhancements
Revises: 20251003_0025_merge_staff_taxonomy_branches
Create Date: 2025-10-03

Adds optional metadata columns and indexes to staff_roles / staff_departments:
  - code (TEXT UNIQUE nullable)
  - description (TEXT)
  - protected (BOOLEAN NOT NULL DEFAULT false)
  - display_order (INT)
Also adds supporting indexes and seeds display_order values.
Idempotent where practical to survive partial prior manual application.
"""
from alembic import op  # type: ignore
import sqlalchemy as sa  # type: ignore

revision = "20251003_0030_taxonomy_enhancements"
down_revision = "20251003_0025_merge_staff_taxonomy_branches"
branch_labels = None
depends_on = None


def _add_column_if_missing(conn, table: str, column_def: str):
    # column_def should include column name and full type/constraint clause
    col_name = column_def.split()[0]
    exists = conn.execute(sa.text(
        "SELECT 1 FROM information_schema.columns WHERE table_name=:t AND column_name=:c"),
        {"t": table, "c": col_name}).fetchone()
    if not exists:
        conn.execute(sa.text(f"ALTER TABLE {table} ADD COLUMN {column_def}"))


def upgrade():
    conn = op.get_bind()

    for tbl in ("staff_roles", "staff_departments"):
        _add_column_if_missing(conn, tbl, "code TEXT")
        _add_column_if_missing(conn, tbl, "description TEXT")
        _add_column_if_missing(conn, tbl, "protected BOOLEAN NOT NULL DEFAULT false")
        _add_column_if_missing(conn, tbl, "display_order INT")

        # Add index on active if not exists
        try:
            conn.execute(sa.text(f"CREATE INDEX IF NOT EXISTS {tbl}_active_idx ON {tbl}(active)"))
        except Exception:
            pass

        # Backfill display_order deterministically where null (order by name)
        conn.execute(sa.text(
            f"""
            WITH ordered AS (
              SELECT id, ROW_NUMBER() OVER (ORDER BY name) AS rn
              FROM {tbl} WHERE display_order IS NULL
            )
            UPDATE {tbl} t SET display_order = o.rn * 10
            FROM ordered o WHERE t.id = o.id;
            """))

        # Mark seed rows protected (original baseline names) if they exist
        seed_names = [
            "Teacher","Principal","Admin","Accountant","Librarian","Counselor",  # roles
            "Mathematics","Science","English","Humanities","Sports","Administration","Finance"  # departments
        ]
        conn.execute(sa.text(
            f"UPDATE {tbl} SET protected = true WHERE name IN :seed"), {"seed": tuple(seed_names)})

    # Optional unique constraint on (lower(name)) among active entries could be modeled via partial index.
    # Implement partial unique index if absent.
    for tbl in ("staff_roles", "staff_departments"):
        idx_name = f"{tbl}_active_lower_name_uniq"
        # Check if index exists
        exists = conn.execute(sa.text(
            "SELECT 1 FROM pg_indexes WHERE tablename=:t AND indexname=:i"), {"t": tbl, "i": idx_name}).fetchone()
        if not exists:
            try:
                conn.execute(sa.text(
                    f"CREATE UNIQUE INDEX {idx_name} ON {tbl} (lower(name)) WHERE active = true"))
            except Exception:
                pass


def downgrade():  # pragma: no cover
    raise RuntimeError("Downgrade not supported for taxonomy enhancements")
