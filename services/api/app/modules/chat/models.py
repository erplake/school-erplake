from __future__ import annotations
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Enum, BigInteger, JSON, text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
import uuid
from datetime import datetime

from app.core.db import Base  # corrected Base import

class Conversation(Base):
    __tablename__ = 'conversations'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_ref = Column(String, nullable=True, unique=True)
    title = Column(String, nullable=True)
    archived = Column(Boolean, default=False, nullable=False)
    locked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text('now()'))
    last_message_at = Column(DateTime(timezone=True), server_default=text('now()'))

    participants = relationship('ConversationParticipant', back_populates='conversation', cascade='all, delete-orphan')
    messages = relationship('Message', back_populates='conversation', cascade='all, delete-orphan')

class ParticipantRole(str, enum.Enum):
    parent = 'parent'
    staff = 'staff'
    moderator = 'moderator'
    observer = 'observer'

class ConversationParticipant(Base):
    __tablename__ = 'conversation_participants'
    conversation_id = Column(UUID(as_uuid=True), ForeignKey('conversations.id', ondelete='CASCADE'), primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    role = Column(Enum(ParticipantRole, name='participant_role'), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=text('now()'))

    conversation = relationship('Conversation', back_populates='participants')

class ContentType(str, enum.Enum):
    text = 'text'
    image = 'image'
    file = 'file'
    system = 'system'

class Message(Base):
    __tablename__ = 'messages'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey('conversations.id', ondelete='CASCADE'), index=True, nullable=False)
    sender_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), index=True, nullable=True)
    body = Column(String, nullable=True)
    content_type = Column(Enum(ContentType, name='message_content_type'), nullable=False, default=ContentType.text)
    attachment_url = Column(String, nullable=True)
    meta = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text('now()'), index=True)
    edited_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    # NOTE: sequence is assigned by the database trigger assign_message_sequence()
    # It is monotonically increasing per conversation (not globally) and may be NULL
    # on transient objects before flush/commit.
    sequence = Column(
        BigInteger,
        nullable=True,
        index=True,
        doc="Per-conversation increasing sequence set by trigger assign_message_sequence()"
    )
    flagged = Column(Boolean, default=False, nullable=False)

    conversation = relationship('Conversation', back_populates='messages')

class FlagStatus(str, enum.Enum):
    pending = 'pending'
    reviewed = 'reviewed'
    dismissed = 'dismissed'
    actioned = 'actioned'

class MessageFlag(Base):
    __tablename__ = 'message_flags'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey('messages.id', ondelete='CASCADE'), index=True, nullable=False)
    flagged_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    reason = Column(String, nullable=True)
    status = Column(Enum(FlagStatus, name='flag_status'), nullable=False, default=FlagStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=text('now()'))
    updated_at = Column(DateTime(timezone=True), server_default=text('now()'))
