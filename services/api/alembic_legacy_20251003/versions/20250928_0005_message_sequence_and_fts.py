"""message per-conversation sequence + FTS indexes

Revision ID: 20250928_0005
Revises: 20250928_0004
Create Date: 2025-09-28
"""
from alembic import op
import sqlalchemy as sa

revision = '20250928_0005'
down_revision = '20250928_0004'
branch_labels = None
depends_on = None

# Notes:
# - Adds next_message_seq bigint to conversations (starts at max existing +1 per conversation during backfill)
# - Backfills messages.sequence ordered by created_at ascending
# - Adds trigger function to increment per conversation sequence on insert if sequence is null or 0
# - Replaces idx_messages_conversation_created_at with idx_messages_conversation_sequence for pagination
# - Adds covering index (conversation_id, sender_id, created_at, sequence)
# - Adds GIN FTS indexes on messages.body and social_posts.body (english config)

def upgrade():
    # 1. Add counter column if not exists
    op.execute("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS next_message_seq bigint DEFAULT 1 NOT NULL")

    # 2. Backfill sequences where null/zero; first set all sequence to NULL to recompute predictable ordering
    op.execute("UPDATE messages SET sequence = NULL")
    # Use window function to assign row numbers per conversation ordered by created_at,id
    op.execute(
        """
        WITH ordered AS (
          SELECT id, conversation_id,
                 ROW_NUMBER() OVER (PARTITION BY conversation_id ORDER BY created_at, id) AS rn
          FROM messages
        )
        UPDATE messages m
        SET sequence = o.rn
        FROM ordered o
        WHERE m.id = o.id
        """
    )
    # 3. Set next_message_seq for each conversation to max(sequence)+1 (or 1)
    op.execute(
        """
        UPDATE conversations c
        SET next_message_seq = COALESCE( (
            SELECT MAX(sequence)+1 FROM messages m WHERE m.conversation_id = c.id
        ), 1)
        """
    )

    # 4. Create trigger function + trigger
    op.execute(
        """
        CREATE OR REPLACE FUNCTION assign_message_sequence() RETURNS trigger AS $$
        DECLARE
          next_seq bigint;
        BEGIN
          IF NEW.sequence IS NULL OR NEW.sequence = 0 THEN
            -- lock the row in conversations to avoid race conditions
            UPDATE conversations SET next_message_seq = next_message_seq + 1
            WHERE id = NEW.conversation_id
            RETURNING next_message_seq - 1 INTO next_seq;
            NEW.sequence = next_seq;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    op.execute("DROP TRIGGER IF EXISTS trg_assign_message_sequence ON messages")
    op.execute(
        """
        CREATE TRIGGER trg_assign_message_sequence
        BEFORE INSERT ON messages
        FOR EACH ROW
        EXECUTE FUNCTION assign_message_sequence();
        """
    )

    # 5. Index changes
    op.execute("DROP INDEX IF EXISTS idx_messages_conversation_created_at")
    op.execute("CREATE INDEX IF NOT EXISTS idx_messages_conversation_sequence ON messages (conversation_id, sequence DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_messages_conversation_sender_created_seq ON messages (conversation_id, sender_id, created_at DESC, sequence DESC)")

    # 6. FTS indexes (use simple english config; can be adapted)
    op.execute("CREATE INDEX IF NOT EXISTS idx_messages_body_fts ON messages USING GIN (to_tsvector('english', coalesce(body,'')))")
    op.execute("CREATE INDEX IF NOT EXISTS idx_social_posts_body_fts ON social_posts USING GIN (to_tsvector('english', coalesce(body,'')))")


def downgrade():
    # Remove FTS indexes
    op.execute("DROP INDEX IF EXISTS idx_social_posts_body_fts")
    op.execute("DROP INDEX IF EXISTS idx_messages_body_fts")
    # Remove covering and sequence indexes, restore created_at index (optional)
    op.execute("DROP INDEX IF EXISTS idx_messages_conversation_sender_created_seq")
    op.execute("DROP INDEX IF EXISTS idx_messages_conversation_sequence")
    op.execute("CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at ON messages (conversation_id, created_at DESC)")
    # Drop trigger and function
    op.execute("DROP TRIGGER IF EXISTS trg_assign_message_sequence ON messages")
    op.execute("DROP FUNCTION IF EXISTS assign_message_sequence()")
    # Leave next_message_seq column (safe) or drop if desired:
    # op.execute(\"ALTER TABLE conversations DROP COLUMN IF EXISTS next_message_seq\")
