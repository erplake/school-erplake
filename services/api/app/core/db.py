from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from .config import settings

# Convert sync DSN to asyncpg variant if needed
def _to_async_dsn(dsn: str) -> str:
    if dsn.startswith("postgresql+asyncpg"):
        return dsn
    if dsn.startswith("postgresql://"):
        return dsn.replace("postgresql://", "postgresql+asyncpg://", 1)
    return "postgresql+asyncpg://" + dsn

def _current_async_dsn() -> str:
    return _to_async_dsn(settings.postgres_dsn)

# Engine created once; for test reconfiguration, user must ensure env vars set before first import
engine = create_async_engine(_current_async_dsn(), echo=False, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
async_session = SessionLocal  # backward compatible alias

class Base(DeclarativeBase):
    pass

async def get_session() -> AsyncSession:
    async with SessionLocal() as session:
        yield session
