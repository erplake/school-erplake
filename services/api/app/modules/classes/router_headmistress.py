from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from .models import HeadMistress
from ...core.db import get_session
from ...core.security import require

router = APIRouter(prefix="/head-mistresses", tags=["head-mistress"])

class HeadMistressCreate(BaseModel):
    name: str
    active: Optional[bool] = True

class HeadMistressUpdate(BaseModel):
    name: Optional[str] = None
    active: Optional[bool] = None

class HeadMistressOut(BaseModel):
    id: int
    name: str
    active: bool
    class Config:
        orm_mode = True

@router.get("", response_model=List[HeadMistressOut])
async def list_head_mistresses(session: AsyncSession = Depends(get_session), user=Depends(require('wings:list'))):
    rows = (await session.execute(select(HeadMistress).order_by(HeadMistress.active.desc(), HeadMistress.name.asc()))).scalars().all()
    return rows

@router.post("", response_model=HeadMistressOut)
async def create_head_mistress(body: HeadMistressCreate, session: AsyncSession = Depends(get_session), user=Depends(require('wings:edit'))):
    obj = HeadMistress(name=body.name, active=body.active if body.active is not None else True)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return obj

@router.patch("/{hm_id}", response_model=HeadMistressOut)
async def update_head_mistress(hm_id: int, body: HeadMistressUpdate, session: AsyncSession = Depends(get_session), user=Depends(require('wings:edit'))):
    obj = (await session.execute(select(HeadMistress).where(HeadMistress.id==hm_id))).scalar_one_or_none()
    if not obj:
        raise HTTPException(404, 'Head mistress not found')
    if body.name is not None:
        obj.name = body.name
    if body.active is not None:
        obj.active = body.active
    await session.commit()
    await session.refresh(obj)
    return obj

@router.delete("/{hm_id}")
async def delete_head_mistress(hm_id: int, session: AsyncSession = Depends(get_session), user=Depends(require('wings:edit'))):
    obj = (await session.execute(select(HeadMistress).where(HeadMistress.id==hm_id))).scalar_one_or_none()
    if not obj:
        raise HTTPException(404, 'Head mistress not found')
    await session.delete(obj)
    await session.commit()
    return {"status":"deleted"}
