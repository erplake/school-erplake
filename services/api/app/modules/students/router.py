from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from sqlalchemy import select, func, case, literal
import sqlalchemy as sa
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from ...core.db import get_session
from ...core.security import require
from .models import Student as LegacyStudent
from .models_extra import StudentTag, StudentTransport, AttendanceEvent, FeeInvoice
from ..core.models_new import CoreStudent as NewStudent, Enrollment, ClassSection, AcademicYear, School  # type: ignore

# Transitional flag: switch when ready to fully deprecate legacy students table.
USE_NEW_STUDENT_MODEL = True

router = APIRouter(prefix="/students", tags=["students"])

class StudentCreate(BaseModel):
    admission_no: Optional[str] = None
    # Accept either consolidated name or split names
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    class_name: Optional[str] = None  # compatibility with older tests
    klass: Optional[str] = None
    section: Optional[str] = None
    gender: Optional[str] = None  # 'M','F','O'
    guardian_phone: Optional[str] = None
    attendance_pct: Optional[int] = 0
    fee_due_amount: Optional[int] = 0
    transport: Optional[dict] = None
    tags: Optional[List[str]] = []
    absent_today: Optional[bool] = False

class StudentOut(BaseModel):
    id: int
    admission_no: Optional[str]
    first_name: str
    last_name: Optional[str]
    klass: Optional[str]
    section: Optional[str]
    guardian_phone: Optional[str]
    gender: Optional[str]
    roll: Optional[int]
    attendance_pct: Optional[int]
    fee_due_amount: Optional[int]
    transport: Optional[dict]
    tags: list[str]
    absent_today: bool
    updated_at: Optional[datetime]

    @classmethod
    def from_model(cls, s):
        tag_list = [t for t in (s.tags or '').split(',') if t]
        return cls(
            id=s.id,
            admission_no=getattr(s, 'admission_no', getattr(s, 'adm_no', None)),
            first_name=getattr(s, 'first_name', ''),
            last_name=getattr(s, 'last_name', None),
            klass=getattr(s, 'class_', None),
            section=getattr(s, 'section', None),
            guardian_phone=getattr(s, 'guardian_phone', None),
            gender=getattr(s, 'gender', None),
            roll=getattr(s, 'roll', None),
            attendance_pct=getattr(s, 'attendance_pct', None),
            fee_due_amount=getattr(s, 'fee_due_amount', None),
            transport=getattr(s, 'transport', None),
            tags=tag_list,
            absent_today=bool(getattr(s, 'absent_today', 0)),
            updated_at=getattr(s, 'updated_at', None)
        )

@router.post("", response_model=StudentOut)
async def create_student(body: StudentCreate, session: AsyncSession = Depends(get_session), user=Depends(require('students:create'))):
    # Resolve name parts
    first = body.first_name
    last = body.last_name
    if body.name and not first:
        # naive split
        parts = body.name.split(' ', 1)
        first = parts[0]
        if len(parts) > 1 and not last:
            last = parts[1]
    # Determine class
    klass_val = body.klass or body.class_name
    if USE_NEW_STUDENT_MODEL:
        # Require a school context; for now assume single school id = 1 until multi-tenancy enforcement.
        # TODO: derive school_id from user claims / request.
        student = NewStudent(
            school_id=1,
            adm_no=body.admission_no,
            first_name=first or '',
            last_name=last,
            gender=body.gender,
            is_active=True,
        )
        session.add(student)
        try:
            await session.commit()
        except IntegrityError:
            await session.rollback()
            raise HTTPException(409, "Admission number already exists (new model)")
        await session.refresh(student)
        # Enrollment creation if class/section provided and current academic year exists
        if klass_val and body.section:
            ay = await session.scalar(select(AcademicYear).where(AcademicYear.is_current==True).limit(1))
            if ay:
                cs = await session.scalar(
                    select(ClassSection).where(
                        ClassSection.school_id==1,
                        ClassSection.ay_id==ay.id,
                        ClassSection.grade_label==klass_val,
                        ClassSection.section_label==body.section
                    ).limit(1)
                )
                if cs:
                    session.add(Enrollment(student_id=student.id, class_section_id=cs.id))
                    try:
                        await session.commit()
                    except Exception:
                        await session.rollback()
    else:
        student = LegacyStudent(
            admission_no=body.admission_no,
            first_name=first or '',
            last_name=last,
            class_=klass_val,
            section=body.section,
            gender=body.gender,
            guardian_phone=body.guardian_phone,
            attendance_pct=body.attendance_pct or 0,
            fee_due_amount=body.fee_due_amount or 0,
            transport=body.transport,
            tags=','.join(body.tags or []),
            absent_today=1 if body.absent_today else 0,
        )
        session.add(student)
        try:
            await session.commit()
        except IntegrityError:
            await session.rollback()
            raise HTTPException(409, "Admission number already exists")
        await session.refresh(student)
    session.add(student)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(409, "Admission number already exists")
    await session.refresh(student)
    # Populate normalization tables (best-effort; failures won't block core student creation)
    changed = False
    # Tags
    if body.tags:
        for tg in body.tags:
            session.add(StudentTag(student_id=student.id, tag=tg))
        changed = True
    # Transport
    if body.transport and isinstance(body.transport, dict):
        route = body.transport.get('route')
        stop = body.transport.get('stop')
        if route and stop:
            session.add(StudentTransport(student_id=student.id, route=route, stop=stop, active=1))
            changed = True
    if changed:
        try:
            await session.commit()
        except Exception:
            await session.rollback()
    return StudentOut.from_model(student)

@router.get("", response_model=list[StudentOut])
async def list_students(session: AsyncSession = Depends(get_session), user=Depends(require('students:list'))):
    # Correlated subqueries to compute dynamic values from normalization tables.
    attendance_pct_expr = (
        select(
            func.coalesce(
                (
                    (func.sum(case((AttendanceEvent.present == 1, 1), else_=0)) * 100)
                    / func.nullif(func.count(AttendanceEvent.id), 0)
                ).cast(sa.Integer), 0
            )
        )
        .where(AttendanceEvent.student_id == Student.id)
        .correlate(Student)
        .scalar_subquery()
    )

    fee_due_expr = (
        select(
            func.coalesce(func.sum(FeeInvoice.amount - FeeInvoice.paid_amount), 0)
        )
        .where(FeeInvoice.student_id == Student.id)
        .where(FeeInvoice.settled_at.is_(None))
        .correlate(Student)
        .scalar_subquery()
    )

    tags_expr = (
        select(func.string_agg(StudentTag.tag, literal(',')))
        .where(StudentTag.student_id == Student.id)
        .correlate(Student)
        .scalar_subquery()
    )

    transport_expr = (
        select(
            func.json_build_object('route', StudentTransport.route, 'stop', StudentTransport.stop)
        )
        .where(StudentTransport.student_id == Student.id)
        .where(StudentTransport.active == 1)
        .order_by(StudentTransport.updated_at.desc())
        .limit(1)
        .correlate(Student)
        .scalar_subquery()
    )

    if USE_NEW_STUDENT_MODEL:
        # Simplified listing for new model (no derived aggregates yet)
        stmt = select(NewStudent).order_by(NewStudent.id.desc()).limit(200)
        result = await session.execute(stmt)
        students = result.scalars().all()
        return [StudentOut.from_model(s) for s in students]
    else:
        stmt = (
            select(
                LegacyStudent,
                attendance_pct_expr.label('attendance_pct_calc'),
                fee_due_expr.label('fee_due_amount_calc'),
                tags_expr.label('tags_calc'),
                transport_expr.label('transport_calc')
            )
            .order_by(LegacyStudent.id.desc())
            .limit(200)
        )
        result = await session.execute(stmt)
        rows = result.all()
        out: List[StudentOut] = []
        for student, attendance_pct_calc, fee_due_calc, tags_calc, transport_calc in rows:
            model_out = StudentOut.from_model(student)
            if attendance_pct_calc is not None:
                model_out.attendance_pct = int(attendance_pct_calc)
            if fee_due_calc is not None:
                model_out.fee_due_amount = int(fee_due_calc)
            if tags_calc:
                model_out.tags = [t for t in tags_calc.split(',') if t]
            if transport_calc is not None:
                model_out.transport = transport_calc
            out.append(model_out)
        return out


class MessageRequest(BaseModel):
    message: str

class StudentPatch(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    klass: Optional[str] = None
    section: Optional[str] = None
    gender: Optional[str] = None
    guardian_phone: Optional[str] = None
    tags: Optional[List[str]] = None
    transport: Optional[dict] = None  # {'route': str, 'stop': str}

@router.patch("/{student_id}", response_model=StudentOut)
async def update_student(student_id: int, body: StudentPatch, session: AsyncSession = Depends(get_session), user=Depends(require('students:update'))):
    result = await session.execute(select(Student).where(Student.id==student_id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(404, 'Student not found')
    # Update core fields
    updates = body.dict(exclude_unset=True)
    core_fields = ['first_name','last_name','klass','section','guardian_phone']
    if 'gender' in updates:
        s.gender = updates['gender']
    for fld in core_fields:
        if fld == 'klass' and 'klass' in updates:
            s.class_ = updates['klass']
        elif fld in updates:
            setattr(s, fld if fld != 'klass' else 'class_', updates[fld])
    # Tags update (normalized + legacy string for transition period)
    if 'tags' in updates and updates['tags'] is not None:
        # Clear existing normalized tags
        await session.execute(sa.delete(StudentTag).where(StudentTag.student_id==s.id))
        for tg in updates['tags']:
            if tg:
                session.add(StudentTag(student_id=s.id, tag=tg))
        s.tags = ','.join([t for t in updates['tags'] if t])
    # Transport update
    if 'transport' in updates and updates['transport']:
        tr = updates['transport']
        route = tr.get('route') if isinstance(tr, dict) else None
        stop = tr.get('stop') if isinstance(tr, dict) else None
        if route and stop:
            # deactivate existing active rows
            await session.execute(sa.update(StudentTransport).where(StudentTransport.student_id==s.id, StudentTransport.active==1).values(active=0))
            session.add(StudentTransport(student_id=s.id, route=route, stop=stop, active=1))
            s.transport = {'route': route, 'stop': stop}
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(409, 'Conflict updating student')
    await session.refresh(s)
    # Re-fetch dynamic aggregates using single-row version of list logic if needed
    out = StudentOut.from_model(s)
    # Gather derived values
    derived = await session.execute(
        select(
            (
                select(
                    func.coalesce(
                        ((func.sum(case((AttendanceEvent.present == 1, 1), else_=0))*100)/func.nullif(func.count(AttendanceEvent.id),0)).cast(sa.Integer),0)
                ).where(AttendanceEvent.student_id==s.id)
            ).label('att'),
            (
                select(func.coalesce(func.sum(FeeInvoice.amount - FeeInvoice.paid_amount),0)).where(FeeInvoice.student_id==s.id).where(FeeInvoice.settled_at.is_(None))
            ).label('fee'),
            (
                select(func.string_agg(StudentTag.tag, literal(','))).where(StudentTag.student_id==s.id)
            ).label('tags'),
            (
                select(func.json_build_object('route', StudentTransport.route, 'stop', StudentTransport.stop))
                .where(StudentTransport.student_id==s.id)
                .where(StudentTransport.active==1)
                .order_by(StudentTransport.updated_at.desc()).limit(1)
            ).label('transport')
        )
    )
    att, fee, tags_str, tr_obj = derived.one()
    if att is not None: out.attendance_pct = int(att)
    if fee is not None: out.fee_due_amount = int(fee)
    if tags_str: out.tags = [t for t in tags_str.split(',') if t]
    if tr_obj is not None: out.transport = tr_obj
    return out

@router.post("/{student_id}/message")
async def message_guardian(student_id: int, body: MessageRequest, session: AsyncSession = Depends(get_session), user=Depends(require('students:message'))):
    # Placeholder: in real system enqueue a notification job
    result = await session.execute(select(Student).where(Student.id==student_id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(404, 'Student not found')
    return {"status":"queued","student_id": student_id, "length": len(body.message)}

@router.get("/{student_id}/bonafide")
async def generate_bonafide(student_id: int, session: AsyncSession = Depends(get_session), user=Depends(require('students:bonafide'))):
    result = await session.execute(select(Student).where(Student.id==student_id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(404, 'Student not found')
    # Placeholder certificate content
    content = f"Bonafide Certificate\nThis is to certify that {s.first_name} {s.last_name or ''} is a bonafide student of class {s.class_ or ''} section {s.section or ''}."
    return {"student_id": student_id, "bonafide_text": content}
