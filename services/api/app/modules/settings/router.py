from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.dependencies import get_db, get_current_user
from . import models, schemas, integration_models
from sqlalchemy import select, update

router = APIRouter(prefix='/settings', tags=['settings'])

@router.get('/brand', response_model=schemas.BrandSettingsOut)
async def get_brand(db: AsyncSession = Depends(get_db)):
    rec = (await db.execute(select(models.BrandSettings))).scalars().first()
    if not rec:
        rec = models.BrandSettings()
        db.add(rec)
        await db.flush()
        await db.refresh(rec)
    return rec

@router.patch('/brand', response_model=schemas.BrandSettingsOut)
async def update_brand(payload: schemas.BrandSettingsUpdate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ('admin','staff','moderator'):
        raise HTTPException(status_code=403, detail='Not allowed')
    rec = (await db.execute(select(models.BrandSettings))).scalars().first()
    if not rec:
        rec = models.BrandSettings()
        db.add(rec)
        await db.flush()
        await db.refresh(rec)
    data = payload.dict(exclude_unset=True)
    for k,v in data.items():
        setattr(rec, k, v)
    rec.updated_by = str(user.id)
    await db.flush()
    await db.refresh(rec)
    return rec

@router.get('/integrations', response_model=list[schemas.IntegrationSettingsOut])
async def list_integrations(db: AsyncSession = Depends(get_db)):
    res = (await db.execute(select(integration_models.IntegrationSettings))).scalars().all()
    return res

@router.patch('/integrations', response_model=schemas.IntegrationSettingsOut)
async def upsert_integration(payload: schemas.IntegrationSettingsUpdate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ('admin','staff','moderator'):
        raise HTTPException(status_code=403, detail='Not allowed')
    provider = payload.provider.value
    rec = (await db.execute(select(integration_models.IntegrationSettings).where(integration_models.IntegrationSettings.provider==provider))).scalars().first()
    if not rec:
        rec = integration_models.IntegrationSettings(provider=provider)
        db.add(rec)
        await db.flush()
        await db.refresh(rec)
    data = payload.dict(exclude_unset=True)
    data.pop('provider', None)
    for k,v in data.items():
        setattr(rec, k, v)
    rec.updated_by = str(user.id)
    await db.flush()
    await db.refresh(rec)
    return rec
