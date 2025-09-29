import asyncio
from sqlalchemy import text
from app.core.db import async_session, engine

MIN_CLASS_STATUS = [
    # grade, section, result_status
    (1, 'A', 'Pending'),
    (1, 'B', 'Pending'),
]

MIN_CLASS_TEACHERS = [
    (1, 'A', 'Alice Teacher'),
]

async def seed():
    async with engine.begin() as conn:
        # Class statuses (upsert by unique (grade, section))
        for grade, section, result_status in MIN_CLASS_STATUS:
            await conn.execute(text("""
                INSERT INTO class_status (grade, section, result_status)
                VALUES (:g,:s,:r)
                ON CONFLICT (grade, section) DO UPDATE SET result_status=excluded.result_status
            """), {"g": grade, "s": section, "r": result_status})
        # Class teacher
        for grade, section, teacher in MIN_CLASS_TEACHERS:
            await conn.execute(text("""
                INSERT INTO class_teachers (grade, section, teacher_name)
                VALUES (:g,:s,:t)
                ON CONFLICT (grade, section) DO UPDATE SET teacher_name=excluded.teacher_name
            """), {"g": grade, "s": section, "t": teacher})
        # One sample student
        await conn.execute(text("""
            INSERT INTO students (admission_no, first_name, last_name, class, section, gender, roll)
            VALUES ('ADM1','Test','Student','1','A','M',1)
            ON CONFLICT (admission_no) DO NOTHING
        """))
        # One attendance event
        await conn.execute(text("""
            INSERT INTO attendance_events (student_id, date, present)
            SELECT id, CURRENT_DATE, 1 FROM students WHERE admission_no='ADM1'
            ON CONFLICT (student_id, date) DO NOTHING
        """))
        # Fee invoice
        await conn.execute(text("""
            INSERT INTO fee_invoices (student_id, amount, paid_amount, due_date)
            SELECT id, 1000, 0, CURRENT_DATE + INTERVAL '30 day' FROM students WHERE admission_no='ADM1'
            ON CONFLICT DO NOTHING
        """))
    print("Minimal seed complete")

if __name__ == "__main__":
    asyncio.run(seed())
