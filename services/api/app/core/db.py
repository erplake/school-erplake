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

ASYNC_DSN = _to_async_dsn(settings.postgres_dsn)
engine = create_async_engine(ASYNC_DSN, echo=False, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
async_session = SessionLocal  # backward compatible alias

class Base(DeclarativeBase):
    pass

async def get_session() -> AsyncSession:
    async with SessionLocal() as session:
        yield session
