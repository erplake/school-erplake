from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List

class GalleryImageBase(BaseModel):
    id: int
    class_section_id: int
    original_filename: str
    mime_type: str
    size_bytes: int
    created_at: datetime
    uploader_id: Optional[int]
    content_hash: Optional[str]

    class Config:
        # pydantic v2 replacement for orm_mode
        from_attributes = True  # type: ignore

class GalleryImageList(BaseModel):
    items: List[GalleryImageBase]
    total: int

class GalleryUploadRequest(BaseModel):
    class_section_id: int
    blob_id: int  # previously created FileBlob id
    original_filename: str
    mime_type: str
    size_bytes: int
    content_hash: Optional[str] = None

class GalleryUploadResponse(GalleryImageBase):
    pass
