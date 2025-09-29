"""admissions and leaves tables

Revision ID: 20250928_0009
Revises: 20250928_0008
Create Date: 2025-09-28
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '20250928_0009'
down_revision: Union[str, None] = '20250928_0008'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        'admission_applications',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('applicant_first_name', sa.String(length=100), nullable=False),
        sa.Column('applicant_last_name', sa.String(length=100), nullable=True),
        sa.Column('desired_class', sa.String(length=50), nullable=True),
        sa.Column('academic_year', sa.String(length=20), nullable=True),
        sa.Column('dob', sa.Date(), nullable=True),
        sa.Column('guardian_primary_name', sa.String(length=100), nullable=True),
        sa.Column('guardian_primary_phone', sa.String(length=30), nullable=True),
        sa.Column('guardian_secondary_name', sa.String(length=100), nullable=True),
        sa.Column('guardian_secondary_phone', sa.String(length=30), nullable=True),
        sa.Column('prior_school', sa.String(length=150), nullable=True),
        sa.Column('fee_plan_requested', sa.String(length=50), nullable=True),
        sa.Column('documents', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('notes_internal', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('status_history', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('enrolled_student_id', sa.Integer(), sa.ForeignKey('students.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_admission_applications_status', 'admission_applications', ['status'])
    op.create_index('ix_admission_applications_year', 'admission_applications', ['academic_year'])

    op.create_table(
        'leave_requests',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('student_id', sa.Integer(), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('type', sa.String(length=20), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('requested_by', sa.String(length=50), nullable=True),
        sa.Column('approved_by', sa.String(length=50), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('attachment', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('auto_generated_absence_events', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_leave_requests_student', 'leave_requests', ['student_id'])
    op.create_index('ix_leave_requests_status', 'leave_requests', ['status'])

def downgrade() -> None:
    op.drop_table('leave_requests')
    op.drop_table('admission_applications')