from __future__ import annotations
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any
from uuid import UUID
from datetime import datetime
from .models import ParticipantRole, ContentType, FlagStatus

class ConversationBase(BaseModel):
    title: Optional[str] = None

class ConversationCreate(ConversationBase):
    parent_user_id: int

class ConversationParticipantOut(BaseModel):
    user_id: int
    role: ParticipantRole

    model_config = ConfigDict(use_enum_values=True)

class ConversationOut(ConversationBase):
    id: UUID
    archived: bool
    locked: bool
    last_message_at: datetime
    participants: List[ConversationParticipantOut] = []

    model_config = ConfigDict(use_enum_values=True, from_attributes=True)

class MessageCreate(BaseModel):
    conversation_id: UUID
    body: Optional[str] = None
    content_type: ContentType = ContentType.text
    attachment_url: Optional[str] = None
    meta: Optional[Any] = None

    model_config = ConfigDict(use_enum_values=True)

class MessageOut(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_id: Optional[int]
    body: Optional[str]
    content_type: ContentType
    attachment_url: Optional[str]
    meta: Optional[Any]
    created_at: datetime
    sequence: Optional[int]
    flagged: bool

    model_config = ConfigDict(use_enum_values=True, from_attributes=True)

class MessageFlagCreate(BaseModel):
    message_id: UUID
    reason: Optional[str] = None

class MessageFlagOut(BaseModel):
    id: UUID
    message_id: UUID
    reason: Optional[str]
    status: FlagStatus
    created_at: datetime

    model_config = ConfigDict(use_enum_values=True, from_attributes=True)

class MessageSearchResult(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_id: Optional[int]
    sequence: Optional[int]
    created_at: datetime
    snippet: Optional[str]
    rank: float

    model_config = ConfigDict(use_enum_values=True)

