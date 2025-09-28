from __future__ import annotations
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.db import Base

class IntegrationSettings(Base):
    __tablename__ = 'integration_settings'
    __table_args__ = (
        UniqueConstraint('provider', name='uq_integration_provider'),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider = Column(String, nullable=False)  # e.g. gupshup, razorpay, social_linkedin
    enabled = Column(Boolean, nullable=False, server_default=text('false'))
    config = Column(JSONB, nullable=True)  # generic provider-specific JSON
    updated_by = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=text('now()'))
