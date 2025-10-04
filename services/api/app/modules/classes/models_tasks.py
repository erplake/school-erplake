from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, Date
from ...core.db import Base
from datetime import date
from typing import Optional

class ClassTask(Base):
    __tablename__ = 'class_tasks'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    grade: Mapped[str] = mapped_column(String, index=True)
    section: Mapped[str] = mapped_column(String(5), index=True)
    text: Mapped[str] = mapped_column(String(300))
    due: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(12), default='Open', index=True)

class ClassNote(Base):
    __tablename__ = 'class_notes'
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    grade: Mapped[str] = mapped_column(String, index=True)
    section: Mapped[str] = mapped_column(String(5), index=True)
    text: Mapped[str] = mapped_column(String(500))