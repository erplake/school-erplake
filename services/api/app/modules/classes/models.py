from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, DateTime, UniqueConstraint, text, ForeignKey, Text, Boolean
from datetime import datetime
from typing import Optional
from ...core.db import Base

class ClassStatus(Base):
    __tablename__ = 'class_status'
    __table_args__ = (
        UniqueConstraint('grade','section', name='uq_class_status_grade_section'),
    )
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    grade: Mapped[int] = mapped_column(Integer, nullable=False)
    section: Mapped[str] = mapped_column(String, nullable=False)
    result_status: Mapped[str] = mapped_column(String, default='Pending')
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, server_default=text('now()'))

class ClassTeacher(Base):
    __tablename__ = 'class_teachers'
    __table_args__ = (
        UniqueConstraint('grade','section', name='uq_class_teacher_grade_section'),
    )
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    grade: Mapped[int] = mapped_column(Integer, nullable=False)
    section: Mapped[str] = mapped_column(String, nullable=False)
    teacher_name: Mapped[str] = mapped_column(String, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, server_default=text('now()'))

# --- New wing & class management models ---

class HeadMistress(Base):
    __tablename__ = 'head_mistress'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('true'))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, server_default=text('now()'))

class Wing(Base):
    __tablename__ = 'wings'
    __table_args__ = (
        UniqueConstraint('academic_year','name', name='uq_wings_year_name'),
    )
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    academic_year: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    grade_start: Mapped[str] = mapped_column(String, nullable=False)  # now TEXT-like
    grade_end: Mapped[str] = mapped_column(String, nullable=False)
    # Using Optional[...] instead of PEP 604 unions for Python 3.9 compatibility
    target_ratio: Mapped[Optional[int]] = mapped_column(Integer)
    head: Mapped[Optional[str]] = mapped_column(String)  # legacy kept
    head_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey('head_mistress.id', ondelete='SET NULL'))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, server_default=text('now()'))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, server_default=text('now()'))

class SchoolClass(Base):
    __tablename__ = 'school_classes'
    __table_args__ = (
        UniqueConstraint('academic_year','grade','section', name='uq_school_classes_year_grade_section'),
    )
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    academic_year: Mapped[str] = mapped_column(String, nullable=False)
    wing_id: Mapped[Optional[int]] = mapped_column(ForeignKey('wings.id', ondelete='CASCADE'))
    grade: Mapped[str] = mapped_column(String, nullable=False)
    section: Mapped[str] = mapped_column(String, nullable=False)
    teacher_name: Mapped[Optional[str]] = mapped_column(String)
    target_ratio: Mapped[Optional[int]] = mapped_column(Integer)
    head_teacher: Mapped[Optional[str]] = mapped_column(String)
    # New staff linkage columns (nullable for backward compatibility)
    teacher_staff_id: Mapped[Optional[int]] = mapped_column(Integer)  # FK added via migration
    assistant_teacher_id: Mapped[Optional[int]] = mapped_column(Integer)
    support_staff_ids: Mapped[Optional[str]] = mapped_column(String)  # store as comma-separated ids for simplicity if ARRAY not reflected
    storage_path: Mapped[Optional[str]] = mapped_column(String)
    meet_link: Mapped[Optional[str]] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, server_default=text('now()'))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, server_default=text('now()'))

class ClassStudent(Base):
    __tablename__ = 'class_students'
    class_id: Mapped[int] = mapped_column(ForeignKey('school_classes.id', ondelete='CASCADE'), primary_key=True)
    student_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, server_default=text('now()'))
