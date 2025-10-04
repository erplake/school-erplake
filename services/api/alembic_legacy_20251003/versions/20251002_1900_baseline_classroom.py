"""baseline classroom schema

Revision ID: 20251002_1900_baseline_classroom
Revises: 
Create Date: 2025-10-02

This establishes the classroom-related public tables after DB reset.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = '20251002_1900_baseline_classroom'
down_revision = None
branch_labels = None
depends_on = None

def _ensure_table(name: str, creator):
    """Utility: run creator() only if table 'name' does not already exist.
    Makes this baseline migration safe to re-run or to apply after manual bootstrapping."""
    bind = op.get_bind()
    insp = inspect(bind)
    if insp.has_table(name, schema=None):
        return
    creator()

def upgrade():
    # students
    def _students():
        op.create_table(
            'students',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('admission_no', sa.Text()),
            sa.Column('first_name', sa.Text(), nullable=False),
            sa.Column('last_name', sa.Text()),
            sa.Column('class', sa.Text()),
            sa.Column('section', sa.Text()),
            sa.Column('guardian_phone', sa.Text()),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('gender', sa.Text()),
            sa.Column('roll', sa.Integer())
        )
    _ensure_table('students', _students)

    # wings
    def _wings():
        op.create_table(
            'wings',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('academic_year', sa.Text(), nullable=False),
            sa.Column('name', sa.Text(), nullable=False),
            sa.Column('grade_start', sa.Integer(), nullable=False),
            sa.Column('grade_end', sa.Integer(), nullable=False),
            sa.Column('target_ratio', sa.Integer()),
            sa.Column('head', sa.Text()),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.UniqueConstraint('academic_year','name', name='uq_wings_year_name')
        )
        op.create_index('ix_wings_academic_year', 'wings', ['academic_year'])
    _ensure_table('wings', _wings)

    # school_classes
    def _school_classes():
        op.create_table(
            'school_classes',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('academic_year', sa.Text(), nullable=False),
            sa.Column('wing_id', sa.Integer(), sa.ForeignKey('wings.id', ondelete='CASCADE')),
            sa.Column('grade', sa.Integer(), nullable=False),
            sa.Column('section', sa.Text(), nullable=False),
            sa.Column('teacher_name', sa.Text()),
            sa.Column('target_ratio', sa.Integer()),
            sa.Column('head_teacher', sa.Text()),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.UniqueConstraint('academic_year','grade','section', name='uq_school_classes_year_grade_section')
        )
        op.create_index('ix_school_classes_year_grade', 'school_classes', ['academic_year','grade'])
    _ensure_table('school_classes', _school_classes)

    # class_students
    def _class_students():
        op.create_table(
            'class_students',
            sa.Column('class_id', sa.Integer(), sa.ForeignKey('school_classes.id', ondelete='CASCADE'), primary_key=True),
            sa.Column('student_id', sa.Integer(), primary_key=True),
            sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
        )
        op.create_index('ix_class_students_class_id', 'class_students', ['class_id'])
        op.create_index('ix_class_students_student_id', 'class_students', ['student_id'])
    _ensure_table('class_students', _class_students)

    # attendance_events
    def _attendance_events():
        op.create_table(
            'attendance_events',
            sa.Column('student_id', sa.Integer(), primary_key=True),
            sa.Column('date', sa.Date(), primary_key=True),
            sa.Column('present', sa.Boolean(), nullable=False)
        )
        op.create_index('ix_attendance_events_student_date', 'attendance_events', ['student_id','date'])
    _ensure_table('attendance_events', _attendance_events)

    # fee_invoices
    def _fee_invoices():
        op.create_table(
            'fee_invoices',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('student_id', sa.Integer(), nullable=False),
            sa.Column('amount', sa.Integer(), nullable=False),
            sa.Column('paid_amount', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('due_date', sa.Date(), nullable=False),
            sa.Column('settled_at', sa.DateTime(timezone=True)),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
        )
        op.create_index('ix_fee_invoices_student_id', 'fee_invoices', ['student_id'])
    _ensure_table('fee_invoices', _fee_invoices)

    # student_tags
    def _student_tags():
        op.create_table(
            'student_tags',
            sa.Column('student_id', sa.Integer(), primary_key=True),
            sa.Column('tag', sa.Text(), primary_key=True)
        )
    _ensure_table('student_tags', _student_tags)

    # class_status
    def _class_status():
        op.create_table(
            'class_status',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('grade', sa.Integer(), nullable=False),
            sa.Column('section', sa.Text(), nullable=False),
            sa.Column('result_status', sa.Text(), nullable=False, server_default='Pending'),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.UniqueConstraint('grade','section', name='uq_class_status_grade_section')
        )
    _ensure_table('class_status', _class_status)

    # class_teachers
    def _class_teachers():
        op.create_table(
            'class_teachers',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('grade', sa.Integer(), nullable=False),
            sa.Column('section', sa.Text(), nullable=False),
            sa.Column('teacher_name', sa.Text(), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.UniqueConstraint('grade','section', name='uq_class_teacher_grade_section')
        )
    _ensure_table('class_teachers', _class_teachers)

    # exam_scores + index
    def _exam_scores():
        op.create_table(
            'exam_scores',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('student_id', sa.Integer(), nullable=False),
            sa.Column('exam_date', sa.Date(), nullable=False),
            sa.Column('exam_type', sa.Text(), nullable=False, server_default='term'),
            sa.Column('total_marks', sa.Integer(), nullable=False),
            sa.Column('obtained_marks', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.UniqueConstraint('student_id','exam_date','exam_type', name='uq_exam_scores_student_date_type')
        )
        op.create_index('ix_exam_scores_date', 'exam_scores', ['exam_date'])
    _ensure_table('exam_scores', _exam_scores)

    # helper view latest_exam_score (optional analytics)
    op.execute("""
    CREATE OR REPLACE VIEW latest_exam_score AS
    SELECT DISTINCT ON (student_id)
        student_id, exam_date, exam_type, total_marks, obtained_marks
    FROM exam_scores
    WHERE exam_type='term'
    ORDER BY student_id, exam_date DESC;
    """)


def downgrade():
    op.execute("DROP VIEW IF EXISTS latest_exam_score")
    for name in [
        'ix_exam_scores_date', 'ix_fee_invoices_student_id', 'ix_attendance_events_student_date',
        'ix_class_students_student_id', 'ix_class_students_class_id', 'ix_school_classes_year_grade',
        'ix_wings_academic_year'
    ]:
        try:
            op.drop_index(name)
        except Exception:
            pass
    for tbl in [
        'exam_scores','class_teachers','class_status','student_tags','fee_invoices','attendance_events',
        'class_students','school_classes','wings','students'
    ]:
        try:
            op.drop_table(tbl)
        except Exception:
            pass
