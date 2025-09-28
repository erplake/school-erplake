from sqlalchemy import Integer, String, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, date
from ...core.db import Base

class AttendanceStudent(Base):
    __tablename__ = 'attendance_student'
    __table_args__ = (UniqueConstraint('student_id','date', name='uq_attendance_student_date'),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey('students.id', ondelete='CASCADE'))
    date: Mapped[date]
    status: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
