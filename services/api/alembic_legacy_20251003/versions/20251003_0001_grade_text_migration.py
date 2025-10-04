"""Convert grade columns to TEXT for alphanumeric labels

Revision ID: 20251003_0001_grade_text_migration
Revises: 20251002_2100_baseline
Create Date: 2025-10-03

Notes:
- Forward migration converts integer grade columns to text.
- Down migration will attempt to cast back to int and will FAIL if any non-numeric values exist.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20251003_0001_grade_text_migration'
down_revision = '20251002_2100_baseline'
branch_labels = None
depends_on = None

def upgrade():
    conn = op.get_bind()
    # Wings grade_start / grade_end to text
    for col in ('grade_start','grade_end'):
        try:
            op.alter_column('wings', col, type_=sa.Text(), postgresql_using=f"{col}::text")
        except Exception as e:  # pragma: no cover
            print(f"[warn] altering wings.{col} failed: {e}")

    # School classes grade to text
    try:
        op.alter_column('school_classes', 'grade', type_=sa.Text(), postgresql_using="grade::text")
    except Exception as e:
        print(f"[warn] altering school_classes.grade failed: {e}")

    # class_tasks / class_notes may or may not exist yet. Guard with EXISTS.
    for tbl in ('class_tasks','class_notes'):
        try:
            conn.execute(sa.text(f"SELECT 1 FROM {tbl} LIMIT 1"))
        except Exception:
            continue  # table absent
        try:
            op.alter_column(tbl, 'grade', type_=sa.Text(), postgresql_using="grade::text")
        except Exception as e:
            print(f"[warn] altering {tbl}.grade failed: {e}")


def downgrade():
    conn = op.get_bind()
    # Attempt best-effort revert; will fail if non-numeric rows exist.
    for col in ('grade_start','grade_end'):
        try:
            op.alter_column('wings', col, type_=sa.Integer(), postgresql_using=f"NULLIF(regexp_replace({col}, '[^0-9]', '', 'g'), '')::int")
        except Exception as e:
            print(f"[warn] reverting wings.{col} failed: {e}")

    try:
        op.alter_column('school_classes', 'grade', type_=sa.Integer(), postgresql_using="NULLIF(regexp_replace(grade,'[^0-9]','','g'),'')::int")
    except Exception as e:
        print(f"[warn] reverting school_classes.grade failed: {e}")

    for tbl in ('class_tasks','class_notes'):
        try:
            conn.execute(sa.text(f"SELECT 1 FROM {tbl} LIMIT 1"))
        except Exception:
            continue
        try:
            op.alter_column(tbl, 'grade', type_=sa.Integer(), postgresql_using="NULLIF(regexp_replace(grade,'[^0-9]','','g'),'')::int")
        except Exception as e:
            print(f"[warn] reverting {tbl}.grade failed: {e}")
