"""Extended staff seed: populate richer staff sample records idempotently.

Uses upsert-like logic based on staff_code; safe to run multiple times.
"""
from datetime import date, timedelta
from sqlalchemy import text
from app.core.db import engine

STAFF_ROWS = [
    {"staff_code": "T001", "name": "Asha Verma", "role": "Teacher", "department": "Mathematics", "grade": "Grade 9", "email": "asha.verma@example.edu", "phone": "+910000000001"},
    {"staff_code": "T002", "name": "Rohit Singh", "role": "Teacher", "department": "Science", "grade": "Grade 10", "email": "rohit.singh@example.edu", "phone": "+910000000002"},
    {"staff_code": "AC003", "name": "Priya Sharma", "role": "Accountant", "department": "Finance", "grade": None, "email": "priya.sharma@example.edu", "phone": "+910000000003"},
    {"staff_code": "LB004", "name": "Saira Khan", "role": "Librarian", "department": "Administration", "grade": None, "email": "saira.khan@example.edu", "phone": "+910000000004"},
]


async def seed_staff():  # pragma: no cover - convenience script
    # Lazy import to allow standalone execution if app package path differs
    try:
        from app.core.db import engine  # type: ignore
    except Exception:  # fallback to local async engine creation
        from sqlalchemy.ext.asyncio import create_async_engine
        engine = create_async_engine(
            "postgresql+asyncpg://erplake:erplake@localhost:5544/schooldb", future=True
        )
    async with engine.begin() as conn:
        for row in STAFF_ROWS:
            # Insert or update core fields
            await conn.execute(text(
                """
                INSERT INTO staff (staff_code,name,role,department,grade,email,phone,status,attendance_30,leaves_taken_ytd,leave_balance,date_of_joining,birthday)
                VALUES (:staff_code,:name,:role,:department,:grade,:email,:phone,'Active',:attendance,:lty,:lb,:doj,:bday)
                ON CONFLICT (staff_code) DO UPDATE SET
                  name=excluded.name,
                  role=excluded.role,
                  department=excluded.department,
                  grade=excluded.grade,
                  email=excluded.email,
                  phone=excluded.phone,
                  updated_at=now()
                """
            ), {
                **row,
                "attendance": 90,
                "lty": 2,
                "lb": 12,
                "doj": date(2019, 6, 1),
                "bday": date(1990, 9, 30),
            })

if __name__ == "__main__":  # pragma: no cover
    import asyncio
    asyncio.run(seed_staff())
