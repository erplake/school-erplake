from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from app.core.db import get_session
from app.core.security import get_current_user, require
from app.modules.gallery import models, schemas
from app.core.tenant import audit

router = APIRouter(prefix="/gallery", tags=["gallery"])

@router.get("/class/{class_section_id}", response_model=schemas.GalleryImageList, dependencies=[Depends(require('gallery:image_list'))])
async def list_class_gallery(class_section_id: int, session: AsyncSession = Depends(get_session), limit: int = Query(50, le=200), offset: int = 0):
    q = select(models.ClassGalleryImage).where(models.ClassGalleryImage.class_section_id==class_section_id, models.ClassGalleryImage.is_deleted==False).order_by(models.ClassGalleryImage.created_at.desc()).limit(limit).offset(offset)
    res = (await session.execute(q)).scalars().all()
    total_q = select(func.count()).select_from(models.ClassGalleryImage).where(models.ClassGalleryImage.class_section_id==class_section_id, models.ClassGalleryImage.is_deleted==False)
    total = (await session.execute(total_q)).scalar_one()
    return schemas.GalleryImageList(items=res, total=total)

@router.post("/upload", response_model=schemas.GalleryUploadResponse, dependencies=[Depends(require('gallery:image_upload'))])
@audit("gallery_image_upload")
async def upload_to_gallery(payload: schemas.GalleryUploadRequest, session: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    img = models.ClassGalleryImage(
        class_section_id=payload.class_section_id,
        blob_id=payload.blob_id,
        uploader_id=getattr(current_user, 'id', None),
        original_filename=payload.original_filename,
        mime_type=payload.mime_type,
        size_bytes=payload.size_bytes,
        content_hash=payload.content_hash,
    )
    session.add(img)
    await session.flush()
    await session.commit()
    await session.refresh(img)
    return img

@router.delete("/{image_id}", dependencies=[Depends(require('gallery:image_delete'))])
@audit("gallery_image_delete")
async def delete_gallery_image(image_id: int, session: AsyncSession = Depends(get_session)):
    q = select(models.ClassGalleryImage).where(models.ClassGalleryImage.id==image_id, models.ClassGalleryImage.is_deleted==False)
    obj = (await session.execute(q)).scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Image not found")
    await session.execute(update(models.ClassGalleryImage).where(models.ClassGalleryImage.id==image_id).values(is_deleted=True))
    await session.commit()
    return {"status": "deleted"}
