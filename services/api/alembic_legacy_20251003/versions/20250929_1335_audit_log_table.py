"""Create audit_log table and add audit_read permission

Revision ID: 20250929_1335
Revises: 20250929_1330
Create Date: 2025-09-29
"""
from alembic import op
import sqlalchemy as sa

revision = '20250929_1335'
down_revision = '20250929_1330'
branch_labels = None
depends_on = None

NEW_PERMISSION = ('ops:audit_read','Read audit log entries')


def upgrade():
    op.create_table(
        'audit_log',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('user_id', sa.BigInteger()),
        sa.Column('school_id', sa.BigInteger()),
        sa.Column('action', sa.Text(), nullable=False),
        sa.Column('object_type', sa.Text()),
        sa.Column('object_id', sa.Text()),
        sa.Column('verb', sa.Text()),
        sa.Column('before', sa.JSON()),
        sa.Column('after', sa.JSON()),
        sa.Column('request_id', sa.Text()),
        sa.Column('ip', sa.Text()),
        sa.Column('user_agent', sa.Text()),
        schema='core'
    )
    # Permission catalog insert (best effort)
    try:
        op.execute(sa.text("INSERT INTO core.permission(code, description) VALUES (:c,:d) ON CONFLICT (code) DO NOTHING"), {'c': NEW_PERMISSION[0], 'd': NEW_PERMISSION[1]})
        op.execute(sa.text("INSERT INTO core.role_permission(role, permission_code) VALUES ('ADMIN', :p) ON CONFLICT DO NOTHING"), {'p': NEW_PERMISSION[0]})
    except Exception:
        pass


def downgrade():
    op.drop_table('audit_log', schema='core')
    try:
        op.execute(sa.text("DELETE FROM core.role_permission WHERE role='ADMIN' AND permission_code=:p"), {'p': NEW_PERMISSION[0]})
        op.execute(sa.text("DELETE FROM core.permission WHERE code=:c"), {'c': NEW_PERMISSION[0]})
    except Exception:
        pass
