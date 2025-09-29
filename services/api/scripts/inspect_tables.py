import asyncio
from app.core.db import engine
from sqlalchemy import text

TARGET = ("class_status","class_teachers","student_tags","attendance_events","fee_invoices")

async def main():
    async with engine.begin() as conn:
        res = await conn.execute(text("""
            select table_name from information_schema.tables
            where table_schema='public' and table_name = any(:names)
            order by 1
        """), {"names": list(TARGET)})
        print("Existing tables:", [r[0] for r in res])

if __name__ == '__main__':
    asyncio.run(main())
