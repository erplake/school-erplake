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
    """Per-test schema isolation with optional cloned DB mode.

    Modes:
      * Default (metadata mode): create a unique temp schema and run Base.metadata.create_all inside it for
        tables that have no explicit schema (legacy/simple mode).
      * Cloned mode (USE_CLONED_DB=1): assume full database (including core/comms/etc) was restored from a dump.
        We only create an ephemeral overlay schema to isolate data we might write for plain public tables, and we
        SKIP Base.metadata.create_all to avoid accidental DDL against the cloned structure. search_path order ensures
        temp schema overrides public while still allowing access to existing multi‑schema objects.
    """
    cloned_mode = os.getenv('USE_CLONED_DB','').lower() in ('1','true','yes')
    desired_dsn = _current_async_dsn()
    if str(base_engine.url) != desired_dsn:
        test_engine = create_async_engine(desired_dsn, echo=False, pool_pre_ping=True)
    else:
        test_engine = base_engine
    db_name = test_engine.url.database or ''
    allow_dev = os.getenv('ALLOW_DEV_DB_TEST_RESET','').lower() in ('1','true','yes')
    if not (('_test' in db_name.lower() or 'test_' in db_name.lower()) or allow_dev):
        raise AssertionError(
            f"Refusing to run tests on non-test database '{db_name}' without ALLOW_DEV_DB_TEST_RESET=1"
        )
    if allow_dev and not cloned_mode:
        print(f"[WARN] Using development database '{db_name}' for tests (schema isolation mode).")
    import uuid
    schema_name = f"test_{uuid.uuid4().hex[:8]}"
    async with test_engine.begin() as conn:
        await conn.execute(sa.text(f'CREATE SCHEMA IF NOT EXISTS {schema_name}'))
        # Build search_path including well-known app schemas if present
        # Order: temp schema first, then app schemas, finally public.
        app_schemas = ['core','comms','academics','fees']
        existing = []
        for sch in app_schemas:
            try:
                exists = (await conn.execute(sa.text("SELECT 1 FROM information_schema.schemata WHERE schema_name=:s"), {'s': sch})).first()
                if exists:
                    existing.append(sch)
            except Exception:
                pass
        path = ",".join([schema_name] + existing + ['public'])
        await conn.execute(sa.text(f"SET search_path TO {path}"))
        # Auto-detect clone if key core tables already exist (makes USE_CLONED_DB optional)
        if not cloned_mode:
            try:
                core_user = (await conn.execute(sa.text("SELECT 1 FROM information_schema.tables WHERE table_schema='core' AND table_name='user_account'"))).first()
                if core_user:
                    cloned_mode = True
            except Exception:
                pass
        if not cloned_mode:
            try:
                # Only create metadata tables in non-cloned mode (legacy behavior)
                await conn.run_sync(Base.metadata.create_all)
            except Exception as e:
                # If we hit missing referenced core objects, fallback to cloned_mode automatically
                msg = str(e)
                if 'NoReferencedTableError' in msg or 'could not find table' in msg:
                    print('[INFO] Switching to cloned DB mode after create_all failure:', msg[:120])
                    cloned_mode = True
                else:
                    raise
        if cloned_mode:
            # Ensure newly added tables (e.g., staff_substitutions) exist even if dump predates migration
            try:
                await conn.execute(sa.text("""
                    CREATE TABLE IF NOT EXISTS staff_substitutions (
                        id SERIAL PRIMARY KEY,
                        absent_staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
                        covering_staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
                        date_from DATE NOT NULL,
                        date_to DATE NOT NULL,
                        notes VARCHAR(255),
                        email_outbox_id INTEGER NULL,
                        whatsapp_outbox_id INTEGER NULL,
                        created_at TIMESTAMPTZ DEFAULT now()
                    )
                """))
            except Exception:
                pass
    try:
        @sa.event.listens_for(test_engine.sync_engine, "connect")  # type: ignore
        def _set_search_path(dbapi_conn, connection_record):  # pragma: no cover
            with dbapi_conn.cursor() as cur:
                cur.execute(f"SET search_path TO {path}")
        yield
    finally:
        async with test_engine.begin() as conn:
            try:
                await conn.execute(sa.text(f'DROP SCHEMA IF EXISTS {schema_name} CASCADE'))
            except Exception:
                pass
        if test_engine is not base_engine:
            await test_engine.dispose()

@pytest.fixture
async def session(setup_db):
    async with async_session() as s:
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
