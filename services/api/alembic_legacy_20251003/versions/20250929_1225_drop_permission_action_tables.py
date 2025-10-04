"""Drop unused permission_action tables (unify on core.permission)

Revision ID: 20250929_1225
Revises: 20250929_1215
Create Date: 2025-09-29
"""
from alembic import op
import sqlalchemy as sa

revision = '20250929_1225'
down_revision = '20250929_1215'
branch_labels = None
depends_on = None

def upgrade():
    conn = op.get_bind()
    for tbl in ('core.user_permission_override','core.role_permission_action','core.permission_action'):
        try:
            conn.execute(sa.text(f'DROP TABLE IF EXISTS {tbl} CASCADE'))
        except Exception:
            pass

def downgrade():
    # Re-create empty shells (no data restoration) for reversibility
    op.execute("""
    CREATE TABLE IF NOT EXISTS core.permission_action (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      UNIQUE (module, action)
    );
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS core.role_permission_action (
      role core.role NOT NULL,
      permission_action_id BIGINT REFERENCES core.permission_action(id) ON DELETE CASCADE,
      PRIMARY KEY (role, permission_action_id)
    );
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS core.user_permission_override (
      user_id BIGINT REFERENCES core.user_account(id) ON DELETE CASCADE,
      permission_action_id BIGINT REFERENCES core.permission_action(id) ON DELETE CASCADE,
      allow BOOLEAN NOT NULL,
      PRIMARY KEY (user_id, permission_action_id)
    );
    """)