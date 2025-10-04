from sqlalchemy import BigInteger, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from app.core.db import Base

class ClassGalleryImage(Base):
    __tablename__ = 'class_gallery_image'
    __table_args__ = {'schema': 'files'}

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    class_section_id: Mapped[int] = mapped_column(BigInteger, ForeignKey('academics.class_section.id', ondelete='CASCADE'), index=True, nullable=False)
    blob_id: Mapped[int] = mapped_column(BigInteger, ForeignKey('files.blob.id', ondelete='CASCADE'), nullable=False)
    uploader_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey('core.user_account.id', ondelete='SET NULL'), index=True, nullable=True)
    original_filename: Mapped[str] = mapped_column(Text, nullable=False)
    mime_type: Mapped[str] = mapped_column(Text, nullable=False)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    content_hash: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default='false')
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default='now()', nullable=False)

    # relationships (lazy load to avoid circular imports)
    # blob = relationship('FileBlob')  # if needed later

Index('ix_gallery_class_created', ClassGalleryImage.class_section_id, ClassGalleryImage.created_at)
