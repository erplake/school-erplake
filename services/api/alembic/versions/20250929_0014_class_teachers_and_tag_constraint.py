"""add class_teachers table and student tag unique constraint

Revision ID: 20250929_0014
Revises: 20250928_0013
Create Date: 2025-09-29
"""
from alembic import op
import sqlalchemy as sa

revision = '20250929_0014'
down_revision = '20250928_0013'
branch_labels = None
depends_on = None


def upgrade():
    # class_teachers table (if it doesn't already exist when applying fresh)
    conn = op.get_bind()
    # Create class_teachers only if not exists (Alembic doesn't have native IF NOT EXISTS for create_table)
    exists = conn.exec_driver_sql("SELECT 1 FROM information_schema.tables WHERE table_name='class_teachers' AND table_schema='public'").scalar()
    if not exists:
        op.create_table(
            'class_teachers',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('grade', sa.Integer(), nullable=False),
            sa.Column('section', sa.String(), nullable=False),
            sa.Column('teacher_name', sa.String(), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.UniqueConstraint('grade','section', name='uq_class_teacher_grade_section')
        )
    # student_tags uniqueness (safe guard – ignore if already exists)
    existing = conn.exec_driver_sql("""
        SELECT 1 FROM pg_constraint WHERE conname='uq_student_tag_unique'
    """).scalar()
    if not existing:
        op.create_unique_constraint('uq_student_tag_unique', 'student_tags', ['student_id','tag'])


def downgrade():
    # Drop class_teachers (other alterations are non-reversible pragmatically)
    op.drop_table('class_teachers')
    # Can't reliably remove constraints/defaults without deeper inspection – accepted limitation.
