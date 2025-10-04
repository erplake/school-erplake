"""Create staff_leave_requests table.

Revision ID: 20251003_0011_staff_leave
Revises: 20251003_0010_heads_cls_sets
Create Date: 2025-10-03

Idempotent: uses IF NOT EXISTS patterns.
"""
from alembic import op  # type: ignore
import sqlalchemy as sa  # type: ignore

revision = "20251003_0011_staff_leave"
down_revision = "20251003_0010_heads_cls_sets"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            CREATE TABLE IF NOT EXISTS staff_leave_requests (
              id SERIAL PRIMARY KEY,
              staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
              start_date date NOT NULL,
              end_date date NOT NULL,
              type TEXT,
              status TEXT NOT NULL DEFAULT 'Pending',
              reason TEXT,
              created_at timestamptz DEFAULT now() NOT NULL,
              updated_at timestamptz DEFAULT now() NOT NULL
            );
            CREATE INDEX IF NOT EXISTS ix_staff_leave_requests_staff_id ON staff_leave_requests(staff_id);
            CREATE INDEX IF NOT EXISTS ix_staff_leave_requests_start_end ON staff_leave_requests(start_date,end_date);
            """
        )
    )


def downgrade():  # pragma: no cover
    raise RuntimeError("Downgrade not supported for staff_leave_requests")
