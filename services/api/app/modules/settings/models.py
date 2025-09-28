from __future__ import annotations
from sqlalchemy import Column, String, DateTime, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from app.core.db import Base

class BrandSettings(Base):
    __tablename__ = 'brand_settings'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school_name = Column(String, nullable=False, default='My School')
    principal_name = Column(String, nullable=True)
    phone_primary = Column(String, nullable=True)
    phone_transport = Column(String, nullable=True)
    email_contact = Column(String, nullable=True)
    location_address = Column(String, nullable=True)  # legacy single-line
    address_line1 = Column(String, nullable=True)
    address_line2 = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    website_url = Column(String, nullable=True)
    tagline = Column(String, nullable=True)
    social_links = Column(JSONB, nullable=True)  # {"linkedin":"...", "facebook":"...", "google_reviews":"..."}
    updated_by = Column(String, nullable=True)  # store user id as text for simplicity
    updated_at = Column(DateTime(timezone=True), server_default=text('now()'))
