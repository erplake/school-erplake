"""student normalization tables

Revision ID: 20250928_0008
Revises: 20250928_0007
Create Date: 2025-09-28 00:05:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '20250928_0008'
down_revision: Union[str, None] = '20250928_0007'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        'student_tags',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('students.id', ondelete='CASCADE'), index=True, nullable=False),
        sa.Column('tag', sa.String(length=50), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
    )
    op.create_index('ix_student_tags_student_tag', 'student_tags', ['student_id','tag'])

    op.create_table(
        'student_transport',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('students.id', ondelete='CASCADE'), index=True, nullable=False),
        sa.Column('route', sa.String(length=50), nullable=False),
        sa.Column('stop', sa.String(length=100), nullable=False),
        sa.Column('active', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )
    op.create_index('ix_student_transport_student_active', 'student_transport', ['student_id','active'])

    op.create_table(
        'attendance_events',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('students.id', ondelete='CASCADE'), index=True, nullable=False),
        sa.Column('date', sa.Date(), nullable=False, index=True),
        sa.Column('present', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
    )
    op.create_index('ix_attendance_events_student_date', 'attendance_events', ['student_id','date'])

    op.create_table(
        'fee_invoices',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('students.id', ondelete='CASCADE'), index=True, nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('paid_amount', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('settled_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.create_index('ix_fee_invoices_student', 'fee_invoices', ['student_id'])


def downgrade() -> None:
    op.drop_table('fee_invoices')
    op.drop_table('attendance_events')
    op.drop_table('student_transport')
    op.drop_table('student_tags')
