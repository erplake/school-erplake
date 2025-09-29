from __future__ import annotations
import base64
import os
from typing import Optional

try:
    from cryptography.fernet import Fernet  # type: ignore
except Exception:  # pragma: no cover
    Fernet = None  # type: ignore

_cached: Optional[Fernet] = None

def _get_cipher() -> Optional[Fernet]:
    global _cached
    if _cached is not None:
        return _cached
    key = os.getenv('APP_CREDENTIALS_KEY')
    if not key or not Fernet:
        return None
    # Accept raw 32-byte base64 or plain text passphrase (derive)
    if len(key) == 44 and key.endswith('='):
        k = key.encode()
    else:
        # Derive a Fernet key from passphrase (not KDF-strong; TODO: PBKDF2/Argon2)
        k = base64.urlsafe_b64encode(key.encode('utf-8').ljust(32, b'0')[:32])
    try:
        _cached = Fernet(k)
    except Exception:
        return None
    return _cached

def encrypt_dict(d: dict) -> str:
    c = _get_cipher()
    raw = base64.b64encode(repr(d).encode('utf-8')).decode('utf-8')
    if not c:
        return 'PLAINTEXT:' + raw
    token = c.encrypt(raw.encode('utf-8'))
    return 'ENC:' + token.decode('utf-8')

def decrypt_dict(s: str) -> dict:
    if s.startswith('PLAINTEXT:'):
        b64 = s[len('PLAINTEXT:'):]
        try:
            return eval(base64.b64decode(b64.encode('utf-8')).decode('utf-8'))
        except Exception:
            return {}
    if s.startswith('ENC:'):
        c = _get_cipher()
        if not c:
            return {}
        token = s[len('ENC:'):].encode('utf-8')
        try:
            raw = c.decrypt(token).decode('utf-8')
            return eval(base64.b64decode(raw).decode('utf-8')) if raw.startswith('UEs') else eval(raw)
        except Exception:
            return {}
    return {}