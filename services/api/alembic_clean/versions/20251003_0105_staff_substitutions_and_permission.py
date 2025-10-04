"""staff substitutions table + permission seed

Revision ID: 20251003_0105_staff_substitutions_and_permission
Revises: 20251003_0055_staff_duties_and_permission
Create Date: 2025-10-03

Idempotent creation; safe to re-run.
"""
from alembic import op  # type: ignore
import sqlalchemy as sa  # type: ignore

revision = '20251003_0105_staff_substitutions_and_permission'
down_revision = '20251003_0055_staff_duties_and_permission'
branch_labels = None
depends_on = None

PERMISSION_CODE = 'staff:substitutions'
PERMISSION_DESC = 'Plan staff substitutions'

def upgrade():
    conn = op.get_bind()
    # Create table if not exists
    conn.execute(sa.text(
        """
        CREATE TABLE IF NOT EXISTS staff_substitutions (
            id SERIAL PRIMARY KEY,
            absent_staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
            covering_staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
            date_from DATE NOT NULL,
            date_to DATE NOT NULL,
            notes VARCHAR(255),
            email_outbox_id INTEGER NULL,
            whatsapp_outbox_id INTEGER NULL,
            created_at TIMESTAMPTZ DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_staff_subs_absent ON staff_substitutions(absent_staff_id);
        CREATE INDEX IF NOT EXISTS idx_staff_subs_covering ON staff_substitutions(covering_staff_id);
        CREATE INDEX IF NOT EXISTS idx_staff_subs_date_from ON staff_substitutions(date_from);
        CREATE INDEX IF NOT EXISTS idx_staff_subs_date_to ON staff_substitutions(date_to);
        """
    ))
    # Seed permission if RBAC tables exist
    try:
        exists = conn.execute(sa.text("SELECT 1 FROM core.permission WHERE code=:c"), {'c': PERMISSION_CODE}).first()
        if not exists:
            conn.execute(sa.text("INSERT INTO core.permission (code, description) VALUES (:c,:d)"), {'c': PERMISSION_CODE, 'd': PERMISSION_DESC})
            # Grant to Admin & Principal roles if they exist
            for role_code in ('ADMIN','PRINCIPAL'):
                role = conn.execute(sa.text("SELECT id FROM core.role WHERE code=:rc"), {'rc': role_code}).first()
                perm = conn.execute(sa.text("SELECT id FROM core.permission WHERE code=:c"), {'c': PERMISSION_CODE}).first()
                if role and perm:
                    conn.execute(sa.text("INSERT INTO core.role_permission (role_id, permission_id) VALUES (:r,:p) ON CONFLICT DO NOTHING"), {'r': role.id, 'p': perm.id})
    except Exception:
        # RBAC not initialized yet; ignore
        pass


def downgrade():  # pragma: no cover
    raise RuntimeError('Downgrade not supported for staff_substitutions')
