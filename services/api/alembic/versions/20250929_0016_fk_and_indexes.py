"""add foreign keys and supporting indexes

Revision ID: 20250929_0016
Revises: 20250929_0015
Create Date: 2025-09-29
"""
from alembic import op
import sqlalchemy as sa

revision = '20250929_0016'
down_revision = '20250929_0015'
branch_labels = None
depends_on = None

def upgrade():
    conn = op.get_bind()
    # Helper to check constraint existence
    def fk_exists(name):
        return conn.exec_driver_sql("SELECT 1 FROM pg_constraint WHERE conname=%s", (name,)).scalar() is not None

    # attendance_events FK
    if not fk_exists('fk_attendance_events_student_id'):
        op.create_foreign_key('fk_attendance_events_student_id', 'attendance_events', 'students', ['student_id'], ['id'], ondelete='CASCADE')

    # fee_invoices FK
    if not fk_exists('fk_fee_invoices_student_id'):
        op.create_foreign_key('fk_fee_invoices_student_id', 'fee_invoices', 'students', ['student_id'], ['id'], ondelete='CASCADE')

    # Indexes (safe create if not exists via DO block)
    for ddl in [
        # attendance_events uses column name 'date'
        "CREATE INDEX IF NOT EXISTS ix_attendance_events_student_date ON attendance_events (student_id, date)",
        "CREATE INDEX IF NOT EXISTS ix_fee_invoices_student_due ON fee_invoices (student_id, due_date)",
    ]:
        conn.exec_driver_sql(ddl)


def downgrade():
    # Best effort; drop indexes then FKs if present
    conn = op.get_bind()
    for idx in [
        'ix_attendance_events_student_date',
        'ix_fee_invoices_student_due',
    ]:
        conn.exec_driver_sql(f'DROP INDEX IF EXISTS {idx}')
    for fk_name, table in [
        ('fk_attendance_events_student_id','attendance_events'),
        ('fk_fee_invoices_student_id','fee_invoices'),
    ]:
        try:
            op.drop_constraint(fk_name, table, type_='foreignkey')
        except Exception:
            pass
