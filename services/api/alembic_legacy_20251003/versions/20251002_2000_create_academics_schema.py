"""Create academics schema and shadow classroom tables

Revision ID: 20251002_2000_create_academics_schema
Revises: 20251002_1900_baseline_classroom
Create Date: 2025-10-02

Phase: Migration A (schema + empty duplicates)
"""
from alembic import op
import sqlalchemy as sa

revision = '20251002_2000_acad_schema'
# Rebased to attach to existing active head 20251002_1700
down_revision = '20251002_1700'
branch_labels = None
depends_on = None

TABLES = [
    # (name, columns_fn, indexes_fn)
]

def _create_students():
    op.create_table(
        'students',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('admission_no', sa.Text()),
        sa.Column('first_name', sa.Text(), nullable=False),
        sa.Column('last_name', sa.Text()),
        sa.Column('class', sa.Text()),
        sa.Column('section', sa.Text()),
        sa.Column('guardian_phone', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('gender', sa.Text()),
        sa.Column('roll', sa.Integer()),
        schema='academics'
    )

def _create_wings():
    op.create_table(
        'wings',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('academic_year', sa.Text(), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('grade_start', sa.Integer(), nullable=False),
        sa.Column('grade_end', sa.Integer(), nullable=False),
        sa.Column('target_ratio', sa.Integer()),
        sa.Column('head', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('academic_year','name', name='uq_academics_wings_year_name'),
        schema='academics'
    )
    op.create_index('ix_academics_wings_academic_year', 'wings', ['academic_year'], unique=False, schema='academics')

def _create_school_classes():
    op.create_table(
        'school_classes',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('academic_year', sa.Text(), nullable=False),
        sa.Column('wing_id', sa.Integer(), nullable=True),
        sa.Column('grade', sa.Integer(), nullable=False),
        sa.Column('section', sa.Text(), nullable=False),
        sa.Column('teacher_name', sa.Text()),
        sa.Column('target_ratio', sa.Integer()),
        sa.Column('head_teacher', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('academic_year','grade','section', name='uq_academics_school_classes_year_grade_section'),
        schema='academics'
    )
    op.create_index('ix_academics_school_classes_year_grade', 'school_classes', ['academic_year','grade'], schema='academics')

def _create_class_students():
    op.create_table(
        'class_students',
        sa.Column('class_id', sa.Integer(), primary_key=True),
        sa.Column('student_id', sa.Integer(), primary_key=True),
        sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        schema='academics'
    )
    op.create_index('ix_academics_class_students_class_id', 'class_students', ['class_id'], schema='academics')
    op.create_index('ix_academics_class_students_student_id', 'class_students', ['student_id'], schema='academics')

def _create_attendance():
    op.create_table(
        'attendance_events',
        sa.Column('student_id', sa.Integer(), primary_key=True),
        sa.Column('date', sa.Date(), primary_key=True),
        sa.Column('present', sa.Boolean(), nullable=False),
        schema='academics'
    )
    op.create_index('ix_academics_attendance_events_student_date', 'attendance_events', ['student_id','date'], schema='academics')

def _create_fee_invoices():
    op.create_table(
        'fee_invoices',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('paid_amount', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('settled_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        schema='academics'
    )
    op.create_index('ix_academics_fee_invoices_student_id', 'fee_invoices', ['student_id'], schema='academics')

def _create_student_tags():
    op.create_table(
        'student_tags',
        sa.Column('student_id', sa.Integer(), primary_key=True),
        sa.Column('tag', sa.Text(), primary_key=True),
        schema='academics'
    )

def _create_class_status():
    op.create_table(
        'class_status',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('grade', sa.Integer(), nullable=False),
        sa.Column('section', sa.Text(), nullable=False),
        sa.Column('result_status', sa.Text(), nullable=False, server_default='Pending'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('grade','section', name='uq_academics_class_status_grade_section'),
        schema='academics'
    )

def _create_class_teachers():
    op.create_table(
        'class_teachers',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('grade', sa.Integer(), nullable=False),
        sa.Column('section', sa.Text(), nullable=False),
        sa.Column('teacher_name', sa.Text(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('grade','section', name='uq_academics_class_teacher_grade_section'),
        schema='academics'
    )

def _create_exam_scores():
    op.create_table(
        'exam_scores',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('exam_date', sa.Date(), nullable=False),
        sa.Column('exam_type', sa.Text(), nullable=False, server_default='term'),
        sa.Column('total_marks', sa.Integer(), nullable=False),
        sa.Column('obtained_marks', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('student_id','exam_date','exam_type', name='uq_academics_exam_scores_student_date_type'),
        schema='academics'
    )
    op.create_index('ix_academics_exam_scores_date', 'exam_scores', ['exam_date'], schema='academics')

def upgrade():
    op.execute("CREATE SCHEMA IF NOT EXISTS academics")
    _create_students()
    _create_wings()
    _create_school_classes()
    _create_class_students()
    _create_attendance()
    _create_fee_invoices()
    _create_student_tags()
    _create_class_status()
    _create_class_teachers()
    _create_exam_scores()
    # Defer latest_exam_score view until data copy phase (Migration B)


def downgrade():
    # Drop in reverse order
    for name in [
        'exam_scores','class_teachers','class_status','student_tags','fee_invoices','attendance_events','class_students','school_classes','wings','students'
    ]:
        try:
            op.drop_table(name, schema='academics')
        except Exception:
            pass
    for idx in [
        'ix_academics_exam_scores_date','ix_academics_fee_invoices_student_id','ix_academics_attendance_events_student_date','ix_academics_class_students_student_id','ix_academics_class_students_class_id','ix_academics_school_classes_year_grade','ix_academics_wings_academic_year'
    ]:
        try:
            op.drop_index(idx, table_name=None, schema='academics')
        except Exception:
            pass
    op.execute("DROP SCHEMA IF EXISTS academics CASCADE")
