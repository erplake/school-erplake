"""performance / filtering indexes

Revision ID: 20250928_0004
Revises: 20250928_0003
Create Date: 2025-09-28
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250928_0004'
down_revision = '20250928_0003'
branch_labels = None
depends_on = None


def upgrade():
    # Chat related
    op.execute("CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants (user_id, conversation_id)")
    # sequence index conditional: using created_at variant for now (sequence may not auto-populate yet)
    op.execute("CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at ON messages (conversation_id, created_at DESC)")

    # Events
    op.execute("CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events (starts_at)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_events_visibility_status_starts ON events (visibility, status, starts_at)")

    # Social posts
    op.execute("CREATE INDEX IF NOT EXISTS idx_social_posts_status_sched ON social_posts (status, scheduled_for)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_social_posts_platform_status ON social_posts (platform, status)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled_pending ON social_posts (scheduled_for) WHERE status='scheduled' AND scheduled_for IS NOT NULL")
    # Uniqueness for channel_ref via partial unique index (NULLs allowed multiple times)
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ux_social_posts_channel_ref ON social_posts (channel_ref) WHERE channel_ref IS NOT NULL")

    # Invoices
    op.execute("CREATE INDEX IF NOT EXISTS idx_invoices_student ON invoices (student_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_invoices_student_status ON invoices (student_id, status)")

    # Attendance (reporting)
    op.execute("CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_student (date)")

    # Event participants (future user-centric queries)
    op.execute("CREATE INDEX IF NOT EXISTS idx_event_participants_user ON event_participants (user_id)")


def downgrade():
    # Drop in reverse (if they exist)
    for stmt in [
        "DROP INDEX IF EXISTS idx_event_participants_user",
        "DROP INDEX IF EXISTS idx_attendance_date",
        "DROP INDEX IF EXISTS idx_invoices_student_status",
        "DROP INDEX IF EXISTS idx_invoices_student",
    "DROP INDEX IF EXISTS ux_social_posts_channel_ref",
        "DROP INDEX IF EXISTS idx_social_posts_scheduled_pending",
        "DROP INDEX IF EXISTS idx_social_posts_platform_status",
        "DROP INDEX IF EXISTS idx_social_posts_status_sched",
        "DROP INDEX IF EXISTS idx_events_visibility_status_starts",
        "DROP INDEX IF EXISTS idx_events_starts_at",
        "DROP INDEX IF EXISTS idx_messages_conversation_created_at",
        "DROP INDEX IF EXISTS idx_conversation_participants_user",
    ]:
        op.execute(stmt)
