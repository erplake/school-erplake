from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ...core.db import get_session
from ...core.security import require
from .models import LeaveRequest, LeaveStatus, LeaveType
from ..students.models_extra import AttendanceEvent

router = APIRouter(prefix="/leaves", tags=["leaves"])

class LeaveCreate(BaseModel):
    student_id: int
    start_date: date
    end_date: date
    type: Optional[str] = LeaveType.other.value
    reason: Optional[str] = None
    requested_by: Optional[str] = None

class LeaveOut(BaseModel):
    id: str
    student_id: int
    start_date: date
    end_date: date
    type: str
    reason: Optional[str]
    status: str
    requested_by: Optional[str]
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    auto_generated_absence_events: bool
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, l: LeaveRequest):
        return cls(
            id=l.id,
            student_id=l.student_id,
            start_date=l.start_date,
            end_date=l.end_date,
            type=l.type,
            reason=l.reason,
            status=l.status,
            requested_by=l.requested_by,
            approved_by=l.approved_by,
            approved_at=l.approved_at,
            auto_generated_absence_events=l.auto_generated_absence_events,
            created_at=l.created_at,
            updated_at=l.updated_at
        )

@router.post('', response_model=LeaveOut)
async def create_leave(body: LeaveCreate, session: AsyncSession = Depends(get_session), user=Depends(require('leaves:create'))):
    if body.end_date < body.start_date:
        raise HTTPException(400, 'end_date before start_date')
    leave = LeaveRequest(
        student_id=body.student_id,
        start_date=body.start_date,
        end_date=body.end_date,
        type=body.type or LeaveType.other.value,
        reason=body.reason,
        requested_by=body.requested_by
    )
    session.add(leave)
    await session.commit()
    await session.refresh(leave)
    return LeaveOut.from_model(leave)

@router.get('', response_model=List[LeaveOut])
async def list_leaves(session: AsyncSession = Depends(get_session), user=Depends(require('leaves:list'))):
    result = await session.execute(select(LeaveRequest).order_by(LeaveRequest.created_at.desc()).limit(200))
    return [LeaveOut.from_model(l) for l in result.scalars().all()]

@router.get('/{leave_id}', response_model=LeaveOut)
async def get_leave(leave_id: str, session: AsyncSession = Depends(get_session), user=Depends(require('leaves:view'))):
    result = await session.execute(select(LeaveRequest).where(LeaveRequest.id==leave_id))
    l = result.scalar_one_or_none()
    if not l:
        raise HTTPException(404, 'Not found')
    return LeaveOut.from_model(l)

class LeaveApproveRequest(BaseModel):
    approved_by: str

@router.post('/{leave_id}/approve', response_model=LeaveOut)
async def approve_leave(leave_id: str, body: LeaveApproveRequest, session: AsyncSession = Depends(get_session), user=Depends(require('leaves:approve'))):
    result = await session.execute(select(LeaveRequest).where(LeaveRequest.id==leave_id))
    l = result.scalar_one_or_none()
    if not l:
        raise HTTPException(404, 'Not found')
    if l.status != LeaveStatus.pending.value:
        raise HTTPException(400, 'Not pending')
    l.status = LeaveStatus.approved.value
    l.approved_by = body.approved_by
    l.approved_at = datetime.utcnow()
    # generate attendance_events absent records
    d = l.start_date
    events = 0
    while d <= l.end_date:
        session.add(AttendanceEvent(student_id=l.student_id, date=d, present=0))
        d += timedelta(days=1)
        events += 1
    l.auto_generated_absence_events = True
    await session.commit()
    await session.refresh(l)
    return LeaveOut.from_model(l)

class LeaveRejectRequest(BaseModel):
    rejected_by: str

@router.post('/{leave_id}/reject', response_model=LeaveOut)
async def reject_leave(leave_id: str, body: LeaveRejectRequest, session: AsyncSession = Depends(get_session), user=Depends(require('leaves:reject'))):
    result = await session.execute(select(LeaveRequest).where(LeaveRequest.id==leave_id))
    l = result.scalar_one_or_none()
    if not l:
        raise HTTPException(404, 'Not found')
    if l.status != LeaveStatus.pending.value:
        raise HTTPException(400, 'Not pending')
    l.status = LeaveStatus.rejected.value
    l.approved_by = body.rejected_by
    await session.commit()
    await session.refresh(l)
    return LeaveOut.from_model(l)

@router.post('/{leave_id}/cancel', response_model=LeaveOut)
async def cancel_leave(leave_id: str, session: AsyncSession = Depends(get_session), user=Depends(require('leaves:cancel'))):
    result = await session.execute(select(LeaveRequest).where(LeaveRequest.id==leave_id))
    l = result.scalar_one_or_none()
    if not l:
        raise HTTPException(404, 'Not found')
    if l.status not in [LeaveStatus.pending.value, LeaveStatus.approved.value]:
        raise HTTPException(400, 'Cannot cancel in this status')
    l.status = LeaveStatus.cancelled.value
    await session.commit()
    await session.refresh(l)
    return LeaveOut.from_model(l)
