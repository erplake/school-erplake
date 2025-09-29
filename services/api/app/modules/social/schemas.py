from __future__ import annotations
from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from .models import SocialPlatform, SocialPostStatus

class SocialPostCreate(BaseModel):
    platform: SocialPlatform = SocialPlatform.internal
    title: Optional[str]
    body: Optional[str]
    media_url: Optional[str]
    scheduled_for: Optional[datetime]

    model_config = ConfigDict(use_enum_values=True)

class SocialPostUpdate(BaseModel):
    title: Optional[str]
    body: Optional[str]
    media_url: Optional[str]
    scheduled_for: Optional[datetime]
    status: Optional[SocialPostStatus]

    model_config = ConfigDict(use_enum_values=True)

class SocialPostOut(BaseModel):
    id: UUID
    platform: SocialPlatform
    title: Optional[str]
    body: Optional[str]
    media_url: Optional[str]
    scheduled_for: Optional[datetime]
    published_at: Optional[datetime]
    status: SocialPostStatus
    failure_reason: Optional[str]
    channel_ref: Optional[str]

    model_config = ConfigDict(use_enum_values=True, from_attributes=True)

class SocialPostSearchResult(BaseModel):
    id: UUID
    platform: SocialPlatform
    title: Optional[str]
    snippet: Optional[str]
    rank: float
    created_at: datetime

    model_config = ConfigDict(use_enum_values=True)
