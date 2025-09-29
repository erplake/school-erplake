import os
import asyncio

# Ensure test-specific env vars set before engine instantiation
os.environ.setdefault('ENV', 'test')
os.environ.setdefault('TEST_DATABASE_URL', os.getenv('TEST_DATABASE_URL', 'postgresql://erplake:erplake@localhost:5544/schooldb_test'))
import pytest
from httpx import AsyncClient, ASGITransport
import jwt
from app.core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession
import sqlalchemy as sa
from app.main import app
from app.core.db import engine as base_engine, async_session, Base, _current_async_dsn  # type: ignore
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import create_engine as create_sync_engine, text as sql_text
from urllib.parse import urlparse
import pytest
# Import all model modules so Base.metadata is complete before create_all
from app.modules.students import models as students_models  # noqa: F401
from app.modules.students import models_extra as students_models_extra  # noqa: F401
from app.modules.attendance import models as attendance_models  # noqa: F401
from app.modules.fees import models as fees_models  # noqa: F401
from app.modules.classes import models as classes_models  # noqa: F401
from app.modules.staff import models as staff_models  # noqa: F401
from app.modules.payments import models as payments_models  # noqa: F401
from app.modules.payments import models as payments_models_events  # noqa: F401


# Using pytest-asyncio's native event loop management (no custom event_loop fixture) so we can
# opt into session-level loop where needed via @pytest.mark.asyncio(loop_scope="session").

@pytest.fixture(scope="function")
async def setup_db():
    # Determine current and desired DSN
    desired_dsn = _current_async_dsn()
    global_engine = base_engine
    if str(global_engine.url) != desired_dsn:
        # Recreate engine pointing at desired test DSN
        test_engine = create_async_engine(desired_dsn, echo=False, pool_pre_ping=True)
    else:
        test_engine = global_engine
    url = str(test_engine.url)
    db_name = test_engine.url.database or ''
    # Ensure database exists (connect to default 'postgres' db for creation)
    if '_test' in db_name.lower() or 'test_' in db_name.lower():
        parsed = urlparse(desired_dsn.replace('+asyncpg',''))
        admin_db = 'postgres'
        admin_dsn = f"postgresql://{parsed.username}:{parsed.password}@{parsed.hostname}:{parsed.port}/{admin_db}"
        try:
            sync_engine = create_sync_engine(admin_dsn, isolation_level='AUTOCOMMIT')
            with sync_engine.connect() as conn:
                exists = conn.execute(sql_text("SELECT 1 FROM pg_database WHERE datname=:d"), {"d": db_name}).scalar()
                if not exists:
                    conn.execute(sql_text(f'CREATE DATABASE "{db_name}"'))
        except Exception:
            # Insufficient privilege; proceed assuming database already exists or test will fail early
            pass
        finally:
            try:
                sync_engine.dispose()
            except Exception:
                pass
    assert '_test' in db_name.lower() or 'test_' in db_name.lower(), (
        f"Refusing to run destructive schema reset on non-test database '{db_name}'. URL={url}"
    )
    try:
        async with test_engine.begin() as conn:
            await conn.execute(sa.text("DROP SCHEMA IF EXISTS public CASCADE"))
            await conn.execute(sa.text("CREATE SCHEMA public"))
            await conn.execute(sa.text("GRANT ALL ON SCHEMA public TO public"))
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        if 'does not exist' in str(e) and ('schooldb_test' in url):
            pytest.skip("Test database 'schooldb_test' missing and cannot be created with current privileges.")
        raise
    try:
        yield
    finally:
        async with test_engine.begin() as conn:
            await conn.execute(sa.text("DROP SCHEMA IF EXISTS public CASCADE"))
        await test_engine.dispose()

@pytest.fixture
async def session(setup_db):
    async with async_session() as s:  # type: AsyncSession
        yield s

@pytest.fixture
async def client(setup_db):
    transport = ASGITransport(app=app)
    token = jwt.encode({"sub": 1, "roles": ["admin","teacher"]}, settings.jwt_secret, algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}
    async with AsyncClient(transport=transport, base_url="http://test", headers=headers) as c:
        yield c

@pytest.fixture
async def seeded_permissions(session: AsyncSession):
    """Seed minimal permission + role mapping rows for settings tests when RBAC enforced.

    Uses raw SQL to avoid importing Alembic or relying on full migration history.
    Skips silently if core.permission table not present (legacy public-only mode).
    """
    try:
        await session.execute(sa.text("CREATE TABLE IF NOT EXISTS core.permission (code TEXT PRIMARY KEY, description TEXT NOT NULL)"))
        await session.execute(sa.text("CREATE TABLE IF NOT EXISTS core.role_permission (role TEXT NOT NULL, permission_code TEXT NOT NULL REFERENCES core.permission(code) ON DELETE CASCADE, PRIMARY KEY(role, permission_code))"))
        perms = [
            ('settings:config_read','List configuration entries'),
            ('settings:config_write','Create or update configuration entry')
        ]
        for code, desc in perms:
            await session.execute(sa.text("INSERT INTO core.permission(code, description) VALUES (:c,:d) ON CONFLICT (code) DO NOTHING"), {'c': code, 'd': desc})
            await session.execute(sa.text("INSERT INTO core.role_permission(role, permission_code) VALUES ('ADMIN', :c) ON CONFLICT DO NOTHING"), {'c': code})
        await session.commit()
    except Exception:
        # Table may not exist (core schema not created in this fast path); ignore
        await session.rollback()
    yield
