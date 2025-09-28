from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import async_session

# Minimal user model placeholder to satisfy attribute access in routers during seeding or tests
class SimpleUser:
    def __init__(self, id: int = 1, role: str = "staff"):
        self.id = id
        self.role = role

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session

# In real app, this would decode JWT; placeholder returns staff user id=1
async def get_current_user() -> SimpleUser:  # type: ignore
    return SimpleUser()
