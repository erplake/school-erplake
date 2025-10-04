"""Encrypt existing integration credential rows (if key present)

Revision ID: 20250929_1235
Revises: 20250929_1225
Create Date: 2025-09-29
"""
from alembic import op
import sqlalchemy as sa
from app.core import crypto

revision = '20250929_1235'
down_revision = '20250929_1225'
branch_labels = None
depends_on = None

def upgrade():
    conn = op.get_bind()
    try:
        rows = conn.execute(sa.text("SELECT id, credentials_enc FROM settings.integration_credential")).mappings().all()
        for r in rows:
            enc = r['credentials_enc'] or ''
            # Skip if already tagged
            if enc.startswith('ENC:') or enc.startswith('PLAINTEXT:'):
                continue
            # Legacy base64(json) or raw json repr; attempt parse via model helper
            # We reuse decrypt_dict pathway by prepending PLAINTEXT tag
            new_val = crypto.encrypt_dict(crypto.decrypt_dict('PLAINTEXT:' + enc))
            conn.execute(sa.text("UPDATE settings.integration_credential SET credentials_enc=:v WHERE id=:i"), {'v': new_val, 'i': r['id']})
    except Exception:
        pass

def downgrade():
    # Cannot reliably restore original plaintext forms; leave as-is
    pass