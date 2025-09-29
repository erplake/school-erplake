"""uniform timestamps and updated_at columns

Revision ID: 20250929_0017
Revises: 20250929_0016
Create Date: 2025-09-29 00:30:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '20250929_0017'
down_revision: Union[str, None] = '20250929_0016'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

UPDATED_TABLES = [
    ('attendance_events','updated_at'),
    ('fee_invoices','updated_at'),
    ('student_tags','updated_at'),
]

TS_TYPE = sa.DateTime(timezone=True)

def has_column(table: str, column: str) -> bool:
    conn = op.get_bind()
    res = conn.execute(sa.text("""
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = :t AND column_name = :c
        LIMIT 1
    """), {"t": table, "c": column}).scalar()
    return bool(res)

def upgrade() -> None:
    # Add updated_at columns if missing
    for table, col in UPDATED_TABLES:
        if not has_column(table, col):
            op.add_column(table, sa.Column(col, TS_TYPE, server_default=sa.text('now()')))
            # server_default ensures backfill with current timestamp
    # Create or replace trigger function once
    conn = op.get_bind()
    conn.execute(sa.text("""
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """))
    # Attach triggers for each table
    for table, col in UPDATED_TABLES:
        # idempotent: drop existing trigger if present then create
        conn.execute(sa.text(f"DROP TRIGGER IF EXISTS trg_{table}_updated_at ON {table};"))
        conn.execute(sa.text(f"CREATE TRIGGER trg_{table}_updated_at BEFORE UPDATE ON {table} FOR EACH ROW EXECUTE PROCEDURE set_updated_at();"))

def downgrade() -> None:
    conn = op.get_bind()
    # Drop triggers
    for table, col in UPDATED_TABLES:
        conn.execute(sa.text(f"DROP TRIGGER IF EXISTS trg_{table}_updated_at ON {table};"))
    # Optionally keep function if other migrations rely on it; safe to drop if unused
    conn.execute(sa.text("DROP FUNCTION IF EXISTS set_updated_at();"))
    # Remove columns (if present) -- destructive, but aligns with downgrade semantics
    for table, col in UPDATED_TABLES:
        if has_column(table, col):
            op.drop_column(table, col)
