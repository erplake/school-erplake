"""Seed guardians, legacy students, mirrored core students, and enrollments.

Strategy A: Maintain legacy public.students for existing attendance & legacy flows
while inserting mirrored rows into core.student. We don't force ID parity; we
store a mapping in-process and use core IDs for academics.enrollment.

Run: python -m app.seed_students_guardians
"""
from __future__ import annotations
import asyncio
from datetime import date
from sqlalchemy import text
from app.core.db import engine

GUARDIANS = [
    { 'full_name': 'Ravi Kumar', 'relation': 'FATHER', 'phone': '+911111111001' },
    { 'full_name': 'Meera Kumar', 'relation': 'MOTHER', 'phone': '+911111111002' },
    { 'full_name': 'Sanjay Iyer', 'relation': 'FATHER', 'phone': '+911111111003' },
    { 'full_name': 'Anita Iyer', 'relation': 'MOTHER', 'phone': '+911111111004' },
]

STUDENTS = [
    # first, last, grade, section, guardian_phone
    ('Aarav','Kumar',5,'A','+911111111001'),
    ('Diya','Kumar',5,'A','+911111111002'),
    ('Kabir','Iyer',5,'B','+911111111003'),
    ('Sara','Iyer',5,'B','+911111111004'),
    ('Vikram','Patel',6,'A','+911111111001'),
    ('Nisha','Patel',6,'A','+911111111002'),
]

async def seed():
    async with engine.begin() as conn:
        # Ensure guardian & student tables exist if not yet migrated (best-effort, idempotent)
        await conn.execute(text("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='core' AND table_name='guardian') THEN
                CREATE TABLE core.guardian (
                  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                  school_id BIGINT REFERENCES core.school(id) ON DELETE CASCADE,
                  full_name TEXT NOT NULL,
                  relation TEXT NOT NULL,
                  phone TEXT,
                  email TEXT,
                  address TEXT
                );
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='core' AND table_name='student') THEN
                CREATE TABLE core.student (
                  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                  school_id BIGINT REFERENCES core.school(id) ON DELETE CASCADE,
                  user_id BIGINT,
                  adm_no TEXT,
                  first_name TEXT NOT NULL,
                  last_name TEXT,
                  dob DATE,
                  gender TEXT,
                  house_id BIGINT,
                  photo_url TEXT,
                  is_active BOOLEAN NOT NULL DEFAULT TRUE,
                  created_at timestamptz NOT NULL DEFAULT now()
                );
            END IF;
                        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='students') THEN
                                CREATE TABLE public.students (
                                    id SERIAL PRIMARY KEY,
                                    admission_no TEXT UNIQUE,
                                    first_name TEXT NOT NULL,
                                    last_name TEXT,
                                    class TEXT,
                                    section TEXT,
                                    guardian_phone TEXT,
                                    created_at timestamptz DEFAULT now()
                                );
                        END IF;
        END $$;
        """))
        # Resolve school & AY
        school_id = (await conn.execute(text("SELECT id FROM core.school WHERE subdomain='sunrise'"))).scalar_one_or_none()
        if not school_id:
            print("[seed_students_guardians] School not found; run seed_core_academics first.")
            return
        ay_id = (await conn.execute(text("SELECT id FROM academics.academic_year WHERE school_id=:sid AND is_current=true"), {'sid': school_id})).scalar_one()

        # Insert guardians (core.guardian)
        for g in GUARDIANS:
            await conn.execute(text("""
                INSERT INTO core.guardian (school_id, full_name, relation, phone)
                VALUES (:sid, :full_name, :relation, :phone)
                ON CONFLICT DO NOTHING
            """), {**g, 'sid': school_id})

        # Legacy students (public.students)
        for f,l,grade,section,phone in STUDENTS:
            await conn.execute(text("""
                INSERT INTO students (first_name,last_name,class,section,guardian_phone)
                VALUES (:f,:l,:g,:s,:p)
                ON CONFLICT DO NOTHING
            """), {'f': f, 'l': l, 'g': str(grade), 's': section, 'p': phone})

        # Mirror into core.student (no enforced mapping of IDs; we capture mapping)
        core_map = {}  # key: legacy composite (first,last,grade,section) -> core_student_id
        for f,l,grade,section,phone in STUDENTS:
            existing = await conn.execute(text("""
                SELECT id, adm_no FROM core.student WHERE school_id=:sid AND first_name=:f AND last_name=:l
            """), {'sid': school_id,'f': f,'l': l})
            row = existing.first()
            if row:
                core_id = row.id
            else:
                inserted = await conn.execute(text("""
                    INSERT INTO core.student (school_id, first_name, last_name)
                    VALUES (:sid,:f,:l) RETURNING id
                """), {'sid': school_id,'f': f,'l': l})
                core_id = inserted.scalar_one()
                # Set adm_no using the new id
                await conn.execute(text("UPDATE core.student SET adm_no=CONCAT('ADM', lpad(id::text,4,'0')) WHERE id=:id"), {'id': core_id})
            core_map[(f,l,str(grade),section)] = core_id

        # Enrollments -> need class_section ids
        class_rows = (await conn.execute(text("""
            SELECT id, grade_label, section_label FROM academics.class_section WHERE school_id=:sid AND ay_id=:ay
        """), {'sid': school_id,'ay': ay_id})).mappings().all()
        class_index = {(r['grade_label'], r['section_label']): r['id'] for r in class_rows}

        roll_tracker = {}
        for f,l,grade,section,phone in STUDENTS:
            cs_id = class_index.get((str(grade), section))
            if not cs_id:
                continue
            core_id = core_map.get((f,l,str(grade),section))
            # determine next roll
            key = cs_id
            roll_tracker.setdefault(key, 0)
            roll_tracker[key] += 1
            roll_no = roll_tracker[key]
            await conn.execute(text("""
                INSERT INTO academics.enrollment (student_id, class_section_id, roll_no, joined_on)
                VALUES (:stu,:cls,:roll,:joined)
                ON CONFLICT DO NOTHING
            """), {'stu': core_id,'cls': cs_id,'roll': roll_no,'joined': date.today()})

    print('[seed_students_guardians] Guardians, students, and enrollments seeded.')

def run():
    asyncio.run(seed())

if __name__ == '__main__':
    run()
