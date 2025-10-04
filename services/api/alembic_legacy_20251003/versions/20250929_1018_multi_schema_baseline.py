"""multi schema baseline (core + academics seed)

Revision ID: 20250929_1018
Revises: 20250929_0017
Create Date: 2025-09-29

NOTE: This introduces new namespaced schemas alongside existing public tables.
Subsequent refactors will migrate data & retire legacy public tables.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250929_1018'
down_revision = '20250929_0017'
branch_labels = None
depends_on = None

SCHEMAS = [
    'core','academics','comms','fees','transport','library','inventory','events','health','audit'
]

def upgrade():
    # Create schemas
    for sch in SCHEMAS:
        op.execute(f"CREATE SCHEMA IF NOT EXISTS {sch}")

    # Minimal subset: core.school + core.user_account + core.user_role enum roles
    op.execute("""
    DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
            CREATE TYPE core.role AS ENUM (
                'OWNER','PRINCIPAL','ADMIN','CLASS_TEACHER','SUBJECT_TEACHER',
                'ACCOUNTANT','LIBRARIAN','TRANSPORT','NURSE','COUNSELOR',
                'SECURITY','VENDOR','PARENT','STUDENT','READONLY'
            );
        END IF;
    END $$;
    """)

    op.execute("""
    CREATE TABLE IF NOT EXISTS core.school (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT,
      ay_start_mm INT CHECK (ay_start_mm BETWEEN 1 AND 12) DEFAULT 4,
      timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
      subdomain TEXT UNIQUE,
      phone TEXT,
      email CITEXT,
      address TEXT,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    """)

    op.execute("""
    CREATE TABLE IF NOT EXISTS core.user_account (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      school_id BIGINT REFERENCES core.school(id) ON DELETE CASCADE,
      email CITEXT,
      phone TEXT,
      password_hash TEXT,
      full_name TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      last_login_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (school_id, email),
      UNIQUE (school_id, phone)
    );
    """)

    op.execute("""
    CREATE TABLE IF NOT EXISTS core.user_role (
      user_id BIGINT REFERENCES core.user_account(id) ON DELETE CASCADE,
      role core.role NOT NULL,
      PRIMARY KEY (user_id, role)
    );
    """)

    # Academics minimal: academic_year + class_section for immediate refactor targets
    op.execute("""
    CREATE TABLE IF NOT EXISTS academics.academic_year (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      school_id BIGINT REFERENCES core.school(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      is_current BOOLEAN NOT NULL DEFAULT FALSE
    );
    """)

    op.execute("""
    CREATE TABLE IF NOT EXISTS academics.class_section (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      school_id BIGINT REFERENCES core.school(id) ON DELETE CASCADE,
      ay_id BIGINT REFERENCES academics.academic_year(id) ON DELETE CASCADE,
      grade_label TEXT NOT NULL,
      section_label TEXT NOT NULL,
      room TEXT,
      class_teacher BIGINT REFERENCES core.user_account(id) ON DELETE SET NULL,
      UNIQUE (school_id, ay_id, grade_label, section_label)
    );
    """)

    # Index examples
    op.execute("CREATE INDEX IF NOT EXISTS idx_academic_year_school ON academics.academic_year(school_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_class_section_school ON academics.class_section(school_id)")


def downgrade():
    # We do not drop schemas automatically to avoid accidental data loss once populated.
    # Drop created tables explicitly (reverse order of dependencies)
    op.execute("DROP TABLE IF EXISTS academics.class_section CASCADE")
    op.execute("DROP TABLE IF EXISTS academics.academic_year CASCADE")
    op.execute("DROP TABLE IF EXISTS core.user_role CASCADE")
    op.execute("DROP TABLE IF EXISTS core.user_account CASCADE")
    op.execute("DROP TABLE IF EXISTS core.school CASCADE")
    # ENUM retained (safe) – remove only if sure:
    # op.execute("DROP TYPE IF EXISTS core.role")
