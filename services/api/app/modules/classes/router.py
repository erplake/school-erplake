from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, literal, case
import sqlalchemy as sa
from ..students.models import Student
from ..students.models_extra import AttendanceEvent, FeeInvoice, StudentTag
from .models import ClassStatus, ClassTeacher
from ...core.db import get_session
from ...core.security import require
from datetime import datetime

router = APIRouter(prefix="/classes", tags=["classes"])

class ClassRow(BaseModel):
    id: str
    grade: int
    section: str
    class_teacher: Optional[str] = None  # placeholder
    total: int
    male: int
    female: int
    attendance_pct: int
    fee_due_count: int
    fee_due_amount: int
    result_status: str

class ClassListResponse(ClassRow):
    pass

class RosterStudent(BaseModel):
    student_id: int
    name: str
    roll: Optional[int] = None
    guardian_phone: Optional[str]
    tags: List[str] = []
    attendance_mark: Optional[str] = None  # P/A/L/E placeholder
    fee_due_amount: Optional[int] = 0
    last_present_date: Optional[str] = None

class ClassDetail(BaseModel):
    id: str
    grade: int
    section: str
    class_teacher: Optional[str]
    total: int
    male: int
    female: int
    attendance_pct: int
    fee_due_count: int
    fee_due_amount: int
    result_status: str
    roster: List[RosterStudent]
    generated_at: str

class BulkActionRequest(BaseModel):
    action: str
    class_ids: List[str]
    params: Optional[dict] = None

class BulkActionResponse(BaseModel):
    status: str
    task_id: Optional[str]
    affected: int

async def _class_status_map(session: AsyncSession) -> dict[tuple[int,str], str]:
    rows = (await session.execute(select(ClassStatus))).scalars().all()
    return {(r.grade, r.section): r.result_status for r in rows}

@router.get("", response_model=List[ClassListResponse])
async def list_classes(
    session: AsyncSession = Depends(get_session),
    user=Depends(require('classes:list')),
    grade: Optional[int] = Query(None, ge=1, le=12),
    section: Optional[str] = Query(None, min_length=1, max_length=2),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    stu = Student
    # Base filtered students
    conditions = [stu.class_.isnot(None), stu.section.isnot(None)]
    if grade is not None:
        conditions.append(stu.class_ == str(grade))
    if section is not None:
        conditions.append(stu.section == section)

    base = select(
        stu.class_.label('grade'),
        stu.section.label('section'),
        func.count(stu.id).label('total'),
        func.sum(case((stu.gender=='M',1), else_=0)).label('male'),
        func.sum(case((stu.gender=='F',1), else_=0)).label('female')
    ).where(*conditions).group_by(stu.class_, stu.section)

    base_cte = base.cte('base_classes')

    # Attendance aggregate joined via subquery
    att = (
        select(
            base_cte.c.grade,
            base_cte.c.section,
            func.coalesce(((func.sum(case((AttendanceEvent.present==1,1), else_=0))*100)/
                          func.nullif(func.count(AttendanceEvent.id),0)).cast(sa.Integer),0).label('attendance_pct')
        )
        .select_from(base_cte.join(stu, sa.and_(stu.class_==base_cte.c.grade, stu.section==base_cte.c.section))
                     .join(AttendanceEvent, AttendanceEvent.student_id==stu.id, isouter=True))
        .group_by(base_cte.c.grade, base_cte.c.section)
    ).cte('att')

    # Fees aggregate
    fees = (
        select(
            base_cte.c.grade,
            base_cte.c.section,
            func.coalesce(func.sum(FeeInvoice.amount - FeeInvoice.paid_amount),0).label('fee_due_amount'),
            func.count(sa.distinct(sa.case((FeeInvoice.amount - FeeInvoice.paid_amount > 0, FeeInvoice.student_id), else_=None))).label('fee_due_count')
        )
        .select_from(base_cte.join(stu, sa.and_(stu.class_==base_cte.c.grade, stu.section==base_cte.c.section))
                     .join(FeeInvoice, sa.and_(FeeInvoice.student_id==stu.id, FeeInvoice.settled_at.is_(None)), isouter=True))
        .group_by(base_cte.c.grade, base_cte.c.section)
    ).cte('fees')

    # Teacher assignment
    # Cast ClassTeacher.grade (int) to text to match Student.class_ (stored as string)
    teacher = select(sa.cast(ClassTeacher.grade, sa.String).label('grade'), ClassTeacher.section, ClassTeacher.teacher_name).cte('teacher')

    query = (
        select(
            base_cte.c.grade,
            base_cte.c.section,
            base_cte.c.total,
            base_cte.c.male,
            base_cte.c.female,
            func.coalesce(att.c.attendance_pct,0),
            func.coalesce(fees.c.fee_due_count,0),
            func.coalesce(fees.c.fee_due_amount,0),
            teacher.c.teacher_name
        )
    .select_from(base_cte
             .outerjoin(att, sa.and_(att.c.grade==base_cte.c.grade, att.c.section==base_cte.c.section))
             .outerjoin(fees, sa.and_(fees.c.grade==base_cte.c.grade, fees.c.section==base_cte.c.section))
             .outerjoin(teacher, sa.and_(teacher.c.grade==base_cte.c.grade, teacher.c.section==base_cte.c.section)))
        .order_by(sa.cast(base_cte.c.grade, sa.Integer).asc(), base_cte.c.section.asc())
        .limit(limit)
        .offset(offset)
    )
    rows = (await session.execute(query)).all()
    status_map = await _class_status_map(session)
    out: List[ClassListResponse] = []
    for grade_val, section_val, total, male, female, att_pct, fee_due_count, fee_due_amt, teacher_name in rows:
        grade_int = int(grade_val) if str(grade_val).isdigit() else 0
        out.append(ClassListResponse(
            id=f"{grade_val}{section_val}",
            grade=grade_int,
            section=section_val,
            class_teacher=teacher_name,
            total=total,
            male=male or 0,
            female=female or 0,
            attendance_pct=int(att_pct or 0),
            fee_due_count=int(fee_due_count or 0),
            fee_due_amount=int(fee_due_amt or 0),
            result_status=status_map.get((grade_int, section_val), 'Pending')
        ))
    return out

@router.get("/{class_id}", response_model=ClassDetail)
async def get_class(class_id: str, session: AsyncSession = Depends(get_session), user=Depends(require('classes:detail'))):
    # Parse class_id like '8-A'
    try:
        if '-' in class_id:
            grade_part, section = class_id.split('-',1)
        else:
            # fallback: last char section
            grade_part, section = class_id[:-1], class_id[-1]
        grade_int = int(grade_part)
    except Exception:
        raise HTTPException(400, 'Invalid class_id format')
    stu = Student
    # Roster
    roster_stmt = select(stu.id, stu.first_name, stu.last_name, stu.guardian_phone, stu.roll, stu.gender).where(stu.class_==str(grade_int), stu.section==section).order_by(stu.roll.asc().nulls_last(), stu.id.asc())
    roster_rows = (await session.execute(roster_stmt)).all()
    if not roster_rows:
        # Ensure we still return metadata if status row exists
        status_map = await _class_status_map(session)
        result_status = status_map.get((grade_int, section), 'Pending')
        # class teacher lookup
        teacher_row = (await session.execute(select(ClassTeacher.teacher_name).where(ClassTeacher.grade==grade_int, ClassTeacher.section==section))).scalar_one_or_none()
        return ClassDetail(
            id=f"{grade_int}{section}",
            grade=grade_int,
            section=section,
            class_teacher=teacher_row,
            total=0, male=0, female=0,
            attendance_pct=0,
            fee_due_count=0,
            fee_due_amount=0,
            result_status=result_status,
            roster=[],
            generated_at=datetime.utcnow().isoformat()+"Z"
        )
    student_ids = [r[0] for r in roster_rows]
    # derive male/female counts from roster rows
    male = sum(1 for r in roster_rows if (r[5] or '').upper()=='M')
    female = sum(1 for r in roster_rows if (r[5] or '').upper()=='F')
    # Attendance aggregate
    att_stmt = select(
        func.coalesce(((func.sum(case((AttendanceEvent.present==1,1), else_=0))*100)/func.nullif(func.count(AttendanceEvent.id),0)).cast(sa.Integer),0)
    ).where(AttendanceEvent.student_id.in_(student_ids))
    attendance_pct = (await session.execute(att_stmt)).scalar() or 0
    # Fee aggregate
    fee_sum_stmt = select(
        func.coalesce(func.sum(FeeInvoice.amount - FeeInvoice.paid_amount),0),
        func.count(sa.distinct(sa.case((FeeInvoice.amount - FeeInvoice.paid_amount > 0, FeeInvoice.student_id), else_=None)))
    ).where(FeeInvoice.student_id.in_(student_ids), FeeInvoice.settled_at.is_(None))
    fee_sum, fee_due_count = (await session.execute(fee_sum_stmt)).one()
    status_map = await _class_status_map(session)
    result_status = status_map.get((grade_int, section), 'Pending')
    teacher_row = (await session.execute(select(ClassTeacher.teacher_name).where(ClassTeacher.grade==grade_int, ClassTeacher.section==section))).scalar_one_or_none()
    # Tag map
    tag_rows = (await session.execute(select(StudentTag.student_id, StudentTag.tag).where(StudentTag.student_id.in_(student_ids)))).all()
    tag_map: dict[int, list[str]] = {}
    for sid, tag in tag_rows:
        tag_map.setdefault(sid, []).append(tag)
    # Fee per student
    per_fee_stmt = select(FeeInvoice.student_id, func.coalesce(func.sum(FeeInvoice.amount - FeeInvoice.paid_amount),0)).where(FeeInvoice.student_id.in_(student_ids), FeeInvoice.settled_at.is_(None)).group_by(FeeInvoice.student_id)
    per_fee_map = { sid: amt for sid, amt in (await session.execute(per_fee_stmt)).all() }
    roster: list[RosterStudent] = []
    for sid, first_name, last_name, gphone, roll, _gender in roster_rows:
        roster.append(RosterStudent(
            student_id=sid,
            name=' '.join([p for p in [first_name,last_name] if p]),
            roll=roll,
            guardian_phone=gphone,
            tags=tag_map.get(sid, []),
            attendance_mark=None,
            fee_due_amount=int(per_fee_map.get(sid,0)),
            last_present_date=None
        ))
    return ClassDetail(
        id=f"{grade_int}{section}",
        grade=grade_int,
        section=section,
    class_teacher=teacher_row,
        total=len(roster_rows),
    male=int(male or 0),
    female=int(female or 0),
        attendance_pct=int(attendance_pct),
        fee_due_count=int(fee_due_count or 0),
        fee_due_amount=int(fee_sum or 0),
        result_status=result_status,
        roster=roster,
        generated_at=datetime.utcnow().isoformat()+"Z"
    )

class PatchClassPayload(BaseModel):
    result_status: Optional[str] = None
    class_teacher: Optional[str] = None

@router.patch('/{class_id}', response_model=ClassDetail)
async def patch_class(class_id: str, payload: PatchClassPayload, session: AsyncSession = Depends(get_session), user=Depends(require('classes:bulk'))):
    # reuse parsing logic
    try:
        if '-' in class_id:
            grade_part, section = class_id.split('-',1)
        else:
            grade_part, section = class_id[:-1], class_id[-1]
        grade_int = int(grade_part)
    except Exception:
        raise HTTPException(400, 'Invalid class_id format')
    changed = False
    if payload.result_status:
        if payload.result_status not in {'Published','Pending'}:
            raise HTTPException(400,'Invalid result_status')
        existing = (await session.execute(select(ClassStatus).where(ClassStatus.grade==grade_int, ClassStatus.section==section))).scalar_one_or_none()
        if existing:
            existing.result_status = payload.result_status
        else:
            session.add(ClassStatus(grade=grade_int, section=section, result_status=payload.result_status))
        changed = True
    if payload.class_teacher is not None:
        if payload.class_teacher.strip()=="":
            # remove teacher assignment
            existing_t = (await session.execute(select(ClassTeacher).where(ClassTeacher.grade==grade_int, ClassTeacher.section==section))).scalar_one_or_none()
            if existing_t:
                await session.delete(existing_t)
        else:
            existing_t = (await session.execute(select(ClassTeacher).where(ClassTeacher.grade==grade_int, ClassTeacher.section==section))).scalar_one_or_none()
            if existing_t:
                existing_t.teacher_name = payload.class_teacher.strip()
            else:
                session.add(ClassTeacher(grade=grade_int, section=section, teacher_name=payload.class_teacher.strip()))
        changed = True
    if changed:
        await session.commit()
    return await get_class(class_id, session=session, user=user)

@router.post('/bulk-action', response_model=BulkActionResponse)
async def bulk_action(payload: BulkActionRequest, session: AsyncSession = Depends(get_session), user=Depends(require('classes:bulk'))):
    if not payload.class_ids:
        raise HTTPException(400, 'No class_ids provided')
    affected = 0
    if payload.action == 'set_result':
        new_status = (payload.params or {}).get('result_status')
        if new_status not in {'Published','Pending'}:
            raise HTTPException(400, 'Invalid result_status')
        for cid in payload.class_ids:
            try:
                if '-' in cid:
                    grade_part, section = cid.split('-',1)
                else:
                    grade_part, section = cid[:-1], cid[-1]
                grade_int = int(grade_part)
            except Exception:
                continue
            # upsert logic
            existing = await session.execute(select(ClassStatus).where(ClassStatus.grade==grade_int, ClassStatus.section==section))
            row = existing.scalar_one_or_none()
            if row:
                row.result_status = new_status
            else:
                session.add(ClassStatus(grade=grade_int, section=section, result_status=new_status))
            affected += 1
        await session.commit()
        return BulkActionResponse(status='ok', task_id=None, affected=affected)
    # Other actions would enqueue tasks; simulate
    return BulkActionResponse(status='queued', task_id='task-placeholder', affected=len(payload.class_ids))
