from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.core.dependencies import get_db, get_current_user
from . import models, schemas

router = APIRouter(prefix="/social", tags=["social"])

@router.get("/posts", response_model=list[schemas.SocialPostOut])
async def list_posts(db: AsyncSession = Depends(get_db), user=Depends(get_current_user), platform: Optional[str] = None, status_filter: Optional[str] = None, scheduled_after: Optional[datetime] = None, limit: int = 100):
    q = select(models.SocialPost).order_by(models.SocialPost.created_at.desc()).limit(limit)
    if platform:
        q = q.where(models.SocialPost.platform == platform)
    if status_filter:
        q = q.where(models.SocialPost.status == status_filter)
    if scheduled_after:
        q = q.where(models.SocialPost.scheduled_for != None).where(models.SocialPost.scheduled_for >= scheduled_after)  # noqa: E711
    res = (await db.execute(q)).scalars().all()
    return res

@router.post("/posts", response_model=schemas.SocialPostOut, status_code=status.HTTP_201_CREATED)
async def create_post(payload: schemas.SocialPostCreate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ("staff", "admin", "moderator", "marketing"):
        raise HTTPException(status_code=403, detail="Not allowed")
    post = models.SocialPost(platform=payload.platform, title=payload.title, body=payload.body, media_url=payload.media_url, scheduled_for=payload.scheduled_for, created_by=user.id)
    db.add(post)
    await db.flush()
    await db.refresh(post)
    return post

@router.get("/search/posts", response_model=list[schemas.SocialPostSearchResult])
async def search_posts(q: str, platform: Optional[str] = None, limit: int = 50, lang: str = "english", db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    if not q or not q.strip():
        raise HTTPException(status_code=400, detail="Empty query")
    if len(q) > 120:
        raise HTTPException(status_code=400, detail="Query too long")
    lang = lang.lower()
    if lang not in {"english","simple"}:
        raise HTTPException(status_code=400, detail="Unsupported language")
    sql = f"""
        select p.id, p.platform, p.title,
               ts_headline(:lang, p.body, websearch_to_tsquery(:lang, :q)) as snippet,
               ts_rank_cd(to_tsvector(:lang, coalesce(p.body,'')), websearch_to_tsquery(:lang, :q)) as rank,
               p.created_at
        from social_posts p
        where to_tsvector(:lang, coalesce(p.body,'')) @@ websearch_to_tsquery(:lang, :q)
    """
    params = {"q": q, "limit": limit, "lang": lang}
    if platform:
        sql += " and p.platform = :platform"
        params["platform"] = platform
    sql += " order by rank desc, p.created_at desc limit :limit"
    res = await db.execute(text(sql), params)
    return [schemas.SocialPostSearchResult(**dict(r._mapping)) for r in res]

@router.patch("/posts/{post_id}", response_model=schemas.SocialPostOut)
async def update_post(post_id: UUID, payload: schemas.SocialPostUpdate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    q = select(models.SocialPost).where(models.SocialPost.id == post_id)
    post = (await db.execute(q)).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if user.role not in ("staff", "admin", "moderator", "marketing"):
        raise HTTPException(status_code=403, detail="Not allowed")
    data = payload.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(post, k, v)
    await db.flush()
    await db.refresh(post)
    return post

@router.post("/posts/{post_id}/publish", response_model=schemas.SocialPostOut)
async def publish_post(post_id: UUID, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    q = select(models.SocialPost).where(models.SocialPost.id == post_id)
    post = (await db.execute(q)).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if user.role not in ("staff", "admin", "moderator", "marketing"):
        raise HTTPException(status_code=403, detail="Not allowed")
    if post.status not in (models.SocialPostStatus.draft, models.SocialPostStatus.scheduled):
        raise HTTPException(status_code=400, detail="Not publishable in current state")
    post.status = models.SocialPostStatus.published
    post.published_at = datetime.utcnow()
    await db.flush()
    await db.refresh(post)
    return post
