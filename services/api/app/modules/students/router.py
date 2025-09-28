from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from ...core.db import get_session
from ...core.security import require
from .models import Student

router = APIRouter(prefix="/students", tags=["students"])

class StudentCreate(BaseModel):
    admission_no: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    klass: Optional[str] = None
    section: Optional[str] = None
    guardian_phone: Optional[str] = None

class StudentOut(BaseModel):
    id: int
    admission_no: Optional[str]
    first_name: str
    last_name: Optional[str]
    klass: Optional[str]
    section: Optional[str]
    guardian_phone: Optional[str]

    @classmethod
    def from_model(cls, s: Student):
        return cls(
            id=s.id,
            admission_no=s.admission_no,
            first_name=s.first_name,
            last_name=s.last_name,
            klass=s.class_,
            section=s.section,
            guardian_phone=s.guardian_phone
        )

@router.post("", response_model=StudentOut)
async def create_student(body: StudentCreate, session: AsyncSession = Depends(get_session), user=Depends(require('students:create'))):
    student = Student(
        admission_no=body.admission_no,
        first_name=body.first_name,
        last_name=body.last_name,
        class_=body.klass,
        section=body.section,
        guardian_phone=body.guardian_phone
    )
    session.add(student)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(409, "Admission number already exists")
    await session.refresh(student)
    return StudentOut.from_model(student)

@router.get("", response_model=list[StudentOut])
async def list_students(session: AsyncSession = Depends(get_session), user=Depends(require('students:list'))):
    result = await session.execute(select(Student).order_by(Student.id.desc()).limit(200))
    rows = result.scalars().all()
    return [StudentOut.from_model(s) for s in rows]
