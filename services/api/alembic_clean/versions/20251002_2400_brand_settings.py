"""Create brand_settings table if not exists.

Revision timestamp 20251002_2400.
Idempotent pattern (raw SQL with IF NOT EXISTS) consistent with earlier migrations.
"""
from alembic import op  # type: ignore
import sqlalchemy as sa  # type: ignore

revision = "20251002_2400_brand_settings"
down_revision = "20251002_2300_class_staff"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    conn.execute(sa.text(
        """
        CREATE TABLE IF NOT EXISTS brand_settings (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            school_name TEXT NOT NULL DEFAULT 'My School',
            principal_name TEXT,
            phone_primary TEXT,
            phone_transport TEXT,
            email_contact TEXT,
            location_address TEXT,
            address_line1 TEXT,
            address_line2 TEXT,
            city TEXT,
            state TEXT,
            country TEXT,
            postal_code TEXT,
            logo_url TEXT,
            website_url TEXT,
            tagline TEXT,
            social_links JSONB,
            updated_by TEXT,
            updated_at timestamptz DEFAULT now() NOT NULL
        );
        """
    ))


def downgrade():
    raise RuntimeError("Downgrade not supported for brand_settings")
