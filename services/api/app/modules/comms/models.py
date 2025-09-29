from __future__ import annotations
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, Integer, ForeignKey, Enum as SAEnum, JSON, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.db import Base
import enum

class Channel(enum.Enum):
    INAPP = 'INAPP'
    EMAIL = 'EMAIL'
    WHATSAPP = 'WHATSAPP'
    SMS = 'SMS'

class OutboxStatus(enum.Enum):
    PENDING = 'PENDING'
    SENDING = 'SENDING'
    SENT = 'SENT'
    FAILED = 'FAILED'
    CANCELLED = 'CANCELLED'

class MessageTemplate(Base):
    __tablename__ = 'message_template'
    __table_args__ = {'schema': 'comms'}
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    school_id: Mapped[int] = mapped_column(ForeignKey('core.school.id', ondelete='CASCADE'))
    name: Mapped[str] = mapped_column(String)
    channel: Mapped[Channel] = mapped_column(SAEnum(Channel, name='channel', native_enum=False))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Outbox(Base):
    __tablename__ = 'outbox'
    __table_args__ = {'schema': 'comms'}
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    school_id: Mapped[int] = mapped_column(ForeignKey('core.school.id', ondelete='CASCADE'))
    channel: Mapped[Channel] = mapped_column(SAEnum(Channel, name='channel', native_enum=False))
    to_address: Mapped[str] = mapped_column(String)
    subject: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    body: Mapped[str] = mapped_column(Text)
    template_id: Mapped[Optional[int]] = mapped_column(ForeignKey('comms.message_template.id', ondelete='SET NULL'), nullable=True)
    provider: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    provider_msg_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[OutboxStatus] = mapped_column(SAEnum(OutboxStatus, name='outbox_status', native_enum=False), default=OutboxStatus.PENDING)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    meta: Mapped[dict] = mapped_column(JSON, default=dict)
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey('core.user_account.id', ondelete='SET NULL'), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class DeliveryReceipt(Base):
    __tablename__ = 'delivery_receipt'
    __table_args__ = {'schema': 'comms'}
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    outbox_id: Mapped[int] = mapped_column(ForeignKey('comms.outbox.id', ondelete='CASCADE'))
    provider_status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    raw: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
