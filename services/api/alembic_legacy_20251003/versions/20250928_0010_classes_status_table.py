"""class status table

Revision ID: 20250928_0010
Revises: 20250928_0009
Create Date: 2025-09-28
"""
from alembic import op
import sqlalchemy as sa

revision = '20250928_0010'
down_revision = '20250928_0009'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'class_status',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('grade', sa.Integer(), nullable=False),
        sa.Column('section', sa.String(), nullable=False),
        sa.Column('result_status', sa.String(), nullable=False, server_default='Pending'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.UniqueConstraint('grade','section', name='uq_class_status_grade_section')
    )

def downgrade():
    op.drop_table('class_status')
