"""Simple DB connectivity check.
Run: python db_check.py
"""
import asyncio, sys
from app.core.db import ASYNC_DSN

async def main():
    print("ASYNC_DSN:", ASYNC_DSN)
    try:
        import asyncpg
    except ImportError:
        print("asyncpg not installed")
        sys.exit(1)
    # asyncpg.connect does not accept the '+asyncpg' dialect prefix; normalize
    raw_dsn = ASYNC_DSN.replace('postgresql+asyncpg://','postgresql://',1)
    try:
        conn = await asyncpg.connect(raw_dsn)
        v = await conn.fetchval('select version()')
        dbn = await conn.fetchval('select current_database()')
        print("Connected OK ->", dbn)
        print(v)
        await conn.close()
    except Exception as e:
        print("DB_CONNECT_FAIL", e)
        sys.exit(2)

if __name__ == '__main__':
    asyncio.run(main())
