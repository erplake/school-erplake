from __future__ import annotations
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from .models import Channel, OutboxStatus

class TemplateCreate(BaseModel):
    name: str
    channel: Channel
    body: str

class TemplateOut(BaseModel):
    id: int
    name: str
    channel: Channel
    body: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class OutboxEnqueue(BaseModel):
    channel: Channel
    to_address: str
    subject: Optional[str] = None
    body: Optional[str] = None
    template_id: Optional[int] = None
    scheduled_at: Optional[datetime] = None

class OutboxOut(BaseModel):
    id: int
    channel: Channel
    to_address: str
    subject: Optional[str]
    body: str
    status: OutboxStatus
    attempts: int
    scheduled_at: Optional[datetime]
    sent_at: Optional[datetime]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
