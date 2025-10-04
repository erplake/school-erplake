"""wings / classes / class_students tables

Revision ID: 20251002_1500
Revises: 20250929_1400
Create Date: 2025-10-02
"""
from alembic import op
import sqlalchemy as sa

revision = '20251002_1500'
down_revision = '20250929_1400'
branch_labels = None
depends_on = None


def upgrade():
    # wings table
    op.create_table(
        'wings',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('academic_year', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('grade_start', sa.Integer(), nullable=False),
        sa.Column('grade_end', sa.Integer(), nullable=False),
        sa.Column('target_ratio', sa.Integer(), nullable=True),
        sa.Column('head', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('academic_year','name', name='uq_wings_year_name')
    )
    op.create_index('ix_wings_academic_year', 'wings', ['academic_year'])

    # school_classes table
    op.create_table(
        'school_classes',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('academic_year', sa.String(), nullable=False),
        sa.Column('wing_id', sa.Integer(), sa.ForeignKey('wings.id', ondelete='CASCADE'), nullable=True),
        sa.Column('grade', sa.Integer(), nullable=False),
        sa.Column('section', sa.String(), nullable=False),
        sa.Column('teacher_name', sa.String(), nullable=True),
        sa.Column('target_ratio', sa.Integer(), nullable=True),
        sa.Column('head_teacher', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('academic_year','grade','section', name='uq_school_classes_year_grade_section')
    )
    op.create_index('ix_school_classes_year_grade', 'school_classes', ['academic_year','grade'])

    # class_students table (association)
    op.create_table(
        'class_students',
        sa.Column('class_id', sa.Integer(), sa.ForeignKey('school_classes.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('student_id', sa.Integer(), primary_key=True),
        sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index('ix_class_students_class_id', 'class_students', ['class_id'])
    op.create_index('ix_class_students_student_id', 'class_students', ['student_id'])

    # Optional helper view for aggregate counts (drop/recreate idempotent)
    op.execute("""
    CREATE OR REPLACE VIEW class_aggregate AS
    SELECT sc.id as class_id,
           sc.academic_year,
           sc.grade,
           sc.section,
           sc.teacher_name,
           sc.target_ratio,
           sc.wing_id,
           COUNT(cs.student_id) AS total_students
      FROM school_classes sc
      LEFT JOIN class_students cs ON cs.class_id = sc.id
     GROUP BY sc.id;
    """)


def downgrade():
    op.execute("DROP VIEW IF EXISTS class_aggregate")
    op.drop_index('ix_class_students_student_id', table_name='class_students')
    op.drop_index('ix_class_students_class_id', table_name='class_students')
    op.drop_table('class_students')
    op.drop_index('ix_school_classes_year_grade', table_name='school_classes')
    op.drop_table('school_classes')
    op.drop_index('ix_wings_academic_year', table_name='wings')
    op.drop_table('wings')
