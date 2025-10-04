"""add gender and roll columns

Revision ID: 20250928_0011
Revises: 20250928_0010
Create Date: 2025-09-28
"""
from alembic import op
import sqlalchemy as sa

revision = '20250928_0011'
down_revision = '20250928_0010'
branch_labels = None
depends_on = None

def upgrade():
    # Add columns nullable first
    op.add_column('students', sa.Column('gender', sa.String(length=1), nullable=True))
    op.add_column('students', sa.Column('roll', sa.Integer(), nullable=True))
    conn = op.get_bind()
    # Backfill roll numbers per (class, section) ordering by id
    # (Gender left null until provided; we won't guess.)
    res = conn.execute(sa.text("""
        SELECT id, class, section FROM students 
        WHERE class IS NOT NULL AND section IS NOT NULL
        ORDER BY class::int NULLS LAST, section, id
    """))
    # Build roll mapping
    from collections import defaultdict
    counters = defaultdict(int)
    updates = []
    for sid, klass, section in res:
        key = (klass, section)
        counters[key] += 1
        updates.append((counters[key], sid))
    if updates:
        # Execute batch update
        for roll_val, sid in updates:
            conn.execute(sa.text("UPDATE students SET roll=:roll WHERE id=:id"), {"roll": roll_val, "id": sid})
    # Optionally create index for faster roster ordering
    op.create_index('ix_students_class_section_roll', 'students', ['class','section','roll'])

def downgrade():
    op.drop_index('ix_students_class_section_roll', table_name='students')
    op.drop_column('students', 'roll')
    op.drop_column('students', 'gender')
