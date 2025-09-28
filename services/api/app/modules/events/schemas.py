from __future__ import annotations
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from .models import EventVisibility, EventStatus, EventParticipantRole

class EventCreate(BaseModel):
    title: str
    description: Optional[str]
    starts_at: datetime
    ends_at: datetime
    location: Optional[str]
    visibility: EventVisibility = EventVisibility.internal

    class Config:
        use_enum_values = True

class EventUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    starts_at: Optional[datetime]
    ends_at: Optional[datetime]
    location: Optional[str]
    visibility: Optional[EventVisibility]
    status: Optional[EventStatus]

    class Config:
        use_enum_values = True

class EventParticipantOut(BaseModel):
    user_id: int
    role: EventParticipantRole

    class Config:
        use_enum_values = True

class EventOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    starts_at: datetime
    ends_at: datetime
    location: Optional[str]
    visibility: EventVisibility
    status: EventStatus
    created_by: Optional[int]
    participants: List[EventParticipantOut] = []

    class Config:
        orm_mode = True
        use_enum_values = True
