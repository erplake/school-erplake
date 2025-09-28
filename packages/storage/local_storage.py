import os
import aiofiles
from pathlib import Path
from .base import Storage

class LocalStorage(Storage):
    """Simple local filesystem storage for development.

    Base path configured via LOCAL_STORAGE_PATH env or constructor.
    Paths are sandboxed within the base directory to avoid directory traversal.
    """

    def __init__(self, base_path: str | None = None):
        root = base_path or os.getenv("LOCAL_STORAGE_PATH", "var/storage")
        self.base = Path(root).resolve()
        self.base.mkdir(parents=True, exist_ok=True)

    def _full_path(self, rel: str) -> Path:
        rel_path = Path(rel)
        full = (self.base / rel_path).resolve()
        if not str(full).startswith(str(self.base)):
            raise ValueError("Attempted path escape outside base storage directory")
        full.parent.mkdir(parents=True, exist_ok=True)
        return full

    async def put(self, path: str, data: bytes, content_type: str) -> str:  # content_type unused for now
        full = self._full_path(path)
        async with aiofiles.open(full, "wb") as f:
            await f.write(data)
        return f"local://{path}"

    async def get(self, path: str) -> bytes:
        full = self._full_path(path)
        async with aiofiles.open(full, "rb") as f:
            return await f.read()

    def signed_url(self, path: str, expires: int = 3600) -> str:
        # For local dev just return a pseudo path; a future static serving endpoint could map this.
        return f"/dev-storage/{path}"
