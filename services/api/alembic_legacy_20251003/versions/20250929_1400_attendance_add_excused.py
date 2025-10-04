"""add excused status to attendance_student

Revision ID: 20250929_1400
Revises: 20250929_0015
Create Date: 2025-09-29
"""
from alembic import op
import sqlalchemy as sa

revision = '20250929_1400'
down_revision = '20250929_0015'
branch_labels = None
depends_on = None

ALLOWED = { 'present','absent','late','excused' }

CHECK_NAME = 'ck_attendance_student_status'
TABLE = 'attendance_student'

def upgrade():
    conn = op.get_bind()
    # Detect existing check constraint restricting statuses
    # We'll drop and recreate with new set including 'excused'.
    # Portable approach: introspect pg_constraint for table & name if exists.
    existing = conn.exec_driver_sql("""
        SELECT conname
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE t.relname=%s AND n.nspname='public' AND c.contype='c'
    """, (TABLE,)).fetchall()
    # Drop any check constraints on the table so we can recreate cleanly.
    for row in existing:
        cname = row[0]
        # Safety: only drop if it references status (inspect definition)
        defn = conn.exec_driver_sql("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname=%s", (cname,)).scalar()
        if 'status' in (defn or ''):
            conn.exec_driver_sql(f'ALTER TABLE {TABLE} DROP CONSTRAINT {cname}')
    # Recreate constraint
    allowed_list = ",".join(f"'{s}'" for s in sorted(ALLOWED))
    conn.exec_driver_sql(f"ALTER TABLE {TABLE} ADD CONSTRAINT {CHECK_NAME} CHECK (status in ({allowed_list}))")


def downgrade():
    conn = op.get_bind()
    # Drop new constraint then recreate without excused
    conn.exec_driver_sql(f'ALTER TABLE {TABLE} DROP CONSTRAINT IF EXISTS {CHECK_NAME}')
    conn.exec_driver_sql("ALTER TABLE attendance_student ADD CONSTRAINT ck_attendance_student_status CHECK (status in ('present','absent','late'))")
