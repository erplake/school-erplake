from __future__ import annotations
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey, text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum, uuid
from app.core.db import Base

class EventVisibility(str, enum.Enum):
    public = 'public'
    internal = 'internal'
    parents = 'parents'

class EventStatus(str, enum.Enum):
    draft = 'draft'
    scheduled = 'scheduled'
    live = 'live'
    completed = 'completed'
    cancelled = 'cancelled'

class Event(Base):
    __tablename__ = 'events'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    starts_at = Column(DateTime(timezone=True), nullable=False)
    ends_at = Column(DateTime(timezone=True), nullable=False)
    location = Column(String, nullable=True)
    visibility = Column(Enum(EventVisibility, name='event_visibility'), nullable=False, default=EventVisibility.internal)
    status = Column(Enum(EventStatus, name='event_status'), nullable=False, default=EventStatus.draft)
    created_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text('now()'))
    updated_at = Column(DateTime(timezone=True), server_default=text('now()'))
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    participants = relationship('EventParticipant', back_populates='event', cascade='all, delete-orphan')

class EventParticipantRole(str, enum.Enum):
    attendee = 'attendee'
    speaker = 'speaker'
    organizer = 'organizer'

class EventParticipant(Base):
    __tablename__ = 'event_participants'
    event_id = Column(UUID(as_uuid=True), ForeignKey('events.id', ondelete='CASCADE'), primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    role = Column(Enum(EventParticipantRole, name='event_participant_role'), nullable=False, default=EventParticipantRole.attendee)
    rsvp_status = Column(String, nullable=True)
    joined_at = Column(DateTime(timezone=True), server_default=text('now()'))

    event = relationship('Event', back_populates='participants')
