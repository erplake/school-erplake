from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from typing import Optional
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from enum import Enum
# NOTE: Transport module introduced new permission scopes (see transport.router):
#  transport:read  – list/get buses, logs, incidents
#  transport:write – create/update buses
#  transport:maint – create service logs & incidents (maintenance actions)
#  transport:gps   – ingest GPS pings
# Enums
class StaffRole(str, Enum):
    Teacher = 'Teacher'
    Admin = 'Admin'
    Accountant = 'Accountant'
    Counselor = 'Counselor'
    Librarian = 'Librarian'
    Principal = 'Principal'

class Department(str, Enum):
    Mathematics = 'Mathematics'
    Science = 'Science'
    English = 'English'
    Humanities = 'Humanities'
    Sports = 'Sports'
    Administration = 'Administration'
    Finance = 'Finance'

class LeaveType(str, Enum):
    Sick = 'Sick Leave'
    Casual = 'Casual Leave'
    Earned = 'Earned Leave'
    Unpaid = 'Unpaid Leave'
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from ...core.db import get_session
from ...core.security import require
from .models import Staff, StaffLeaveRequest, StaffAnnouncement, StaffDuty, StaffSubstitution
import sqlalchemy as sa

router = APIRouter(prefix="/staff", tags=["staff"]) 

# Pydantic Schemas
class StaffCreate(BaseModel):
    staff_code: str
    name: str
    role: StaffRole
    department: Optional[Department] = None
    grade: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_joining: Optional[date] = None
    birthday: Optional[date] = None
    reports_to: Optional[str] = None

    def model_post_init(self, __context):
        today = date.today()
        if self.date_of_joining and self.date_of_joining > today:
            raise HTTPException(422, 'date_of_joining cannot be in the future')
        if self.birthday and self.birthday > today:
            raise HTTPException(422, 'birthday cannot be in the future')

class StaffUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[StaffRole] = None
    department: Optional[Department] = None
    grade: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_joining: Optional[date] = None
    birthday: Optional[date] = None
    reports_to: Optional[str] = None
    status: Optional[str] = None
    attendance_30: Optional[int] = None
    leave_balance: Optional[int] = None
    resignation_date: Optional[date] = None
    resignation_reason: Optional[str] = None

    def model_post_init(self, __context):
        today = date.today()
        if self.date_of_joining and self.date_of_joining > today:
            raise HTTPException(422, 'date_of_joining cannot be in the future')
        if self.birthday and self.birthday > today:
            raise HTTPException(422, 'birthday cannot be in the future')

class StaffOut(BaseModel):
    id: int
    staff_code: str
    name: str
    role: str
    department: Optional[str]
    grade: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    date_of_joining: Optional[str]
    birthday: Optional[str]
    reports_to: Optional[str]
    status: str
    attendance_30: int
    leaves_taken_ytd: int
    leave_balance: int
    last_appraisal: Optional[str]
    next_appraisal: Optional[str]
    resignation_date: Optional[str]
    resignation_reason: Optional[str]

    @classmethod
    def from_model(cls, s: Staff):
        iso = lambda d: d.isoformat() if d else None
        return cls(
            id=s.id,
            staff_code=s.staff_code,
            name=s.name,
            role=s.role,
            department=s.department,
            grade=s.grade,
            email=s.email,
            phone=s.phone,
            date_of_joining=iso(s.date_of_joining),
            birthday=iso(s.birthday),
            reports_to=s.reports_to,
            status=s.status,
            attendance_30=s.attendance_30 or 0,
            leaves_taken_ytd=s.leaves_taken_ytd or 0,
            leave_balance=s.leave_balance or 0,
            last_appraisal=iso(s.last_appraisal),
            next_appraisal=iso(s.next_appraisal),
            resignation_date=iso(s.resignation_date),
            resignation_reason=s.resignation_reason,
        )

class LeaveRequestCreate(BaseModel):
    staff_id: int
    leave_type: LeaveType
    date_from: date
    date_to: date
    days: int
    reason: Optional[str] = None

    @classmethod
    def validate_dates(cls, values):
        df = values.get('date_from'); dt = values.get('date_to'); days = values.get('days')
        if df and dt and df > dt:
            raise HTTPException(422, 'date_from cannot be after date_to')
        if df and dt and days:
            delta = (dt - df).days + 1
            if days != delta:
                raise HTTPException(422, f'days must equal inclusive range length ({delta})')
        return values

    def model_post_init(self, __context):  # pydantic v2 hook
        # manual check after parsing
        _ = self.validate_dates(self.__dict__)

class LeaveRequestOut(BaseModel):
    id: int
    staff_id: int
    leave_type: str
    date_from: str
    date_to: str
    days: int
    reason: Optional[str]
    status: str

    @classmethod
    def from_model(cls, r: StaffLeaveRequest):
        iso = lambda d: d.isoformat() if d else None
        return cls(
            id=r.id,
            staff_id=r.staff_id,
            leave_type=r.leave_type,
            date_from=iso(r.date_from),
            date_to=iso(r.date_to),
            days=r.days,
            reason=r.reason,
            status=r.status
        )

class AnnouncementCreate(BaseModel):
    message: str

class AnnouncementOut(BaseModel):
    id: int
    message: str
    created_at: str

    @classmethod
    def from_model(cls, a: StaffAnnouncement):
        return cls(id=a.id, message=a.message, created_at=a.created_at.isoformat() if a.created_at else None)

class DutyCreate(BaseModel):
    staff_id: int
    title: str
    duty_date: date
    notes: Optional[str] = None

class DutyOut(BaseModel):
    id: int
    staff_id: int
    title: str
    duty_date: str
    notes: Optional[str]
    created_at: Optional[str]

    @classmethod
    def from_model(cls, d: StaffDuty):
        return cls(id=d.id, staff_id=d.staff_id, title=d.title, duty_date=d.duty_date.isoformat(), notes=d.notes, created_at=d.created_at.isoformat() if d.created_at else None)

class SubstitutionCreate(BaseModel):
    date: date
    absent_staff_id: int
    substitute_staff_id: int
    periods: str  # validated simple comma-separated list client-side
    notes: Optional[str] = None

class SubstitutionOut(BaseModel):
    id: int
    date: str
    absent_staff_id: int
    substitute_staff_id: int
    periods: str
    notes: Optional[str]
    created_at: Optional[str]

    @classmethod
    def from_model(cls, s: StaffSubstitution):
        return cls(id=s.id, date=s.date.isoformat(), absent_staff_id=s.absent_staff_id, substitute_staff_id=s.substitute_staff_id, periods=s.periods, notes=s.notes, created_at=s.created_at.isoformat() if s.created_at else None)

# Routes
@router.post("", response_model=StaffOut)
async def create_staff(body: StaffCreate, session: AsyncSession = Depends(get_session), user=Depends(require('staff:create'))):
    existing = await session.execute(select(Staff).where(Staff.staff_code==body.staff_code))
    if existing.scalar_one_or_none():
        raise HTTPException(409, 'staff_code already exists')
    s = Staff(
        staff_code=body.staff_code,
        name=body.name,
        role=body.role,
        department=body.department,
        grade=body.grade,
        email=body.email,
        phone=body.phone,
        date_of_joining=body.date_of_joining,
        birthday=body.birthday,
        reports_to=body.reports_to,
    )
    session.add(s)
    await session.commit(); await session.refresh(s)
    return StaffOut.from_model(s)

@router.get("", response_model=list[StaffOut])
async def list_staff(
    response: Response,
    session: AsyncSession = Depends(get_session),
    user=Depends(require('staff:list')),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    role: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
):
    stmt = select(Staff)
    if search:
        like = f"%{search.lower()}%"
        stmt = stmt.where(sa.or_(sa.func.lower(Staff.name).like(like), sa.func.lower(Staff.staff_code).like(like)))
    if role:
        stmt = stmt.where(Staff.role==role)
    if department:
        stmt = stmt.where(Staff.department==department)
    if status:
        stmt = stmt.where(Staff.status==status)
    total = (await session.execute(stmt.with_only_columns(sa.func.count()))).scalar_one()
    stmt = stmt.order_by(Staff.id.desc()).offset(offset).limit(limit)
    rows = (await session.execute(stmt)).scalars().all()
    response.headers['X-Total-Count'] = str(total)
    return [StaffOut.from_model(r) for r in rows]

@router.get("/id/{staff_id}", response_model=StaffOut)
async def get_staff(staff_id: int, session: AsyncSession = Depends(get_session), user=Depends(require('staff:detail'))):
    r = (await session.execute(select(Staff).where(Staff.id==staff_id))).scalar_one_or_none()
    if not r:
        raise HTTPException(404, 'Not found')
    return StaffOut.from_model(r)

@router.patch("/id/{staff_id}", response_model=StaffOut)
async def update_staff(staff_id: int, body: StaffUpdate, session: AsyncSession = Depends(get_session), user=Depends(require('staff:update'))):
    r = (await session.execute(select(Staff).where(Staff.id==staff_id))).scalar_one_or_none()
    if not r:
        raise HTTPException(404, 'Not found')
    updates = body.dict(exclude_unset=True)
    for k,v in updates.items():
        if hasattr(r,k) and v is not None:
            setattr(r,k,v)
    await session.commit(); await session.refresh(r)
    return StaffOut.from_model(r)

@router.post('/leave', response_model=LeaveRequestOut)
async def create_leave(body: LeaveRequestCreate, session: AsyncSession = Depends(get_session), user=Depends(require('staff:leave'))):
    staff = (await session.execute(select(Staff).where(Staff.id==body.staff_id))).scalar_one_or_none()
    if not staff:
        raise HTTPException(404, 'Staff not found')
    lr = StaffLeaveRequest(
        staff_id=body.staff_id,
        leave_type=body.leave_type,
        date_from=body.date_from,
        date_to=body.date_to,
        days=body.days,
        reason=body.reason
    )
    session.add(lr)
    staff.leaves_taken_ytd = (staff.leaves_taken_ytd or 0) + body.days
    staff.leave_balance = max(0, (staff.leave_balance or 0) - body.days)
    await session.commit(); await session.refresh(lr)
    return LeaveRequestOut.from_model(lr)

@router.post('/leave/{leave_id}/transition', response_model=LeaveRequestOut)
async def transition_leave(leave_id: int, target: str, session: AsyncSession = Depends(get_session), user=Depends(require('staff:leave'))):
    lr = (await session.execute(select(StaffLeaveRequest).where(StaffLeaveRequest.id==leave_id))).scalar_one_or_none()
    if not lr:
        raise HTTPException(404, 'Leave not found')
    if target not in {'Approved','Rejected','Cancelled'}:
        raise HTTPException(400, 'Invalid target')
    lr.status = target
    await session.commit(); await session.refresh(lr)
    return LeaveRequestOut.from_model(lr)

@router.get('/leave', response_model=list[LeaveRequestOut])
async def list_leave_requests(
    response: Response,
    session: AsyncSession = Depends(get_session),
    user=Depends(require('staff:leave')),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    staff_id: Optional[int] = None,
    status: Optional[str] = None,
    leave_type: Optional[str] = None,
):
    stmt = select(StaffLeaveRequest)
    if staff_id:
        stmt = stmt.where(StaffLeaveRequest.staff_id==staff_id)
    if status:
        stmt = stmt.where(StaffLeaveRequest.status==status)
    if leave_type:
        stmt = stmt.where(StaffLeaveRequest.leave_type==leave_type)
    total = (await session.execute(stmt.with_only_columns(sa.func.count()))).scalar_one()
    stmt = stmt.order_by(StaffLeaveRequest.id.desc()).offset(offset).limit(limit)
    rows = (await session.execute(stmt)).scalars().all()
    response.headers['X-Total-Count'] = str(total)
    return [LeaveRequestOut.from_model(r) for r in rows]

# Announcements
@router.post('/announcements', response_model=AnnouncementOut)
async def create_announcement(body: AnnouncementCreate, session: AsyncSession = Depends(get_session), user=Depends(require('staff:announce'))):
    if not body.message.strip():
        raise HTTPException(422, 'message cannot be empty')
    a = StaffAnnouncement(message=body.message.strip())
    session.add(a)
    await session.commit(); await session.refresh(a)
    return AnnouncementOut.from_model(a)

@router.get('/announcements', response_model=list[AnnouncementOut])
async def list_announcements(
    response: Response,
    session: AsyncSession = Depends(get_session),
    user=Depends(require('staff:announce')),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    stmt = select(StaffAnnouncement).order_by(StaffAnnouncement.id.desc()).offset(offset).limit(limit)
    rows = (await session.execute(stmt)).scalars().all()
    return [AnnouncementOut.from_model(r) for r in rows]

# Duties
@router.post('/duties', response_model=DutyOut)
async def create_duty(body: DutyCreate, session: AsyncSession = Depends(get_session), user=Depends(require('staff:duty'))):
    staff = (await session.execute(select(Staff).where(Staff.id==body.staff_id, Staff.status!='Resigned'))).scalar_one_or_none()
    if not staff:
        raise HTTPException(404, 'Active staff not found')
    d = StaffDuty(staff_id=body.staff_id, title=body.title.strip(), duty_date=body.duty_date, notes=(body.notes or None))
    session.add(d); await session.commit(); await session.refresh(d)
    return DutyOut.from_model(d)

@router.get('/duties', response_model=list[DutyOut])
async def list_duties(
    session: AsyncSession = Depends(get_session),
    user=Depends(require('staff:duty')),
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    limit: int = Query(20, ge=1, le=100),
):
    stmt = select(StaffDuty)
    if from_date:
        stmt = stmt.where(StaffDuty.duty_date >= from_date)
    if to_date:
        stmt = stmt.where(StaffDuty.duty_date <= to_date)
    stmt = stmt.order_by(StaffDuty.duty_date.desc(), StaffDuty.id.desc()).limit(limit)
    rows = (await session.execute(stmt)).scalars().all()
    return [DutyOut.from_model(r) for r in rows]

# Substitutions
@router.post('/substitutions', response_model=SubstitutionOut)
async def create_substitution(body: SubstitutionCreate, session: AsyncSession = Depends(get_session), user=Depends(require('staff:substitute'))):
    if body.absent_staff_id == body.substitute_staff_id:
        raise HTTPException(422, 'absent and substitute staff must differ')
    absent = (await session.execute(select(Staff).where(Staff.id==body.absent_staff_id))).scalar_one_or_none()
    sub = (await session.execute(select(Staff).where(Staff.id==body.substitute_staff_id))).scalar_one_or_none()
    if not absent or not sub:
        raise HTTPException(404, 'staff not found')
    s = StaffSubstitution(date=body.date, absent_staff_id=body.absent_staff_id, substitute_staff_id=body.substitute_staff_id, periods=body.periods, notes=body.notes)
    session.add(s); await session.commit(); await session.refresh(s)
    return SubstitutionOut.from_model(s)

@router.get('/substitutions', response_model=list[SubstitutionOut])
async def list_substitutions(
    session: AsyncSession = Depends(get_session),
    user=Depends(require('staff:substitute')),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = Query(20, ge=1, le=100),
):
    stmt = select(StaffSubstitution)
    if date_from:
        stmt = stmt.where(StaffSubstitution.date >= date_from)
    if date_to:
        stmt = stmt.where(StaffSubstitution.date <= date_to)
    stmt = stmt.order_by(StaffSubstitution.date.desc(), StaffSubstitution.id.desc()).limit(limit)
    rows = (await session.execute(stmt)).scalars().all()
    return [SubstitutionOut.from_model(r) for r in rows]
