"""exam scores table and performance indexes

Revision ID: 20251002_1700
Revises: 20251002_1500
Create Date: 2025-10-02
"""
from alembic import op
import sqlalchemy as sa

revision = '20251002_1700'
down_revision = '20251002_1500'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    # Create exam_scores table if not exists (Alembic usually manages state, but guard for drift)
    if not conn.dialect.has_table(conn, 'exam_scores'):
        op.create_table(
            'exam_scores',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('student_id', sa.Integer(), nullable=False),
            sa.Column('exam_date', sa.Date(), nullable=False),
            sa.Column('exam_type', sa.String(), nullable=False, server_default='term'),
            sa.Column('total_marks', sa.Integer(), nullable=False),
            sa.Column('obtained_marks', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.UniqueConstraint('student_id','exam_date','exam_type', name='uq_exam_scores_student_date_type')
        )
        # Add FK separately to avoid issues if students table is managed in different branch
        try:
            op.create_foreign_key('fk_exam_scores_student', 'exam_scores', 'students', ['student_id'], ['id'], ondelete='CASCADE')
        except Exception:
            pass
    # Index for date queries
    op.create_index('ix_exam_scores_date', 'exam_scores', ['exam_date'], unique=False, if_not_exists=True)

    # Performance indexes (idempotent via IF NOT EXISTS in raw SQL for features not exposed by Alembic helpers)
    # attendance_events(student_id,date)
    op.execute("CREATE INDEX IF NOT EXISTS ix_attendance_events_student_date ON attendance_events(student_id,date)")
    # fee_invoices(student_id)
    op.execute("CREATE INDEX IF NOT EXISTS ix_fee_invoices_student_id ON fee_invoices(student_id)")
    # class_students(student_id) already created earlier, but ensure exists
    op.execute("CREATE INDEX IF NOT EXISTS ix_class_students_student_id ON class_students(student_id)")

    # Latest exam score view (recreates)
    op.execute("""
    CREATE OR REPLACE VIEW latest_exam_score AS
    SELECT DISTINCT ON (student_id)
        student_id,
        exam_date,
        exam_type,
        total_marks,
        obtained_marks
    FROM exam_scores
    WHERE exam_type='term'
    ORDER BY student_id, exam_date DESC;
    """)


def downgrade():
    # Drop view first
    op.execute("DROP VIEW IF EXISTS latest_exam_score")
    # Drop indexes we added (only if table exists)
    try:
        op.drop_index('ix_exam_scores_date', table_name='exam_scores')
    except Exception:
        pass
    for raw in [
        "DROP INDEX IF EXISTS ix_attendance_events_student_date",
        "DROP INDEX IF EXISTS ix_fee_invoices_student_id",
        # don't drop class_students student_id index if other migrations may rely on it
    ]:
        op.execute(raw)
    # Drop table (ignore if absent)
    try:
        op.drop_table('exam_scores')
    except Exception:
        pass
