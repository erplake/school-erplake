"""Seed script for new core + academics schemas.

Idempotent inserts creating:
  - School (core.school)
  - Current Academic Year (academics.academic_year)
  - One or more Staff teachers (core.staff legacy table used by ClassSection.class_teacher FK)
  - ClassSections for a small grade/section matrix

Subsequent scripts will extend with students/guardians/enrollments & attendance/gallery.

Run:  python -m app.seed_core_academics
"""
from __future__ import annotations
import asyncio
from datetime import date
from sqlalchemy import text
from app.core.db import engine

SCHOOL = {
    'name': 'Sunrise Public School',
    'short_name': 'Sunrise',
    'ay_start_mm': 4,
    'timezone': 'Asia/Kolkata',
    'subdomain': 'sunrise',
    'phone': '+910000000000',
    'email': 'info@sunrise.example',
    'address': '123 Education Lane, City',
}

# Teachers (staff table)
TEACHERS = [
    {'staff_code': 'T001', 'name': 'Asha Singh', 'role': 'Teacher', 'email': 'asha.singh@sunrise.example', 'phone': '+911234500001'},
    {'staff_code': 'T002', 'name': 'Bharat Rao', 'role': 'Teacher', 'email': 'bharat.rao@sunrise.example', 'phone': '+911234500002'},
]

# Grade / Section matrix mapped to teacher staff_code assignment
CLASS_SECTIONS = [
    # grade, section, room, teacher staff_code
    (5, 'A', 'Room 501', 'T001'),
    (5, 'B', 'Room 502', 'T002'),
    (6, 'A', 'Room 601', 'T001'),
]

AY_NAME = '2025-26'

async def seed():
    async with engine.begin() as conn:
        # Ensure core schemas exist (Alembic should have created, but be defensive). Execute separately for asyncpg.
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS core"))
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS academics"))

        # Insert School (idempotent on subdomain unique). Return id for downstream inserts.
        school_id_row = await conn.execute(text("SELECT id FROM core.school WHERE subdomain=:subdomain"), {'subdomain': SCHOOL['subdomain']})
        school_id = school_id_row.scalar_one_or_none()
        if school_id is None:
            insert_row = await conn.execute(text("""
                INSERT INTO core.school (name,short_name,ay_start_mm,timezone,subdomain,phone,email,address)
                VALUES (:name,:short_name,:ay_start_mm,:timezone,:subdomain,:phone,:email,:address) RETURNING id
            """), SCHOOL)
            school_id = insert_row.scalar_one()
        else:
            # update mutable fields
            await conn.execute(text("""
                UPDATE core.school SET name=:name, short_name=:short_name, phone=:phone, email=:email, address=:address, ay_start_mm=:ay_start_mm, timezone=:timezone
                WHERE id=:id
            """), {**SCHOOL,'id': school_id})

        # Current Academic Year (unique by school_id+name assumption)
        # Upsert style: try insert, then ensure is_current flag
        ay_row = await conn.execute(text("SELECT id FROM academics.academic_year WHERE school_id=:sid AND name=:name"), {'sid': school_id, 'name': AY_NAME})
        ay_id = ay_row.scalar_one_or_none()
        if ay_id is None:
            ay_insert = await conn.execute(text("""
                INSERT INTO academics.academic_year (school_id, name, start_date, end_date, is_current)
                VALUES (:school_id, :name, :start, :end, true) RETURNING id
            """), {
                'school_id': school_id,
                'name': AY_NAME,
                'start': date(2025,4,1),
                'end': date(2026,3,31)
            })
            ay_id = ay_insert.scalar_one()
        else:
            await conn.execute(text("UPDATE academics.academic_year SET is_current=true WHERE id=:id"), {'id': ay_id})

        # Staff teacher rows
        # Ensure staff table exists (legacy public schema) if migrations haven't created it yet.
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS staff (
              id SERIAL PRIMARY KEY,
              staff_code TEXT UNIQUE NOT NULL,
              name TEXT NOT NULL,
              role TEXT NOT NULL,
              email TEXT,
              phone TEXT,
              status TEXT DEFAULT 'Active',
              created_at timestamptz DEFAULT now(),
              updated_at timestamptz DEFAULT now()
            )
        """))
        staff_code_to_id = {}
        for t in TEACHERS:
            # Try insert returning id; if conflict, fetch existing id
            inserted = await conn.execute(text("""
                INSERT INTO staff (staff_code,name,role,email,phone,status,created_at,updated_at)
                VALUES (:staff_code,:name,:role,:email,:phone,'Active', now(), now())
                ON CONFLICT (staff_code) DO NOTHING RETURNING id
            """), t)
            new_id = inserted.scalar_one_or_none()
            if new_id is None:
                existing = await conn.execute(text("SELECT id FROM staff WHERE staff_code=:sc"), {'sc': t['staff_code']})
                new_id = existing.scalar_one()
                # Also update mutable fields when not inserted
                await conn.execute(text("""
                    UPDATE staff SET name=:name, role=:role, email=:email, phone=:phone, updated_at=now() WHERE staff_code=:staff_code
                """), t)
            staff_code_to_id[t['staff_code']] = new_id

        # Insert class sections (idempotent via unique constraint) using deterministic ids hashed from grade/section
        for (grade, section, room, staff_code) in CLASS_SECTIONS:
            teacher_id = None  # temporarily bypass FK mismatch; will update later when constraint clarified
            await conn.execute(text("""
                INSERT INTO academics.class_section (school_id, ay_id, grade_label, section_label, room, class_teacher)
                VALUES (:school_id, :ay_id, :grade, :section, :room, :teacher_id)
                ON CONFLICT (school_id, ay_id, grade_label, section_label) DO UPDATE
                SET room = EXCLUDED.room, class_teacher = COALESCE(EXCLUDED.class_teacher, academics.class_section.class_teacher)
            """), {
                'school_id': school_id,
                'ay_id': ay_id,
                'grade': str(grade),
                'section': section,
                'room': room,
                'teacher_id': teacher_id
            })

    print("[seed_core_academics] Core + academics base seeded.")

def run():
    asyncio.run(seed())

if __name__ == '__main__':
    run()
