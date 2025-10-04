"""Add core.school_user membership table

Revision ID: 20250929_1325
Revises: 20250929_1315
Create Date: 2025-09-29
"""
from alembic import op
import sqlalchemy as sa

revision = '20250929_1325'
down_revision = '20250929_1315'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'school_user',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('school_id', sa.BigInteger(), sa.ForeignKey('core.school.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.BigInteger(), sa.ForeignKey('core.user_account.id', ondelete='CASCADE'), nullable=False),
        sa.Column('roles', sa.ARRAY(sa.String()), nullable=False, server_default=sa.text("'{}'")),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('school_id','user_id', name='uq_school_user_membership'),
        schema='core'
    )
    op.create_index('ix_school_user_user', 'school_user', ['user_id'], unique=False, schema='core')


def downgrade():
    op.drop_index('ix_school_user_user', table_name='school_user', schema='core')
    op.drop_table('school_user', schema='core')
