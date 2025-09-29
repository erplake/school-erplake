from dataclasses import dataclass
from fastapi import Depends
from .security import CurrentUser
from .dependencies import get_current_user
from sqlalchemy import Column, BigInteger, DateTime, Text, JSON
from .db import Base
from datetime import datetime
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession
from .db import get_session
from functools import wraps


class AuditLog(Base):
    __tablename__ = 'audit_log'
    __table_args__ = {'schema': 'core'}
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    user_id = Column(BigInteger)
    school_id = Column(BigInteger)
    action = Column(Text, nullable=False)
    object_type = Column(Text, nullable=True)
    object_id = Column(Text, nullable=True)
    verb = Column(Text, nullable=True)
    before = Column(JSON, nullable=True)
    after = Column(JSON, nullable=True)
    request_id = Column(Text, nullable=True)
    ip = Column(Text, nullable=True)
    user_agent = Column(Text, nullable=True)

@dataclass
class TenantContext:
    school_id: int
    user_id: int
    roles: list[str]


async def get_tenant_context(user: CurrentUser = Depends(get_current_user)) -> TenantContext:
    user_id = getattr(user, 'user_id', getattr(user, 'id', 0))
    roles = getattr(user, 'roles', []) or []
    # Single-school deployment assumption
    return TenantContext(school_id=1, user_id=int(user_id or 0), roles=list(roles))

from typing import Optional

def audit(action: str, object_type: Optional[str] = None, verb: Optional[str] = None):
    """Decorator for FastAPI route functions (async) to persist an audit row after successful execution.

    Usage:
        @router.post('/foo')
        @audit('create_foo', object_type='foo', verb='CREATE')
        async def create_foo(...): ...
    """
    def _outer(fn):
        @wraps(fn)
        async def _inner(*args, request: Request, session: AsyncSession = Depends(get_session), tenant: TenantContext = Depends(get_tenant_context), **kwargs):  # type: ignore
            before_snapshot = None  # Placeholder if we ever fetch existing
            result = await fn(*args, request=request, session=session, tenant=tenant, **kwargs)  # type: ignore
            try:
                log_entry = AuditLog(
                    user_id=tenant.user_id,
                    school_id=tenant.school_id,
                    action=action,
                    object_type=object_type,
                    object_id=None,
                    verb=verb,
                    before=before_snapshot,
                    after=None,
                    request_id=getattr(request.state, 'request_id', None),
                    ip=request.client.host if request.client else None,
                    user_agent=request.headers.get('user-agent')
                )
                session.add(log_entry)
                await session.commit()
            except Exception:  # pragma: no cover - logging failure not fatal
                try:
                    await session.rollback()
                except Exception:
                    pass
            return result
        return _inner
    return _outer