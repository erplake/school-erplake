"""Extend permission catalog for files, comms, payments

Revision ID: 20250929_1205
Revises: 20250929_1100
Create Date: 2025-09-29
"""
from alembic import op
import sqlalchemy as sa

revision = '20250929_1205'
down_revision = '20250929_1100'
branch_labels = None
depends_on = None

NEW_PERMISSIONS = [
    # Files
    ('files:blob_register','Register file blob metadata'),
    ('files:blob_read','Read file blob metadata'),
    ('files:attachment_create','Create attachment linking blob to entity'),
    ('files:attachment_read','Read attachment metadata'),
    # Comms
    ('comms:template_create','Create message template'),
    ('comms:template_list','List message templates'),
    ('comms:outbox_enqueue','Enqueue outbound message'),
    ('comms:outbox_read','Read outbox record'),
    # Payments
    ('payments:tx_create','Create payment gateway transaction record'),
    ('payments:tx_read','Read payment gateway transaction'),
    ('payments:recon_create','Append reconciliation ledger entry'),
    ('payments:recon_read','Read reconciliation ledger entry'),
]

ROLE_PATCH = {
    'ADMIN': [p for p,_ in NEW_PERMISSIONS],
    'ACCOUNTANT': ['payments:tx_create','payments:tx_read','payments:recon_create','payments:recon_read'],
}

def upgrade():
    # Insert new permissions
    for code, desc in NEW_PERMISSIONS:
        op.execute(sa.text("INSERT INTO core.permission(code, description) VALUES (:c,:d) ON CONFLICT (code) DO NOTHING"), {'c': code, 'd': desc})
    # Map to roles
    for role, perms in ROLE_PATCH.items():
        for p in perms:
            op.execute(sa.text("INSERT INTO core.role_permission(role, permission_code) VALUES (:r,:p) ON CONFLICT DO NOTHING"), {'r': role, 'p': p})

def downgrade():
    # Remove role mappings then permissions
    for role, perms in ROLE_PATCH.items():
        for p in perms:
            op.execute(sa.text("DELETE FROM core.role_permission WHERE role=:r AND permission_code=:p"), {'r': role, 'p': p})
    for code, _ in NEW_PERMISSIONS:
        op.execute(sa.text("DELETE FROM core.permission WHERE code=:c"), {'c': code})
