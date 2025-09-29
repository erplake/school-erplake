"""Python status script replacing prior PowerShell function.
Run: .venv\Scripts\python.exe scripts/status.py
"""
from __future__ import annotations
import asyncio, socket, json
from pathlib import Path
from sqlalchemy import text
from app.core.db import engine

PORTS = [5544, 8000, 8001, 5173]

async def db_summary():
    async with engine.begin() as conn:
        tables = [r[0] for r in await conn.execute(text("""
            select table_name from information_schema.tables
            where table_schema='public' and table_name in ('class_status','class_teachers','students','attendance_events','fee_invoices','student_tags')
            order by 1
        """))]
        counts = {}
        for t in ['students','attendance_events','fee_invoices','student_tags','class_status','class_teachers']:
            if t in tables:
                counts[t] = (await conn.execute(text(f'select count(*) from {t}'))).scalar_one()
        return {"tables": tables, "counts": counts}

async def main():
    # Ports
    port_status = {}
    for p in PORTS:
        s = socket.socket()
        s.settimeout(0.2)
        try:
            s.connect(('localhost', p))
            port_status[p] = True
        except Exception:
            port_status[p] = False
        finally:
            s.close()
    # DB summary
    try:
        db = await db_summary()
    except Exception as e:
        db = {"error": str(e)}
    print(json.dumps({"ports": port_status, "db": db}, indent=2))

if __name__ == '__main__':
    asyncio.run(main())
