from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.core.dependencies import get_db, get_current_user
from . import models, schemas

router = APIRouter(prefix="/events", tags=["events"])

@router.get("/", response_model=list[schemas.EventOut])
async def list_events(
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
    visibility: Optional[str] = None,
    status_filter: Optional[str] = None,
    after: Optional[datetime] = None,
    before: Optional[datetime] = None,
    limit: int = 100,
):
    q = select(models.Event).order_by(models.Event.starts_at.asc()).limit(limit)
    if visibility:
        q = q.where(models.Event.visibility == visibility)
    if status_filter:
        q = q.where(models.Event.status == status_filter)
    if after:
        q = q.where(models.Event.starts_at >= after)
    if before:
        q = q.where(models.Event.starts_at <= before)
    res = (await db.execute(q)).scalars().unique().all()
    return res

@router.post("/", response_model=schemas.EventOut, status_code=status.HTTP_201_CREATED)
async def create_event(payload: schemas.EventCreate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ("staff", "admin", "moderator"):
        raise HTTPException(status_code=403, detail="Not allowed")
    if payload.ends_at <= payload.starts_at:
        raise HTTPException(status_code=400, detail="ends_at must be after starts_at")
    ev = models.Event(title=payload.title, description=payload.description, starts_at=payload.starts_at, ends_at=payload.ends_at, location=payload.location, visibility=payload.visibility, created_by=user.id)
    db.add(ev)
    await db.flush()
    await db.refresh(ev)
    return ev

@router.patch("/{event_id}", response_model=schemas.EventOut)
async def update_event(event_id: UUID, payload: schemas.EventUpdate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    q = select(models.Event).where(models.Event.id == event_id)
    ev = (await db.execute(q)).scalar_one_or_none()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    if user.role not in ("staff", "admin", "moderator"):
        raise HTTPException(status_code=403, detail="Not allowed")
    data = payload.dict(exclude_unset=True)
    if 'starts_at' in data or 'ends_at' in data:
        starts_at = data.get('starts_at', ev.starts_at)
        ends_at = data.get('ends_at', ev.ends_at)
        if ends_at <= starts_at:
            raise HTTPException(status_code=400, detail="ends_at must be after starts_at")
    for k, v in data.items():
        setattr(ev, k, v)
    await db.flush()
    await db.refresh(ev)
    return ev

@router.post("/{event_id}/participants/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def add_participant(event_id: UUID, user_id: int, role: models.EventParticipantRole = models.EventParticipantRole.attendee, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ("staff", "admin", "moderator"):
        raise HTTPException(status_code=403, detail="Not allowed")
    ev = (await db.execute(select(models.Event).where(models.Event.id == event_id))).scalar_one_or_none()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    existing = (await db.execute(select(models.EventParticipant).where(models.EventParticipant.event_id == event_id, models.EventParticipant.user_id == user_id))).first()
    if existing:
        return
    db.add(models.EventParticipant(event_id=event_id, user_id=user_id, role=role))
    await db.flush()

@router.delete("/{event_id}/participants/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_participant(event_id: UUID, user_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ("staff", "admin", "moderator"):
        raise HTTPException(status_code=403, detail="Not allowed")
    await db.execute(models.EventParticipant.__table__.delete().where(models.EventParticipant.event_id == event_id, models.EventParticipant.user_id == user_id))
    return
