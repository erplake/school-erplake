from __future__ import annotations
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class FileBlobRegister(BaseModel):
    storage_url: str
    mime_type: Optional[str] = None
    bytes: Optional[int] = None
    checksum: Optional[str] = None
    is_public: bool = False

class FileBlobOut(BaseModel):
    id: int
    storage_url: str
    mime_type: Optional[str]
    bytes: Optional[int]
    checksum: Optional[str]
    is_public: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AttachmentCreate(BaseModel):
    blob_id: int
    entity: str
    entity_id: int
    note: Optional[str] = None

class AttachmentOut(BaseModel):
    id: int
    blob_id: int
    entity: str
    entity_id: int
    note: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
