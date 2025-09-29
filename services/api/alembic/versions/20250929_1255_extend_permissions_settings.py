"""Extend permission catalog for settings config & credentials

Revision ID: 20250929_1255
Revises: 20250929_1245
Create Date: 2025-09-29
"""
from alembic import op
import sqlalchemy as sa

revision = '20250929_1255'
down_revision = '20250929_1245'
branch_labels = None
depends_on = None

NEW_PERMISSIONS = [
    ('settings:config_read','List configuration entries'),
    ('settings:config_write','Create or update configuration entry'),
    ('settings:credential_read','List integration credentials'),
    ('settings:credential_write','Create integration credential'),
]

ROLE_PATCH = {
    'ADMIN': [p for p,_ in NEW_PERMISSIONS],
    'ACCOUNTANT': ['settings:config_read'],
}

def upgrade():
    for code, desc in NEW_PERMISSIONS:
        op.execute(sa.text("INSERT INTO core.permission(code, description) VALUES (:c,:d) ON CONFLICT (code) DO NOTHING"), {'c': code, 'd': desc})
    for role, perms in ROLE_PATCH.items():
        for p in perms:
            op.execute(sa.text("INSERT INTO core.role_permission(role, permission_code) VALUES (:r,:p) ON CONFLICT DO NOTHING"), {'r': role, 'p': p})

def downgrade():
    for role, perms in ROLE_PATCH.items():
        for p in perms:
            op.execute(sa.text("DELETE FROM core.role_permission WHERE role=:r AND permission_code=:p"), {'r': role, 'p': p})
    for code, _ in NEW_PERMISSIONS:
        op.execute(sa.text("DELETE FROM core.permission WHERE code=:c"), {'c': code})