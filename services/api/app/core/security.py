import jwt, os, time
from fastapi import Header, HTTPException, Depends
from .config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from .db import get_session

# Simple in-process caches (non-distributed). For multi-instance deploy add Redis layer.
_perm_cache = {
    'loaded_at': 0,
    'role_perms': {},   # role -> set(permission_code)
}
_PERM_CACHE_TTL = 60  # seconds

class CurrentUser:
    def __init__(self, user_id: int, phone: str, roles: list[str]):
        self.user_id = user_id
        self.phone = phone
        self.roles = roles


def get_current_user(authorization: str = Header(None)) -> CurrentUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        # Allow anonymous test user when RBAC enforcement disabled
        if not settings.rbac_enforce:
            return CurrentUser(0, '', ['admin'])
        raise HTTPException(401, "Missing token")
    token = authorization.split()[1]
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except Exception:
        if not settings.rbac_enforce:
            return CurrentUser(0,'',['admin'])
        raise HTTPException(401, "Invalid token")
    return CurrentUser(int(payload.get('sub',0)), payload.get('phone',''), payload.get('roles', []))

async def _load_role_permissions(session: AsyncSession):
    """Refresh cache if stale. Populates role->permissions mapping from DB."""
    now = time.time()
    if now - _perm_cache['loaded_at'] < _PERM_CACHE_TTL and _perm_cache['role_perms']:
        return _perm_cache['role_perms']
    role_perms = {}
    # role_permission table (may not exist early in migration history)
    try:
        rows = (await session.execute(text("select role, permission_code from core.role_permission"))).all()
    except Exception:
        return _perm_cache['role_perms']  # silently keep old (or empty) on failure
    for role, perm in rows:
        role_perms.setdefault(role.lower(), set()).add(perm)
    _perm_cache['role_perms'] = role_perms
    _perm_cache['loaded_at'] = now
    return role_perms

async def _user_effective_permissions(user: CurrentUser, session: AsyncSession):
    role_perms = await _load_role_permissions(session)
    eff = set()
    for r in user.roles:
        eff |= role_perms.get(r.lower(), set())
    # apply per-user overrides if table exists
    try:
        rows = (await session.execute(text("select permission_code, mode from core.user_permission_override where user_id=:uid"), {'uid': user.user_id})).all()
        for code, mode in rows:
            if mode == 'GRANT':
                eff.add(code)
            elif mode == 'REVOKE' and code in eff:
                eff.remove(code)
    except Exception:
        pass
    return eff

def require(permission: str):
    async def _dep(user: CurrentUser = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
        if not settings.rbac_enforce:
            return user
        eff = await _user_effective_permissions(user, session)
        if permission not in eff:
            raise HTTPException(403, "Forbidden")
        return user
    return _dep
