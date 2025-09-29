from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.dependencies import get_db, get_current_user
from . import models, schemas, integration_models, config_models
from app.core.tenant import get_tenant_context, TenantContext
from app.core.security import require
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

# --- New multi-schema config key/value store ---
@router.get('/config', response_model=list[schemas.ConfigEntryOut])
async def list_config(db: AsyncSession = Depends(get_db), user=Depends(require('settings:config_read')), tenant: TenantContext = Depends(get_tenant_context)):
    rows = (await db.execute(select(config_models.ConfigEntry).where(config_models.ConfigEntry.school_id==tenant.school_id))).scalars().all()
    return rows

@router.post('/config', response_model=schemas.ConfigEntryOut)
async def upsert_config(entry: schemas.ConfigEntryUpsert, db: AsyncSession = Depends(get_db), user=Depends(require('settings:config_write')), tenant: TenantContext = Depends(get_tenant_context)):
    existing = (await db.execute(select(config_models.ConfigEntry).where(
        config_models.ConfigEntry.school_id==tenant.school_id,
        config_models.ConfigEntry.key==entry.key
    ))).scalars().first()
    if not existing:
        existing = config_models.ConfigEntry(school_id=tenant.school_id, key=entry.key)
        db.add(existing)
    existing.value_json = entry.value_json
    existing.is_secret = bool(entry.is_secret)
    existing.updated_by = tenant.user_id
    await db.flush(); await db.refresh(existing)
    return existing

@router.get('/integration-credentials', response_model=list[schemas.IntegrationCredentialOut])
async def list_integration_credentials(db: AsyncSession = Depends(get_db), user=Depends(require('settings:credential_read')), tenant: TenantContext = Depends(get_tenant_context)):
    rows = (await db.execute(select(config_models.IntegrationCredential).where(config_models.IntegrationCredential.school_id==tenant.school_id))).scalars().all()
    out: list[schemas.IntegrationCredentialOut] = []
    for r in rows:
        out.append(schemas.IntegrationCredentialOut(
            id=r.id, provider=r.provider, label=r.label,
            credentials=config_models.IntegrationCredential.decode_credentials(r.credentials_enc),
            rotated_at=r.rotated_at, created_at=r.created_at
        ))
    return out

@router.post('/integration-credentials', response_model=schemas.IntegrationCredentialOut)
async def create_integration_credential(payload: schemas.IntegrationCredentialCreate, db: AsyncSession = Depends(get_db), user=Depends(require('settings:credential_write')), tenant: TenantContext = Depends(get_tenant_context)):
    enc = config_models.IntegrationCredential.encode_credentials(payload.credentials)
    obj = config_models.IntegrationCredential(school_id=tenant.school_id, provider=payload.provider, label=payload.label, credentials_enc=enc)
    db.add(obj)
    await db.flush(); await db.refresh(obj)
    return schemas.IntegrationCredentialOut(
        id=obj.id, provider=obj.provider, label=obj.label,
        credentials=payload.credentials, rotated_at=obj.rotated_at, created_at=obj.created_at
    )
