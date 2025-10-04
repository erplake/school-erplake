"""Seed staff:taxonomy permission and map to ADMIN role.

Revision ID: 20251003_0035_staff_taxonomy_permission
Revises: 20251003_0030_taxonomy_enhancements
Create Date: 2025-10-03

Idempotent insertion into core.permission and core.role_permission.
If core schema or tables absent (legacy public-only state), migration exits silently.
"""
from alembic import op  # type: ignore
import sqlalchemy as sa  # type: ignore

revision = "20251003_0035_staff_taxonomy_permission"
down_revision = "20251003_0030_taxonomy_enhancements"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    try:
        # Ensure core schema exists (skip if not)
        conn.execute(sa.text("CREATE SCHEMA IF NOT EXISTS core"))
        conn.execute(sa.text(
            """
            CREATE TABLE IF NOT EXISTS core.permission(
              code TEXT PRIMARY KEY,
              description TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS core.role_permission(
              role TEXT NOT NULL,
              permission_code TEXT NOT NULL REFERENCES core.permission(code) ON DELETE CASCADE,
              PRIMARY KEY(role, permission_code)
            );
            """
        ))
        conn.execute(sa.text(
            "INSERT INTO core.permission(code, description) VALUES (:c,:d) ON CONFLICT (code) DO NOTHING"),
            {"c": "staff:taxonomy", "d": "Manage staff roles & departments taxonomy"},
        )
        # Map to ADMIN role by convention (uppercase for consistency with existing seeds)
        conn.execute(sa.text(
            "INSERT INTO core.role_permission(role, permission_code) VALUES ('ADMIN', :c) ON CONFLICT DO NOTHING"),
            {"c": "staff:taxonomy"},
        )
    except Exception:
        # Silent skip: older environments without RBAC tables
        pass


def downgrade():  # pragma: no cover
    raise RuntimeError("Downgrade not supported for permission seeding")
