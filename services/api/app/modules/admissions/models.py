from __future__ import annotations
from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Date, DateTime, Text, JSON, Enum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column
from ...core.db import Base
import enum
import uuid

class AdmissionStatus(str, enum.Enum):
    draft = 'draft'
    submitted = 'submitted'
    screening = 'screening'
    shortlisted = 'shortlisted'
    offered = 'offered'
    accepted = 'accepted'
    enrolled = 'enrolled'
    rejected = 'rejected'
    withdrawn = 'withdrawn'

class AdmissionApplication(Base):
    __tablename__ = 'admission_applications'
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    applicant_first_name: Mapped[str] = mapped_column(String(100))
    applicant_last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    desired_class: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    academic_year: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    dob: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    guardian_primary_name: Mapped[Optional[str]] = mapped_column(String(100))
    guardian_primary_phone: Mapped[Optional[str]] = mapped_column(String(30))
    guardian_secondary_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    guardian_secondary_phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    prior_school: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    fee_plan_requested: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    documents: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    notes_internal: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=AdmissionStatus.draft.value)
    status_history: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    enrolled_student_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('students.id'), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
