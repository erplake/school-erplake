import os, time, secrets
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import redis
import jwt
from sqlalchemy import select, insert
from sqlalchemy.ext.asyncio import AsyncSession
from ...core.db import get_session, Base
from ...core.config import settings
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, DateTime
from datetime import datetime
from typing import Optional

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
_r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

OTP_TTL = 300
ACCESS_TTL = 900
REFRESH_TTL = 60 * 60 * 24 * 15  # 15 days

router = APIRouter(prefix="/auth", tags=["auth"])

class OTPStart(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    code: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: Optional[str] = None

@router.post("/otp")
async def start_otp(body: OTPStart):
    code = os.getenv("DEV_OTP", "123456") if settings.env == 'dev' else f"{secrets.randbelow(1000000):06d}"
    _r.set(f"otp:{body.phone}", code, ex=OTP_TTL)
    # TODO: integrate real SMS/WhatsApp send
    return {"sent": True, "mask": body.phone[-4:], "dev_code": code if settings.env=='dev' else None}

class User(Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    phone: Mapped[str] = mapped_column(String, unique=True)
    email: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

def _issue_tokens(user_id: int, phone: str):
    now = int(time.time())
    payload = {"sub": str(user_id), "phone": phone, "iat": now, "exp": now + ACCESS_TTL, "roles": ["teacher"]}
    access = jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
    refresh_raw = secrets.token_urlsafe(48)
    refresh_hash = hashlib.sha256(refresh_raw.encode()).hexdigest()
    exp_ts = now + REFRESH_TTL
    return access, refresh_raw, refresh_hash, exp_ts

import hashlib
from sqlalchemy import text

@router.post("/verify", response_model=TokenOut)
async def verify(body: OTPVerify, session: AsyncSession = Depends(get_session)):
    cached = _r.get(f"otp:{body.phone}")
    if not cached or cached != body.code:
        raise HTTPException(401, "Invalid or expired code")
    # Upsert user via get-or-create
    result = await session.execute(select(User).where(User.phone==body.phone))
    user = result.scalars().first()
    if not user:
        user = User(phone=body.phone)
        session.add(user)
        await session.commit()
        await session.refresh(user)
    access, refresh_plain, refresh_hash, exp_ts = _issue_tokens(user.id, body.phone)
    await session.execute(text("""insert into refresh_tokens (user_id, token_hash, expires_at) values (:uid,:th,to_timestamp(:exp))"""),
                          {"uid": user.id, "th": refresh_hash, "exp": exp_ts})
    await session.commit()
    return TokenOut(access_token=access, expires_in=ACCESS_TTL, refresh_token=refresh_plain)

class RefreshIn(BaseModel):
    refresh_token: str

@router.post('/refresh', response_model=TokenOut)
async def refresh(body: RefreshIn, session: AsyncSession = Depends(get_session)):
    now = int(time.time())
    refresh_hash = hashlib.sha256(body.refresh_token.encode()).hexdigest()
    res = await session.execute(text("""select user_id, extract(epoch from expires_at) as exp, revoked_at from refresh_tokens where token_hash=:th"""), {"th": refresh_hash})
    row = res.first()
    if not row:
        raise HTTPException(401, "Invalid refresh token")
    user_id, exp, revoked = row
    if revoked or exp < now:
        raise HTTPException(401, "Expired or revoked")
    # rotate: revoke old, insert new
    await session.execute(text("update refresh_tokens set revoked_at=now() where token_hash=:th"), {"th": refresh_hash})
    # fetch phone
    res2 = await session.execute(select(User).where(User.id==user_id))
    user = res2.scalars().first()
    if not user:
        raise HTTPException(404, "User not found")
    access, new_refresh_plain, new_refresh_hash, exp_ts = _issue_tokens(user.id, user.phone)
    await session.execute(text("insert into refresh_tokens (user_id, token_hash, expires_at) values (:uid,:th,to_timestamp(:exp))"), {"uid": user.id, "th": new_refresh_hash, "exp": exp_ts})
    await session.commit()
    return TokenOut(access_token=access, expires_in=ACCESS_TTL, refresh_token=new_refresh_plain)
