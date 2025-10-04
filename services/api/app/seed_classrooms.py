"""Seed classroom management data: wings, classes, student assignments, attendance & fee invoices.

Run:  python -m app.seed_classrooms

Idempotent: safely re-runnable; uses existence checks / ON CONFLICT patterns.
"""
from __future__ import annotations
import asyncio
from datetime import date, timedelta
from random import Random
from sqlalchemy import text
from app.core.db import engine

ACADEMIC_YEAR = "2025-26"

WINGS = [
    {"name": "Primary", "grade_start": 1, "grade_end": 5},
    {"name": "Middle", "grade_start": 6, "grade_end": 8},
]

# (grade, section, teacher_name, wing_name)
CLASSES = [
    (5, "A", "Ms. Asha", "Primary"),
    (5, "B", "Mr. Bharat", "Primary"),
    (6, "A", "Ms. Chitra", "Middle"),
]

ATTENDANCE_DAYS = 5  # create last N days attendance events

def _rng():
    return Random(42)  # deterministic

async def seed():
    rng = _rng()
    async with engine.begin() as conn:
        # Ensure base tables exist (migration should have created). Light defensive checks.
        # Insert Wings
        for w in WINGS:
            await conn.execute(text(
                """
                INSERT INTO wings (academic_year,name,grade_start,grade_end,target_ratio,head)
                VALUES (:ay,:name,:gs,:ge,NULL,NULL)
                ON CONFLICT (academic_year,name) DO UPDATE
                SET grade_start=EXCLUDED.grade_start, grade_end=EXCLUDED.grade_end
                """
            ), {"ay": ACADEMIC_YEAR, "name": w["name"], "gs": w["grade_start"], "ge": w["grade_end"]})

        wing_rows = (await conn.execute(text("SELECT id,name FROM wings WHERE academic_year=:ay"), {"ay": ACADEMIC_YEAR})).mappings().all()
        wing_name_to_id = {r["name"]: r["id"] for r in wing_rows}

        # Insert Classes
        for grade, section, teacher, wing_name in CLASSES:
            wing_id = wing_name_to_id.get(wing_name)
            await conn.execute(text(
                """
                INSERT INTO school_classes (academic_year, wing_id, grade, section, teacher_name, target_ratio, head_teacher)
                VALUES (:ay,:wid,:gr,:sec,:tn,NULL,NULL)
                ON CONFLICT (academic_year, grade, section) DO UPDATE
                SET teacher_name=COALESCE(EXCLUDED.teacher_name, school_classes.teacher_name), wing_id=COALESCE(EXCLUDED.wing_id, school_classes.wing_id)
                """
            ), {"ay": ACADEMIC_YEAR, "wid": wing_id, "gr": grade, "sec": section, "tn": teacher})

        class_rows = (await conn.execute(text("SELECT id, grade, section FROM school_classes WHERE academic_year=:ay"), {"ay": ACADEMIC_YEAR})).mappings().all()
        # Collect some students to assign (reuse existing students table); pick first N deterministically
        students = (await conn.execute(text("SELECT id FROM students ORDER BY id ASC LIMIT 60"))).scalars().all()
        if not students:
            print("[seed_classrooms] No students found. Create students first.")
            return
        # Distribute students round-robin over classes
        class_ids = [r["id"] for r in class_rows]
        if not class_ids:
            print("[seed_classrooms] No classes after insert; aborting assignments.")
            return
        # Existing assignments to avoid duplicate primary key errors
        existing_pairs = (await conn.execute(text("SELECT class_id, student_id FROM class_students WHERE class_id = ANY(:cids)"), {"cids": class_ids})).all()
        existing_set = set(existing_pairs)
        for idx, sid in enumerate(students):
            cid = class_ids[idx % len(class_ids)]
            if (cid, sid) in existing_set:
                continue
            await conn.execute(text(
                "INSERT INTO class_students (class_id, student_id) VALUES (:cid,:sid) ON CONFLICT DO NOTHING"
            ), {"cid": cid, "sid": sid})

        # Attendance events for last ATTENDANCE_DAYS days (random presence)
        # We only seed for students we just assigned to classes
        days = [date.today() - timedelta(days=i) for i in range(ATTENDANCE_DAYS)]
        for d in days:
            for sid in students:
                present = True if rng.random() > 0.15 else False  # boolean column
                await conn.execute(text(
                    """
                    INSERT INTO attendance_events (student_id, date, present)
                    VALUES (:sid,:dt,:pr)
                    ON CONFLICT (student_id,date) DO NOTHING
                    """
                ), {"sid": sid, "dt": d, "pr": present})

        # Fee invoices: one per student; settle every 3rd to vary fee_due_pct
        for sid in students:
            amount = 10000
            paid = amount if (sid % 3 == 0) else (amount // 2)
            settled_clause = "now()" if paid == amount else "NULL"
            await conn.execute(text(
                f"""
                INSERT INTO fee_invoices (student_id, amount, paid_amount, due_date, settled_at)
                VALUES (:sid,:amt,:paid,:due, {settled_clause})
                ON CONFLICT DO NOTHING
                """
            ), {"sid": sid, "amt": amount, "paid": paid, "due": date.today()})

    print("[seed_classrooms] Wings, classes, assignments, attendance & fee invoices seeded.")


def run():
    asyncio.run(seed())

if __name__ == "__main__":
    run()
