"""staff duties table + permission seed

Revision ID: 20251003_0055_staff_duties_and_permission
Revises: 20251003_0045_staff_settings
Create Date: 2025-10-03

Idempotent creation; safe to re-run.
"""
from alembic import op  # type: ignore
import sqlalchemy as sa  # type: ignore

revision = '20251003_0055_staff_duties_and_permission'
down_revision = '20251003_0045_staff_settings'
branch_labels = None
depends_on = None

PERMISSION_CODE = 'staff:duty'
PERMISSION_DESC = 'Assign staff duties'


def upgrade():
    conn = op.get_bind()
    # Create table if not exists (add new columns if missing)
    conn.execute(sa.text(
        """
        CREATE TABLE IF NOT EXISTS staff_duties (
            id SERIAL PRIMARY KEY,
            staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
            title VARCHAR(120) NOT NULL,
            duty_date DATE NOT NULL,
            notes VARCHAR(255),
            email_outbox_id INTEGER NULL,
            whatsapp_outbox_id INTEGER NULL,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_staff_duties_staff_id ON staff_duties(staff_id);
        CREATE INDEX IF NOT EXISTS idx_staff_duties_duty_date ON staff_duties(duty_date);
        """
    ))
    # Add columns if table existed without them
    for col in ['email_outbox_id','whatsapp_outbox_id']:
        try:
            conn.execute(sa.text(f"ALTER TABLE staff_duties ADD COLUMN IF NOT EXISTS {col} INTEGER"))
        except Exception:  # pragma: no cover
            pass
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
    raise RuntimeError('Downgrade not supported for staff_duties')
