from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, DateTime, UniqueConstraint, text
from datetime import datetime
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
