"""chat event social tables

Revision ID: 20250928_0002
Revises: 20250928_0001
Create Date: 2025-09-28
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '20250928_0002'
down_revision = '20250928_0001'
branch_labels = None
depends_on = None

def upgrade():
    # Enums
    participant_role = sa.Enum('parent','staff','moderator','observer', name='participant_role')
    message_content_type = sa.Enum('text','image','file','system', name='message_content_type')
    flag_status = sa.Enum('pending','reviewed','dismissed','actioned', name='flag_status')
    event_visibility = sa.Enum('public','internal','parents', name='event_visibility')
    event_status = sa.Enum('draft','scheduled','live','completed','cancelled', name='event_status')
    event_participant_role = sa.Enum('attendee','speaker','organizer', name='event_participant_role')
    social_platform = sa.Enum('internal','facebook','twitter','instagram','whatsapp', name='social_platform')
    social_post_status = sa.Enum('draft','scheduled','published','failed','cancelled', name='social_post_status')

    # Rely on SQLAlchemy's Enum creation when tables are created; avoid duplicate CREATE TYPE attempts

    # Chat tables
    op.create_table('conversations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('external_ref', sa.String(), nullable=True, unique=True),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('archived', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('locked', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('last_message_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table('conversation_participants',
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('conversations.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('role', participant_role, nullable=False),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table('messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('sender_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('body', sa.String(), nullable=True),
        sa.Column('content_type', message_content_type, nullable=False, server_default='text'),
        sa.Column('attachment_url', sa.String(), nullable=True),
        sa.Column('meta', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), index=True),
        sa.Column('edited_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('sequence', sa.BigInteger(), autoincrement=True),
        sa.Column('flagged', sa.Boolean(), nullable=False, server_default=sa.text('false')),
    )

    op.create_table('message_flags',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('message_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('messages.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('flagged_by', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('reason', sa.String(), nullable=True),
        sa.Column('status', flag_status, nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    # Events tables
    op.create_table('events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ends_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('visibility', event_visibility, nullable=False, server_default='internal'),
        sa.Column('status', event_status, nullable=False, server_default='draft'),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table('event_participants',
        sa.Column('event_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('events.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('role', event_participant_role, nullable=False, server_default='attendee'),
        sa.Column('rsvp_status', sa.String(), nullable=True),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    # Social posts
    op.create_table('social_posts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('platform', social_platform, nullable=False, server_default='internal'),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('body', sa.String(), nullable=True),
        sa.Column('media_url', sa.String(), nullable=True),
        sa.Column('scheduled_for', sa.DateTime(timezone=True), nullable=True),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', social_post_status, nullable=False, server_default='draft'),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('failure_reason', sa.String(), nullable=True),
        sa.Column('channel_ref', sa.String(), nullable=True),
    )


def downgrade():
    op.drop_table('social_posts')
    op.drop_table('event_participants')
    op.drop_table('events')
    op.drop_table('message_flags')
    op.drop_table('messages')
    op.drop_table('conversation_participants')
    op.drop_table('conversations')

    for enum_name in ['social_post_status','social_platform','event_participant_role','event_status','event_visibility','flag_status','message_content_type','participant_role']:
        try:
            op.execute(f"DROP TYPE IF EXISTS {enum_name} CASCADE")
        except Exception:
            pass
