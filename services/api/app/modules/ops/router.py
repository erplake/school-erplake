from __future__ import annotations
from fastapi import APIRouter
import socket
from sqlalchemy import text
import time
from app.core.db import engine
from app.core.config import settings
from urllib.parse import urlparse

router = APIRouter(prefix="/ops", tags=["ops"])

PORTS = [5544, 8000, 8001, 5173]

@router.get('/status')
async def ops_status():
    # Ports
    port_status = {}
    for p in PORTS:
        s = socket.socket()
        s.settimeout(0.15)
        try:
            s.connect(('localhost', p))
            port_status[p] = True
        except Exception:
            port_status[p] = False
        finally:
            s.close()
    # DB snapshot
    db_info = {}
    alembic_version = None
    db_latency_ms = None
    start = time.perf_counter()
    try:
        async with engine.begin() as conn:
            tables = [r[0] for r in await conn.execute(text("""
                select table_name from information_schema.tables
                where table_schema='public' and table_name in (
                    'class_status','class_teachers','students','attendance_events','fee_invoices','student_tags'
                ) order by 1
            """))]
            db_info['tables'] = tables
            counts = {}
            for t in tables:
                counts[t] = (await conn.execute(text(f'select count(*) from {t}'))).scalar_one()
            db_info['counts'] = counts
            ver_res = await conn.execute(text("SELECT version_num FROM alembic_version LIMIT 1"))
            row = ver_res.first()
            alembic_version = row[0] if row else None
        db_latency_ms = round((time.perf_counter() - start) * 1000, 2)
    except Exception as e:
        db_info['error'] = str(e)
    # DSN exposure (host/port/db only)
    dsn = settings.postgres_dsn
    parsed = urlparse(dsn.replace('postgresql+asyncpg://','postgresql://'))
    db_meta = {
        "host": parsed.hostname,
        "port": parsed.port,
        "database": (parsed.path or '').lstrip('/'),
        "user": parsed.username,
        "driver": 'asyncpg' if 'asyncpg' in dsn else 'psycopg',
    }
    return {"ports": port_status, "db": db_info, "alembic_version": alembic_version, "db_latency_ms": db_latency_ms, "dsn": db_meta}
