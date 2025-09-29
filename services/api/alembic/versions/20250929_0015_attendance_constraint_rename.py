"""rename attendance event unique constraint

Revision ID: 20250929_0015
Revises: 20250929_0014
Create Date: 2025-09-29
"""
from alembic import op
import sqlalchemy as sa

revision = '20250929_0015'
down_revision = '20250929_0014'
branch_labels = None
depends_on = None

def upgrade():
    conn = op.get_bind()
    # Old name that might exist from pre-refactor
    old_name = 'uq_attendance_student_date'
    new_name = 'uq_attendance_event_student_date'
    new_exists = conn.exec_driver_sql("SELECT 1 FROM pg_constraint WHERE conname=%s", (new_name,)).scalar()  # type: ignore
    if new_exists:
        return  # already correct
    # If old exists, just rename (preferred)
    old_table = conn.exec_driver_sql("SELECT conrelid::regclass::text FROM pg_constraint WHERE conname=%s", (old_name,)).scalar()  # type: ignore
    if old_table:
        conn.exec_driver_sql(f'ALTER TABLE {old_table} RENAME CONSTRAINT {old_name} TO {new_name}')
        return
    # Neither exists (fresh install) – ensure constraint present if table exists using correct column name 'date'
    attendance_exists = conn.exec_driver_sql("SELECT 1 FROM information_schema.tables WHERE table_name='attendance_events' AND table_schema='public'").scalar()
    if attendance_exists:
        # Model defines column 'date'
        conn.exec_driver_sql(f'ALTER TABLE attendance_events ADD CONSTRAINT {new_name} UNIQUE (student_id, date)')


def downgrade():
    # Best effort reverse – rename back only if current name exists
    conn = op.get_bind()
    old_name = 'uq_attendance_student_date'
    new_name = 'uq_attendance_event_student_date'
    cur_exists = conn.exec_driver_sql("SELECT conrelid::regclass::text FROM pg_constraint WHERE conname=%s", (new_name,)).scalar()  # type: ignore
    if cur_exists:
        conn.exec_driver_sql(f'ALTER TABLE {cur_exists} RENAME CONSTRAINT {new_name} TO {old_name}')
