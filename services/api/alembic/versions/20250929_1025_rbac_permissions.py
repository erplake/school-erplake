"""RBAC permission catalog

Revision ID: 20250929_1025
Revises: 20250929_1018
Create Date: 2025-09-29
"""
from alembic import op
import sqlalchemy as sa

revision = '20250929_1025'
down_revision = '20250929_1018'
branch_labels = None
depends_on = None

PERMISSIONS = [
    # Students
    ('students:list','List students'),
    ('students:create','Create student'),
    ('students:update','Update student'),
    ('students:message','Send guardian message'),
    ('students:bonafide','Generate bonafide certificate'),
    # Attendance
    ('attendance:mark','Mark attendance'),
    ('attendance:view','View attendance'),
    # Fees
    ('fees:create_invoice','Create fee invoice'),
    ('fees:view_invoice','View fee invoice'),
    # Staff
    ('staff:list','List staff'),
    ('staff:detail','View staff detail'),
    ('staff:create','Create staff'),
    ('staff:update','Update staff record'),
    ('staff:leave','Manage staff leave'),
    # Transport
    ('transport:read','View transport entities'),
    ('transport:write','Create/Update transport entities'),
    ('transport:maint','Log maintenance / incidents'),
    ('transport:gps','Ingest GPS pings'),
]

ROLE_DEFAULTS = {
    'ADMIN': [p for p,_ in PERMISSIONS],
    'PRINCIPAL': [
        'students:list','students:bonafide','attendance:view',
        'fees:view_invoice','staff:list','staff:detail','staff:leave','transport:read'
    ],
    'CLASS_TEACHER': [
        'students:list','students:bonafide','attendance:mark','attendance:view'
    ],
    'SUBJECT_TEACHER': [
        'students:list','attendance:mark','attendance:view'
    ],
    'ACCOUNTANT': [ 'fees:create_invoice','fees:view_invoice' ],
    'LIBRARIAN': [ ],
    'TRANSPORT': [ 'transport:read','transport:write','transport:maint','transport:gps' ],
    'PARENT': [ 'students:list','attendance:view','fees:view_invoice' ],
    'STUDENT': [ 'students:list' ],
}


def upgrade():
    # permission tables
    op.execute("""
    CREATE TABLE IF NOT EXISTS core.permission (
      code TEXT PRIMARY KEY,
      description TEXT NOT NULL
    );
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS core.role_permission (
      role core.role NOT NULL,
      permission_code TEXT NOT NULL REFERENCES core.permission(code) ON DELETE CASCADE,
      PRIMARY KEY (role, permission_code)
    );
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS core.user_permission_override (
      user_id BIGINT REFERENCES core.user_account(id) ON DELETE CASCADE,
      permission_code TEXT NOT NULL REFERENCES core.permission(code) ON DELETE CASCADE,
      mode TEXT NOT NULL CHECK (mode IN ('GRANT','REVOKE')),
      PRIMARY KEY (user_id, permission_code)
    );
    """)
    # seed permissions
    for code, desc in PERMISSIONS:
        op.execute(sa.text("INSERT INTO core.permission(code, description) VALUES (:c,:d) ON CONFLICT (code) DO NOTHING"), {'c': code, 'd': desc})
    # seed role defaults
    for role, perms in ROLE_DEFAULTS.items():
        for p in perms:
            op.execute(sa.text("INSERT INTO core.role_permission(role, permission_code) VALUES (:r,:p) ON CONFLICT DO NOTHING"), {'r': role, 'p': p})


def downgrade():
    op.execute("DROP TABLE IF EXISTS core.user_permission_override CASCADE")
    op.execute("DROP TABLE IF EXISTS core.role_permission CASCADE")
    op.execute("DROP TABLE IF EXISTS core.permission CASCADE")
