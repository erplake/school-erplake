from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from ...core.db import get_session
from ...core.security import require
from .models import AdmissionApplication, AdmissionStatus
from ..students.models import Student

router = APIRouter(prefix="/admissions", tags=["admissions"])

class AdmissionCreate(BaseModel):
    applicant_first_name: str
    applicant_last_name: Optional[str] = None
    desired_class: Optional[str] = None
    academic_year: Optional[str] = None
    dob: Optional[date] = None
    guardian_primary_name: str
    guardian_primary_phone: str
    guardian_secondary_name: Optional[str] = None
    guardian_secondary_phone: Optional[str] = None
    prior_school: Optional[str] = None
    fee_plan_requested: Optional[str] = None

class AdmissionUpdate(BaseModel):
    applicant_first_name: Optional[str] = None
    applicant_last_name: Optional[str] = None
    desired_class: Optional[str] = None
    academic_year: Optional[str] = None
    dob: Optional[date] = None
    guardian_primary_name: Optional[str] = None
    guardian_primary_phone: Optional[str] = None
    guardian_secondary_name: Optional[str] = None
    guardian_secondary_phone: Optional[str] = None
    prior_school: Optional[str] = None
    fee_plan_requested: Optional[str] = None
    notes_internal: Optional[str] = None

class AdmissionOut(BaseModel):
    id: str
    applicant_first_name: str
    applicant_last_name: Optional[str]
    desired_class: Optional[str]
    academic_year: Optional[str]
    dob: Optional[date]
    guardian_primary_name: Optional[str]
    guardian_primary_phone: Optional[str]
    guardian_secondary_name: Optional[str]
    guardian_secondary_phone: Optional[str]
    prior_school: Optional[str]
    fee_plan_requested: Optional[str]
    status: str
    enrolled_student_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, a: AdmissionApplication):
        return cls(
            id=a.id,
            applicant_first_name=a.applicant_first_name,
            applicant_last_name=a.applicant_last_name,
            desired_class=a.desired_class,
            academic_year=a.academic_year,
            dob=a.dob,
            guardian_primary_name=a.guardian_primary_name,
            guardian_primary_phone=a.guardian_primary_phone,
            guardian_secondary_name=a.guardian_secondary_name,
            guardian_secondary_phone=a.guardian_secondary_phone,
            prior_school=a.prior_school,
            fee_plan_requested=a.fee_plan_requested,
            status=a.status,
            enrolled_student_id=a.enrolled_student_id,
            created_at=a.created_at,
            updated_at=a.updated_at
        )

@router.post('', response_model=AdmissionOut)
async def create_admission(body: AdmissionCreate, session: AsyncSession = Depends(get_session), user=Depends(require('admissions:create'))):
    app = AdmissionApplication(
        applicant_first_name=body.applicant_first_name,
        applicant_last_name=body.applicant_last_name,
        desired_class=body.desired_class,
        academic_year=body.academic_year,
        dob=body.dob,
        guardian_primary_name=body.guardian_primary_name,
        guardian_primary_phone=body.guardian_primary_phone,
        guardian_secondary_name=body.guardian_secondary_name,
        guardian_secondary_phone=body.guardian_secondary_phone,
        prior_school=body.prior_school,
        fee_plan_requested=body.fee_plan_requested,
        status=AdmissionStatus.draft.value,
        status_history={'events': [{'at': datetime.utcnow().isoformat(), 'to': 'draft'}]}
    )
    session.add(app)
    await session.commit()
    await session.refresh(app)
    return AdmissionOut.from_model(app)

@router.get('', response_model=List[AdmissionOut])
async def list_admissions(session: AsyncSession = Depends(get_session), user=Depends(require('admissions:list'))):
    result = await session.execute(select(AdmissionApplication).order_by(AdmissionApplication.created_at.desc()).limit(200))
    return [AdmissionOut.from_model(a) for a in result.scalars().all()]

@router.get('/{app_id}', response_model=AdmissionOut)
async def get_admission(app_id: str, session: AsyncSession = Depends(get_session), user=Depends(require('admissions:view'))):
    result = await session.execute(select(AdmissionApplication).where(AdmissionApplication.id==app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(404, 'Not found')
    return AdmissionOut.from_model(app)

@router.patch('/{app_id}', response_model=AdmissionOut)
async def update_admission(app_id: str, body: AdmissionUpdate, session: AsyncSession = Depends(get_session), user=Depends(require('admissions:update'))):
    result = await session.execute(select(AdmissionApplication).where(AdmissionApplication.id==app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(404, 'Not found')
    if app.status not in [AdmissionStatus.draft.value, AdmissionStatus.submitted.value, AdmissionStatus.screening.value]:
        raise HTTPException(400, 'Cannot modify in current status')
    for field, value in body.dict(exclude_unset=True).items():
        setattr(app, field, value)
    await session.commit()
    await session.refresh(app)
    return AdmissionOut.from_model(app)

class TransitionRequest(BaseModel):
    target: str

VALID_TRANSITIONS = {
    'draft': {'submitted','withdrawn'},
    'submitted': {'screening','withdrawn','rejected'},
    'screening': {'shortlisted','rejected','withdrawn'},
    'shortlisted': {'offered','rejected','withdrawn'},
    'offered': {'accepted','rejected','withdrawn'},
    'accepted': {'enrolled'},
}

@router.post('/{app_id}/transition', response_model=AdmissionOut)
async def transition_admission(app_id: str, body: TransitionRequest, session: AsyncSession = Depends(get_session), user=Depends(require('admissions:transition'))):
    result = await session.execute(select(AdmissionApplication).where(AdmissionApplication.id==app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(404, 'Not found')
    target = body.target
    current = app.status
    if current == target:
        return AdmissionOut.from_model(app)
    allowed = VALID_TRANSITIONS.get(current, set())
    if target not in allowed:
        raise HTTPException(400, f'Invalid transition from {current} to {target}')
    hist = app.status_history or {'events': []}
    hist['events'].append({'at': datetime.utcnow().isoformat(), 'from': current, 'to': target})
    app.status_history = hist
    app.status = target
    # Enrollment conversion
    if target == AdmissionStatus.enrolled.value:
        if app.enrolled_student_id:
            return AdmissionOut.from_model(app)
        student = Student(
            admission_no=None,
            first_name=app.applicant_first_name,
            last_name=app.applicant_last_name,
            class_=app.desired_class,
            section=None,
            guardian_phone=app.guardian_primary_phone,
            attendance_pct=0,
            fee_due_amount=0,
            transport=None,
            tags='',
            absent_today=0,
        )
        session.add(student)
        await session.flush()
        app.enrolled_student_id = student.id
    await session.commit()
    await session.refresh(app)
    return AdmissionOut.from_model(app)
