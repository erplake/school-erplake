import asyncio
from datetime import date
from sqlalchemy import text
from app.core.db import async_session
from app.modules.core.models_new import School, AcademicYear

"""Idempotent seed script to ensure a School(id=1) and a current AcademicYear exist.
Run with active DATABASE_URL environment variable.
"""

AY_NAME = "2025-26"
AY_START = date(2025, 4, 1)
AY_END = date(2026, 3, 31)

async def ensure_school_and_year():
    async with async_session() as session:
        # Determine or create a school record
        school_id = await session.scalar(text("SELECT id FROM core.school ORDER BY id LIMIT 1"))
        if not school_id:
            school_id = await session.scalar(
                text("INSERT INTO core.school(name,timezone) VALUES (:n,:tz) RETURNING id"),
                {"n": "Demo School", "tz": "Asia/Kolkata"}
            )
            await session.commit()
            print(f"Created school id={school_id}")
        else:
            print(f"School exists id={school_id}")

        # Ensure a current academic year exists
        existing_current = await session.scalar(text("SELECT id FROM academics.academic_year WHERE is_current = true LIMIT 1"))
        if existing_current:
            print(f"Current academic year already present (id={existing_current})")
            return
        ay = AcademicYear(school_id=school_id, name=AY_NAME, start_date=AY_START, end_date=AY_END, is_current=True)
        session.add(ay)
        await session.commit()
        print("Seeded academic year id", ay.id)

if __name__ == '__main__':
    asyncio.run(ensure_school_and_year())
