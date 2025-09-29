from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_session
from app.core.tenant import get_tenant_context, TenantContext
from . import models, schemas

router = APIRouter(prefix='/files', tags=['files'])

@router.post('/blobs', response_model=schemas.FileBlobOut)
async def register_blob(payload: schemas.FileBlobRegister, session: AsyncSession = Depends(get_session), tenant: TenantContext = Depends(get_tenant_context)):
    blob = models.FileBlob(
        school_id=tenant.school_id,
        storage_url=payload.storage_url,
        mime_type=payload.mime_type,
        bytes=payload.bytes,
        checksum=payload.checksum,
        is_public=payload.is_public,
    )
    session.add(blob)
    await session.commit()
    await session.refresh(blob)
    return blob

@router.get('/blobs/{blob_id}', response_model=schemas.FileBlobOut)
async def get_blob(blob_id: int, session: AsyncSession = Depends(get_session), tenant: TenantContext = Depends(get_tenant_context)):
    rec = await session.get(models.FileBlob, blob_id)
    if not rec:
        raise HTTPException(404, 'Not found')
    return rec

@router.post('/attachments', response_model=schemas.AttachmentOut)
async def create_attachment(payload: schemas.AttachmentCreate, session: AsyncSession = Depends(get_session), tenant: TenantContext = Depends(get_tenant_context)):
    # simple existence check
    blob = await session.get(models.FileBlob, payload.blob_id)
    if not blob:
        raise HTTPException(400, 'Blob not found')
    att = models.Attachment(
        blob_id=payload.blob_id,
        entity=payload.entity,
        entity_id=payload.entity_id,
        note=payload.note
    )
    session.add(att)
    await session.commit()
    await session.refresh(att)
    return att

@router.get('/attachments/{attachment_id}', response_model=schemas.AttachmentOut)
async def get_attachment(attachment_id: int, session: AsyncSession = Depends(get_session), tenant: TenantContext = Depends(get_tenant_context)):
    rec = await session.get(models.Attachment, attachment_id)
    if not rec:
        raise HTTPException(404, 'Not found')
    return rec

# Placeholder for presigned URL (implementation depends on chosen storage backend)
@router.get('/blobs/{blob_id}/presign')
async def presign(blob_id: int, session: AsyncSession = Depends(get_session)):
    rec = await session.get(models.FileBlob, blob_id)
    if not rec:
        raise HTTPException(404, 'Not found')
    # TODO: integrate with storage driver (s3/minio)
    return {"upload_url": f"https://upload.local/placeholder/{blob_id}", "fields": {}}
