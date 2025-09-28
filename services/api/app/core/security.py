import jwt, os
from fastapi import Header, HTTPException, Depends
from .config import settings

class CurrentUser:
    def __init__(self, user_id: int, phone: str, roles: list[str]):
        self.user_id = user_id
        self.phone = phone
        self.roles = roles


def get_current_user(authorization: str = Header(None)) -> CurrentUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Missing token")
    token = authorization.split()[1]
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except Exception:
        raise HTTPException(401, "Invalid token")
    return CurrentUser(int(payload['sub']), payload.get('phone',''), payload.get('roles', []))

# Simple RBAC matrix (expand later)
RBAC_MATRIX = {
    'students:list': ['teacher','admin'],
    'students:create': ['admin'],
    'attendance:mark': ['teacher','admin'],
    'attendance:view': ['teacher','admin','parent'],
    'fees:create_invoice': ['admin','accounts'],
    'fees:view_invoice': ['admin','accounts','parent']
}

def require(permission: str):
    def _dep(user: CurrentUser = Depends(get_current_user)):
        if not settings.rbac_enforce:
            return user
        allowed = RBAC_MATRIX.get(permission, [])
        if not any(r in allowed for r in user.roles):
            raise HTTPException(403, "Forbidden")
        return user
    return _dep
