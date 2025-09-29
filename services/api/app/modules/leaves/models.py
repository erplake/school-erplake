from __future__ import annotations
from datetime import datetime, date, timedelta
from typing import Optional
from sqlalchemy import String, Date, DateTime, Text, JSON, Enum, ForeignKey, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from ...core.db import Base
import enum
import uuid

class LeaveStatus(str, enum.Enum):
    pending = 'pending'
    approved = 'approved'
    rejected = 'rejected'
    cancelled = 'cancelled'

class LeaveType(str, enum.Enum):
    sick = 'sick'
    casual = 'casual'
    vacation = 'vacation'
    other = 'other'

class LeaveRequest(Base):
    __tablename__ = 'leave_requests'
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id: Mapped[int] = mapped_column(ForeignKey('students.id', ondelete='CASCADE'), index=True)
    start_date: Mapped[date]
    end_date: Mapped[date]
    type: Mapped[str] = mapped_column(String(20), default=LeaveType.other.value)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=LeaveStatus.pending.value)
    requested_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    approved_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    attachment: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    auto_generated_absence_events: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
