from __future__ import annotations
from datetime import datetime
from typing import Optional
from sqlalchemy import String, BigInteger, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base

class FileBlob(Base):
    __tablename__ = 'blob'
    __table_args__ = {'schema': 'files'}
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    school_id: Mapped[int] = mapped_column(ForeignKey('core.school.id', ondelete='CASCADE'))
    storage_url: Mapped[str] = mapped_column(Text)
    mime_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    bytes: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    checksum: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    virus_scan: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey('core.user_account.id', ondelete='SET NULL'), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    attachments: Mapped[list['Attachment']] = relationship(back_populates='blob')

class Attachment(Base):
    __tablename__ = 'attachment'
    __table_args__ = {'schema': 'files'}
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    blob_id: Mapped[int] = mapped_column(ForeignKey('files.blob.id', ondelete='CASCADE'))
    entity: Mapped[str] = mapped_column(String)  # e.g. 'core.student'
    entity_id: Mapped[int] = mapped_column(BigInteger)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    blob: Mapped[FileBlob] = relationship(back_populates='attachments')
