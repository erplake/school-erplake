from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, Date, DateTime, ForeignKey
from datetime import datetime, date
from typing import Optional, List
from ...core.db import Base

class Staff(Base):
    __tablename__ = 'staff'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    staff_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    department: Mapped[Optional[str]] = mapped_column(String(80))
    grade: Mapped[Optional[str]] = mapped_column(String(40))
    email: Mapped[Optional[str]] = mapped_column(String(120))
    phone: Mapped[Optional[str]] = mapped_column(String(40))
    date_of_joining: Mapped[Optional[date]] = mapped_column(Date())
    birthday: Mapped[Optional[date]] = mapped_column(Date())
    reports_to: Mapped[Optional[str]] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(20), default='Active')
    attendance_30: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    leaves_taken_ytd: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    leave_balance: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    last_appraisal: Mapped[Optional[date]] = mapped_column(Date())
    next_appraisal: Mapped[Optional[date]] = mapped_column(Date())
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    leave_requests: Mapped[List['StaffLeaveRequest']] = relationship('StaffLeaveRequest', back_populates='staff', cascade='all,delete')

class StaffLeaveRequest(Base):
    __tablename__ = 'staff_leave_requests'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    staff_id: Mapped[int] = mapped_column(ForeignKey('staff.id', ondelete='CASCADE'))
    leave_type: Mapped[str] = mapped_column(String(50))
    date_from: Mapped[date] = mapped_column(Date())
    date_to: Mapped[date] = mapped_column(Date())
    days: Mapped[int] = mapped_column(Integer)
    reason: Mapped[Optional[str]] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(20), default='Pending')
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    staff: Mapped['Staff'] = relationship('Staff', back_populates='leave_requests')
