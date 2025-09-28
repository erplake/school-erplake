from __future__ import annotations
from pydantic import BaseModel
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

    class Config:
        use_enum_values = True

class SocialPostUpdate(BaseModel):
    title: Optional[str]
    body: Optional[str]
    media_url: Optional[str]
    scheduled_for: Optional[datetime]
    status: Optional[SocialPostStatus]

    class Config:
        use_enum_values = True

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

    class Config:
        orm_mode = True
        use_enum_values = True

class SocialPostSearchResult(BaseModel):
    id: UUID
    platform: SocialPlatform
    title: Optional[str]
    snippet: Optional[str]
    rank: float
    created_at: datetime

    class Config:
        use_enum_values = True
