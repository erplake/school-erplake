from sqlalchemy import Integer, String, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from typing import Optional
from ...core.db import Base

class Student(Base):
    __tablename__ = 'students'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    admission_no: Mapped[Optional[str]] = mapped_column(String, unique=True)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[Optional[str]] = mapped_column(String)
    class_: Mapped[Optional[str]] = mapped_column('class', String)
    section: Mapped[Optional[str]] = mapped_column(String)
    gender: Mapped[Optional[str]] = mapped_column(String(1))  # 'M','F','O' (optional)
    roll: Mapped[Optional[int]] = mapped_column(Integer)
    guardian_phone: Mapped[Optional[str]] = mapped_column(String)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    # Prototype denormalized / placeholder fields (future: normalize via attendance, fees tables)
    attendance_pct: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    fee_due_amount: Mapped[Optional[int]] = mapped_column(Integer, default=0)
    transport: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    tags: Mapped[Optional[str]] = mapped_column(String, default='')  # stored comma-separated
    absent_today: Mapped[Optional[int]] = mapped_column(Integer, default=0)  # 0/1 flag
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
