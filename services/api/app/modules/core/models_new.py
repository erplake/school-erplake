from __future__ import annotations
"""New multi-schema ORM models mapped to objects created via schema.sql.

These models intentionally do not replicate every table from the monolithic
schema yet; we start with the ones needed for student CRUD & enrollment flow.

NOTE: We keep this separate from legacy_models.py during transition. Once
routers are refactored fully we can consolidate.
"""
from datetime import datetime, date
from typing import Optional

from sqlalchemy import (
    BigInteger, String, Date, DateTime, Boolean, ForeignKey, UniqueConstraint, text, Integer, Enum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ...core.db import Base


class School(Base):
    __tablename__ = "school"
    __table_args__ = {"schema": "core"}
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    short_name: Mapped[Optional[str]]
    ay_start_mm: Mapped[Optional[int]]
    timezone: Mapped[str]
    subdomain: Mapped[Optional[str]]
    phone: Mapped[Optional[str]]
    email: Mapped[Optional[str]]
    address: Mapped[Optional[str]]
    created_at: Mapped[datetime]
    updated_at: Mapped[datetime]
    # relationships (lazy minimal)
    students: Mapped[list["CoreStudent"]] = relationship(back_populates="school")


class Guardian(Base):
    __tablename__ = "guardian"
    __table_args__ = {"schema": "core"}
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    school_id: Mapped[int] = mapped_column(ForeignKey("core.school.id", ondelete="CASCADE"), index=True)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    relation: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[Optional[str]]
    email: Mapped[Optional[str]]
    address: Mapped[Optional[str]]


class CoreStudent(Base):
    __tablename__ = "student"
    __table_args__ = {"schema": "core"}
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    school_id: Mapped[int] = mapped_column(ForeignKey("core.school.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("core.user_account.id", ondelete="SET NULL"), unique=True)
    adm_no: Mapped[Optional[str]] = mapped_column(String, index=True)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[Optional[str]] = mapped_column(String)
    dob: Mapped[Optional[Date]] = mapped_column(Date)
    gender: Mapped[Optional[str]] = mapped_column(String)  # using raw string to avoid early ENUM reflection complexity
    house_id: Mapped[Optional[int]] = mapped_column(ForeignKey("core.house.id", ondelete="SET NULL"))
    photo_url: Mapped[Optional[str]]
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

    school: Mapped["School"] = relationship(back_populates="students")
    enrollments: Mapped[list["Enrollment"]] = relationship(back_populates="student")


class AcademicYear(Base):
    __tablename__ = "academic_year"
    __table_args__ = {"schema": "academics"}
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    school_id: Mapped[int] = mapped_column(ForeignKey("core.school.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    start_date: Mapped[date]
    end_date: Mapped[date]
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)
    class_sections: Mapped[list["ClassSection"]] = relationship(back_populates="ay")


class ClassSection(Base):
    __tablename__ = "class_section"
    __table_args__ = (
        UniqueConstraint("school_id", "ay_id", "grade_label", "section_label", name="uq_class_section_unique"),
        {"schema": "academics"}
    )
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    school_id: Mapped[int] = mapped_column(ForeignKey("core.school.id", ondelete="CASCADE"), index=True)
    ay_id: Mapped[int] = mapped_column(ForeignKey("academics.academic_year.id", ondelete="CASCADE"), index=True)
    grade_label: Mapped[str] = mapped_column(String, nullable=False)
    section_label: Mapped[str] = mapped_column(String, nullable=False)
    room: Mapped[Optional[str]]
    class_teacher: Mapped[Optional[int]] = mapped_column(ForeignKey("core.staff.id", ondelete="SET NULL"))

    ay: Mapped["AcademicYear"] = relationship(back_populates="class_sections")
    enrollments: Mapped[list["Enrollment"]] = relationship(back_populates="class_section")


class Enrollment(Base):
    __tablename__ = "enrollment"
    __table_args__ = {"schema": "academics"}
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("core.student.id", ondelete="CASCADE"), index=True)
    class_section_id: Mapped[int] = mapped_column(ForeignKey("academics.class_section.id", ondelete="CASCADE"), index=True)
    roll_no: Mapped[Optional[int]]
    joined_on: Mapped[Optional[date]] = mapped_column(Date)
    left_on: Mapped[Optional[date]] = mapped_column(Date)

    student: Mapped["CoreStudent"] = relationship(back_populates="enrollments")
    class_section: Mapped["ClassSection"] = relationship(back_populates="enrollments")


# Minimal fees model stub (not full) for future joins
class Invoice(Base):
    __tablename__ = "invoice"
    __table_args__ = {"schema": "fees"}
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("core.student.id", ondelete="CASCADE"), index=True)
    total_amount: Mapped[Optional[int]] = mapped_column(Integer)
    balance_due: Mapped[Optional[int]] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
