from fastapi import APIRouter, Depends, Header, HTTPException
from typing import Optional
from pydantic import BaseModel, Field
from typing import List
import hashlib, json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from ...core.db import get_session
from ...core.security import require
from .models import AttendanceStudent

router = APIRouter(prefix="/attendance", tags=["attendance"])

class AttendanceBulkItem(BaseModel):
    student_id: int
    date: str
    status: str = Field(pattern="^(present|absent|late)$")

class AttendanceBulkIn(BaseModel):
    items: List[AttendanceBulkItem]

@router.post('/bulk')
async def bulk_mark(payload: AttendanceBulkIn, session: AsyncSession = Depends(get_session), user=Depends(require('attendance:mark')), idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key")):
    if not payload.items:
        raise HTTPException(400, 'No items provided')
    body_bytes = json.dumps(payload.model_dump(), sort_keys=True).encode()
    req_hash = hashlib.sha256(body_bytes).hexdigest()
    if idempotency_key:
        res = await session.execute(text("select response_json from idempotency_keys where key=:k"), {"k": idempotency_key})
        row = res.first()
        if row:
            return row[0]
    inserted = 0
    # Upsert each item; could be optimized to bulk in future
    for item in payload.items:
        result = await session.execute(select(AttendanceStudent).where(AttendanceStudent.student_id==item.student_id, AttendanceStudent.date==item.date))
        existing = result.scalars().first()
        if existing:
            existing.status = item.status
        else:
            session.add(AttendanceStudent(student_id=item.student_id, date=item.date, status=item.status))
            inserted += 1
    await session.commit()
    summary = {"processed": len(payload.items), "upserts": inserted}
    if idempotency_key:
        await session.execute(text("insert into idempotency_keys (key, route, method, request_hash, response_json) values (:k,:r,:m,:h,:resp) on conflict (key) do nothing"),
                               {"k": idempotency_key, "r": '/attendance/bulk', "m": 'POST', "h": req_hash, "resp": json.dumps(summary)})
        await session.commit()
    return summary
