from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ...core.security import require
from ...core.db import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .models import AttendanceStudent

router = APIRouter(prefix="/attendance", tags=["attendance"])

class AttendanceIn(BaseModel):
    student_id: int
    date: str  # YYYY-MM-DD
    status: str  # present | absent | late

@router.post("/student")
async def mark_attendance(a: AttendanceIn, session: AsyncSession = Depends(get_session), user=Depends(require('attendance:mark'))):
    if a.status not in {"present","absent","late"}:
        raise HTTPException(422, "Invalid status")
    result = await session.execute(select(AttendanceStudent).where(AttendanceStudent.student_id==a.student_id, AttendanceStudent.date==a.date))
    existing = result.scalars().first()
    if existing:
        existing.status = a.status
    else:
        existing = AttendanceStudent(student_id=a.student_id, date=a.date, status=a.status)
        session.add(existing)
    await session.commit()
    await session.refresh(existing)
    return {"id": existing.id, "student_id": existing.student_id, "date": str(existing.date), "status": existing.status}

@router.get("/student/{student_id}")
async def get_attendance(student_id: int, session: AsyncSession = Depends(get_session), user=Depends(require('attendance:view'))):
    result = await session.execute(select(AttendanceStudent).where(AttendanceStudent.student_id==student_id).order_by(AttendanceStudent.date.desc()))
    rows = result.scalars().all()
    return [ {"id": r.id, "student_id": r.student_id, "date": str(r.date), "status": r.status} for r in rows ]
