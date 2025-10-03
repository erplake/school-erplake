"""Convert grade columns to TEXT for alphanumeric labels (clean chain)

Revision ID: 20251003_0001_grade_text
Revises: 20251002_2400_brand_settings
Create Date: 2025-10-03

Notes:
- Mirrors logic from legacy alembic/versions/20251003_0001_grade_text_migration.py
- Kept idempotent / tolerant style (print warnings instead of hard failing)
"""
from alembic import op  # type: ignore
import sqlalchemy as sa  # type: ignore

revision = "20251003_0001_grade_text"
down_revision = "20251002_2400_brand_settings"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    # Wings grade_start / grade_end -> TEXT
    for col in ("grade_start", "grade_end"):
        try:
            op.alter_column("wings", col, type_=sa.Text(), postgresql_using=f"{col}::text")
        except Exception as e:  # pragma: no cover
            print(f"[warn] altering wings.{col} failed: {e}")

    # School classes grade -> TEXT
    try:
        op.alter_column("school_classes", "grade", type_=sa.Text(), postgresql_using="grade::text")
    except Exception as e:
        print(f"[warn] altering school_classes.grade failed: {e}")

    # Optional tables if already created elsewhere
    for tbl in ("class_tasks", "class_notes"):
        try:
            conn.execute(sa.text(f"SELECT 1 FROM {tbl} LIMIT 1"))
        except Exception:
            continue  # table not present yet -> skip
        try:
            op.alter_column(tbl, "grade", type_=sa.Text(), postgresql_using="grade::text")
        except Exception as e:
            print(f"[warn] altering {tbl}.grade failed: {e}")


def downgrade():  # Best effort numeric reversion
    conn = op.get_bind()
    for col in ("grade_start", "grade_end"):
        try:
            op.alter_column(
                "wings",
                col,
                type_=sa.Integer(),
                postgresql_using=f"NULLIF(regexp_replace({col}, '[^0-9]', '', 'g'), '')::int",
            )
        except Exception as e:
            print(f"[warn] reverting wings.{col} failed: {e}")
    try:
        op.alter_column(
            "school_classes",
            "grade",
            type_=sa.Integer(),
            postgresql_using="NULLIF(regexp_replace(grade,'[^0-9]','','g'),'')::int",
        )
    except Exception as e:
        print(f"[warn] reverting school_classes.grade failed: {e}")
    for tbl in ("class_tasks", "class_notes"):
        try:
            conn.execute(sa.text(f"SELECT 1 FROM {tbl} LIMIT 1"))
        except Exception:
            continue
        try:
            op.alter_column(
                tbl,
                "grade",
                type_=sa.Integer(),
                postgresql_using="NULLIF(regexp_replace(grade,'[^0-9]','','g'),'')::int",
            )
        except Exception as e:
            print(f"[warn] reverting {tbl}.grade failed: {e}")
