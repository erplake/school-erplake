from __future__ import annotations
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey, text, Integer
from sqlalchemy.dialects.postgresql import UUID
import enum, uuid
from app.core.db import Base

class SocialPlatform(str, enum.Enum):
    internal = 'internal'
    facebook = 'facebook'
    twitter = 'twitter'
    instagram = 'instagram'
    whatsapp = 'whatsapp'

class SocialPostStatus(str, enum.Enum):
    draft = 'draft'
    scheduled = 'scheduled'
    published = 'published'
    failed = 'failed'
    cancelled = 'cancelled'

class SocialPost(Base):
    __tablename__ = 'social_posts'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    platform = Column(Enum(SocialPlatform, name='social_platform'), nullable=False, default=SocialPlatform.internal)
    title = Column(String, nullable=True)
    body = Column(String, nullable=True)
    media_url = Column(String, nullable=True)
    scheduled_for = Column(DateTime(timezone=True), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(SocialPostStatus, name='social_post_status'), nullable=False, default=SocialPostStatus.draft)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text('now()'))
    updated_at = Column(DateTime(timezone=True), server_default=text('now()'))
    failure_reason = Column(String, nullable=True)
    channel_ref = Column(String, nullable=True)  # external provider id
