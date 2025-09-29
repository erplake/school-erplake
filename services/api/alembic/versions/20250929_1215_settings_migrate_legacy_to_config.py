"""Migrate legacy brand/integration tables to new settings.config model

Revision ID: 20250929_1215
Revises: 20250929_1205
Create Date: 2025-09-29
"""
from alembic import op
import sqlalchemy as sa
import json

revision = '20250929_1215'
down_revision = '20250929_1205'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    # Attempt to copy single legacy brand_settings row into key/value pairs
    try:
        brand = conn.execute(sa.text("SELECT * FROM brand_settings LIMIT 1")).mappings().first()
        if brand:
            key_map = {
                'school_name': 'branding.school_name',
                'principal_name': 'branding.principal_name',
                'logo_url': 'branding.logo_url',
                'website_url': 'branding.website_url',
                'tagline': 'branding.tagline',
                'social_links': 'branding.social_links',
            }
            for col, key in key_map.items():
                val = brand.get(col)
                if val is None:
                    continue
                conn.execute(sa.text("INSERT INTO settings.config(school_id, key, value_json, is_secret) VALUES (:sid,:k,:v,false) ON CONFLICT (school_id,key) DO NOTHING"),
                             {'sid': 1, 'k': key, 'v': json.dumps(val)})
    except Exception:
        # legacy table may not exist in clean env
        pass

    # Integrations -> credentials (store config as credentials_enc placeholder)
    try:
        rows = conn.execute(sa.text("SELECT provider, config FROM integration_settings"))
        for r in rows:
            cfg_json = r.config if isinstance(r.config, str) else json.dumps(r.config or {})
            # base64 encode done later by app; here we just store plain text for simplicity
            conn.execute(sa.text("INSERT INTO settings.config(school_id, key, value_json, is_secret) VALUES (:sid,:k,:v,false) ON CONFLICT (school_id,key) DO NOTHING"),
                         {'sid':1,'k':f'integration.{r.provider}','v': cfg_json})
    except Exception:
        pass


def downgrade():
    # Best-effort: remove inserted keys (branding.* and integration.*)
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM settings.config WHERE key LIKE 'branding.%' OR key LIKE 'integration.%'"))
