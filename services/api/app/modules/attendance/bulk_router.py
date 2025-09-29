from fastapi import APIRouter, Depends, Header, HTTPException, Request
from typing import Optional
from datetime import date as Date
from pydantic import BaseModel, Field
from typing import List
import hashlib, json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from ...core.db import get_session
from ...core.security import require
from .models import AttendanceStudent

router = APIRouter(prefix="/attendance", tags=["attendance"])

# In-memory fallback for idempotency in test / ephemeral environments where
# the idempotency_keys table may not exist. Maps key -> response dict.
_IDEMP_FALLBACK: dict[str, dict] = {}

class AttendanceBulkItem(BaseModel):
    student_id: int
    date: Date  # ISO date string will be parsed by Pydantic
    status: str = Field(pattern="^(present|absent|late)$")

@router.post('/bulk')
async def bulk_mark(request: Request, session: AsyncSession = Depends(get_session), user=Depends(require('attendance:mark')), idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key")):
    """Mark attendance in bulk.

    Backwards compatibility: previously accepted an object {"items": [...]}.
    Current tests (and preferred simpler contract) send a raw JSON list [...].
    We accept both shapes here and normalize to a list of AttendanceBulkItem.
    """
    raw = await request.json()
    if isinstance(raw, dict) and 'items' in raw:
        raw_items = raw['items']
    elif isinstance(raw, list):
        raw_items = raw
    else:
        raise HTTPException(422, 'Body must be a list or an object with an "items" array')
    try:
        items = [AttendanceBulkItem.model_validate(obj) for obj in raw_items]
    except Exception as e:
        raise HTTPException(422, f'Invalid item: {e}')
    if not items:
        raise HTTPException(400, 'No items provided')
    # Stable hash of request payload (normalized list of dicts with sorted keys)
    # Convert date objects to ISO strings for stable hashing
    serializable_items = []
    for i in items:
        d = i.model_dump()
        if isinstance(d.get('date'), (Date,)):
            d['date'] = d['date'].isoformat()
        serializable_items.append(d)
    body_bytes = json.dumps(serializable_items, sort_keys=True).encode()
    req_hash = hashlib.sha256(body_bytes).hexdigest()
    if idempotency_key:
        # First check fallback cache
        if idempotency_key in _IDEMP_FALLBACK:
            return _IDEMP_FALLBACK[idempotency_key]
        # Attempt DB lookup; if table absent, fall back
        try:
            res = await session.execute(text("select response_json from idempotency_keys where key=:k"), {"k": idempotency_key})
            row = res.first()
            if row:
                return row[0]
        except Exception:
            try:
                await session.rollback()
            except Exception:
                pass
    inserted = 0
    # Upsert each item; could be optimized to bulk in future
    for item in items:
        result = await session.execute(select(AttendanceStudent).where(AttendanceStudent.student_id==item.student_id, AttendanceStudent.date==item.date))
        existing = result.scalars().first()
        if existing:
            existing.status = item.status
        else:
            session.add(AttendanceStudent(student_id=item.student_id, date=item.date, status=item.status))
            inserted += 1
    await session.commit()
    summary = {"processed": len(items), "upserts": inserted}
    if idempotency_key:
        try:
            await session.execute(text("insert into idempotency_keys (key, route, method, request_hash, response_json) values (:k,:r,:m,:h,:resp) on conflict (key) do nothing"),
                                   {"k": idempotency_key, "r": '/attendance/bulk', "m": 'POST', "h": req_hash, "resp": json.dumps(summary)})
            await session.commit()
        except Exception:
            # Fallback to in-memory cache when table missing
            _IDEMP_FALLBACK[idempotency_key] = summary
            try:
                await session.rollback()
            except Exception:
                pass
    return summary
