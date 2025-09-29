from __future__ import annotations
from sqlalchemy import Integer, String, DateTime, ForeignKey, Numeric, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, date
from typing import Optional
from ...core.db import Base

class StudentTag(Base):
    __tablename__ = 'student_tags'
    __table_args__ = (
        UniqueConstraint('student_id','tag', name='uq_student_tag_unique'),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey('students.id', ondelete='CASCADE'), index=True)
    tag: Mapped[str] = mapped_column(String(50), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, server_default=text('now()'))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, server_default=text('now()'))

class StudentTransport(Base):
    __tablename__ = 'student_transport'
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey('students.id', ondelete='CASCADE'), index=True)
    route: Mapped[str] = mapped_column(String(50))
    stop: Mapped[str] = mapped_column(String(100))
    active: Mapped[int] = mapped_column(Integer, default=1)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

class AttendanceEvent(Base):
    __tablename__ = 'attendance_events'
    __table_args__ = (
        # Support ON CONFLICT (student_id, date) DO NOTHING in seed script.
        # Use distinct constraint name to avoid collision with AttendanceStudent model.
        UniqueConstraint('student_id','date', name='uq_attendance_event_student_date'),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey('students.id', ondelete='CASCADE'), index=True)
    date: Mapped[date] = mapped_column(index=True)
    present: Mapped[int] = mapped_column(Integer)  # 1 present, 0 absent
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, server_default=text('now()'))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, server_default=text('now()'))

class FeeInvoice(Base):
    __tablename__ = 'fee_invoices'
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey('students.id', ondelete='CASCADE'), index=True)
    amount: Mapped[int] = mapped_column(Integer)  # store in smallest unit (INR paise optional); simplified int
    paid_amount: Mapped[int] = mapped_column(Integer, default=0)
    due_date: Mapped[Optional[date]] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, server_default=text('now()'))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, server_default=text('now()'))
    settled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
