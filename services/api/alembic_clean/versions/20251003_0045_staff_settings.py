"""staff settings table

Revision ID: 20251003_0045_staff_settings
Revises: 20251003_0035_staff_taxonomy_permission
Create Date: 2025-10-03
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20251003_0045_staff_settings'
down_revision = '20251003_0035_staff_taxonomy_permission'
branch_labels = None
depends_on = None

def upgrade():
    conn = op.get_bind()
    # idempotent creation
    conn.execute(sa.text("""
    CREATE TABLE IF NOT EXISTS staff_settings (
        key text PRIMARY KEY,
        value_json jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
    );
    """))
    # seed default keys if missing
    for k, default_val in [
        ('leave_policy', '{"carryover_limit":10,"monthly_accrual":1.5,"max_negative":0}'),
        ('staff_code_rules', '{"pattern":"{DEPT}-{SEQ:4}","seq_start":1001,"pad":4}')
    ]:
        conn.execute(sa.text("""
            INSERT INTO staff_settings (key, value_json)
            VALUES (:k, (:v)::jsonb)
            ON CONFLICT (key) DO NOTHING
        """), { 'k': k, 'v': default_val })


def downgrade():
    # keep data (no destructive downgrade)
    pass
