"""staff and staff leave tables

Revision ID: 20250928_0012
Revises: 20250928_0011
Create Date: 2025-09-28
"""
from alembic import op
import sqlalchemy as sa

revision = '20250928_0012'
down_revision = '20250928_0011'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'staff',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('staff_code', sa.String(20), unique=True, nullable=False),
        sa.Column('name', sa.String(120), nullable=False),
        sa.Column('role', sa.String(50), nullable=False),
        sa.Column('department', sa.String(80), nullable=True),
        sa.Column('grade', sa.String(40), nullable=True),
        sa.Column('email', sa.String(120), nullable=True),
        sa.Column('phone', sa.String(40), nullable=True, index=True),
        sa.Column('date_of_joining', sa.Date(), nullable=True),
        sa.Column('birthday', sa.Date(), nullable=True),
        sa.Column('reports_to', sa.String(120), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='Active'),
        sa.Column('attendance_30', sa.Integer(), server_default='0'),
        sa.Column('leaves_taken_ytd', sa.Integer(), server_default='0'),
        sa.Column('leave_balance', sa.Integer(), server_default='0'),
        sa.Column('last_appraisal', sa.Date(), nullable=True),
        sa.Column('next_appraisal', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_staff_department_role', 'staff', ['department','role'])

    op.create_table(
        'staff_leave_requests',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('staff_id', sa.Integer(), sa.ForeignKey('staff.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('leave_type', sa.String(50), nullable=False),
        sa.Column('date_from', sa.Date(), nullable=False),
        sa.Column('date_to', sa.Date(), nullable=False),
        sa.Column('days', sa.Integer(), nullable=False),
        sa.Column('reason', sa.String(255), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='Pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )


def downgrade():
    op.drop_table('staff_leave_requests')
    op.drop_index('ix_staff_department_role', table_name='staff')
    op.drop_table('staff')
