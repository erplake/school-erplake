"""Seed script for classes domain (students, attendance, fee invoices, statuses, teachers, tags).

Idempotent: running multiple times will not duplicate core rows.
Usage (from repo root or services/api):

    python -m app.modules.classes.seed_classes

Environment variables are loaded the same way as other seeds (.env.local if present).
"""
from __future__ import annotations
import asyncio
from datetime import date, timedelta, datetime, timezone
from pathlib import Path
from random import randint, choice
from sqlalchemy import text

try:
    from dotenv import load_dotenv  # type: ignore
    root_env = Path(__file__).resolve().parents[3] / '.env.local'
    if root_env.exists():
        load_dotenv(root_env, override=True)
except Exception:  # pragma: no cover
    pass

from ...core.db import engine  # noqa: E402

# Academic year used for wing / class seeding (align with dashboard expectations)
ACADEMIC_YEAR = f"{date.today().year}-{(date.today().year+1) % 100:02d}"  # e.g. 2025-26

GRADES = list(range(5, 11))  # 5..10
SECTIONS = ["A", "B"]
STUDENTS_PER_CLASS = 6
TAGS = ["Bus", "Scholar", "Prefect", "New"]

TEACHERS = {
    (5, "A"): "Mrs. Rao",
    (5, "B"): "Mr. Khan",
    (6, "A"): "Ms. Patel",
    (7, "A"): "Mr. Shah",
}

TODAY = date.today()

async def seed_classes(include_classes_admin: bool = True, include_exam_scores: bool = True):
    # Show engine URL (redacted password if present)
    try:
        url = str(engine.url)
    except Exception:
        url = 'unknown'
    print("[classes.seed] Using engine", url)
    async with engine.begin() as conn:
        # Ensure base sample students across classes
        for g in GRADES:
            for sec in SECTIONS:
                for idx in range(1, STUDENTS_PER_CLASS + 1):
                    first = f"Stu{g}{sec}{idx}"
                    gender = 'M' if idx % 2 == 0 else 'F'
                    await conn.execute(text(
                        """
                        insert into students (first_name, class, section, gender, guardian_phone, roll)
                        values (:f, :c, :s, :gender, :phone, :roll)
                        on conflict do nothing
                        """
                    ), {
                        "f": first,
                        "c": str(g),
                        "s": sec,
                        "gender": gender,
                        "phone": f"9{g}{sec}{idx:02d}00000"[:10],
                        "roll": idx
                    })
        # Attendance events: last 5 days random presence
        for day_offset in range(5):
            dt = TODAY - timedelta(days=day_offset)
            # Use random()>0.5 to yield a native boolean instead of relying on int->bool casting
            await conn.execute(text(
                """
                insert into attendance_events (student_id, date, present)
                select id, :dt, (random()>0.5) from students
                on conflict (student_id,date) do nothing
                """
            ), {"dt": dt})
        # Fee invoices: one open, one partially paid, one settled per student (idempotent via unique triple constraint assumption -> fallback using exists check)
        student_rows = (await conn.execute(text("select id from students"))).scalars().all()
        for sid in student_rows:
            # open
            await conn.execute(text(
                """insert into fee_invoices (student_id, amount, paid_amount, due_date)
                select :sid, 5000, 0, :due
                where not exists (select 1 from fee_invoices where student_id=:sid and amount=5000 and paid_amount=0)"""
            ), {"sid": sid, "due": TODAY + timedelta(days=15)})
            # partial
            await conn.execute(text(
                """insert into fee_invoices (student_id, amount, paid_amount, due_date)
                select :sid, 7000, 3000, :due
                where not exists (select 1 from fee_invoices where student_id=:sid and amount=7000 and paid_amount=3000)"""
            ), {"sid": sid, "due": TODAY + timedelta(days=30)})
            # settled
            await conn.execute(text(
                """insert into fee_invoices (student_id, amount, paid_amount, due_date, settled_at)
                select :sid, 4000, 4000, :due, now()
                where not exists (select 1 from fee_invoices where student_id=:sid and amount=4000 and paid_amount=4000)"""
            ), {"sid": sid, "due": TODAY - timedelta(days=10)})
        # Introduce variance: for a deterministic subset (every 3rd student), mark their previously open 5000 invoice as settled
        # and fully pay the partial 7000 (simulate reconciliation) so fee_due_pct is < 100%.
        for sid in student_rows:
            if sid % 3 == 0:
                # settle the open invoice (set paid_amount=amount and settled_at now())
                await conn.execute(text(
                    """update fee_invoices set paid_amount=amount, settled_at=now()
                    where student_id=:sid and amount=5000 and paid_amount=0 and settled_at is null"""
                ), {"sid": sid})
                # fully pay the partial invoice
                await conn.execute(text(
                    """update fee_invoices set paid_amount=amount, settled_at=now()
                    where student_id=:sid and amount=7000 and paid_amount=3000 and settled_at is null"""
                ), {"sid": sid})
        # Tags: assign one random tag per first two students of each class
        for g in GRADES:
            for sec in SECTIONS:
                rows = (await conn.execute(text("select id from students where class=:c and section=:s order by roll limit 2"), {"c": str(g), "s": sec})).scalars().all()
                for r in rows:
                    tag = choice(TAGS)
                    await conn.execute(text(
                        """insert into student_tags (student_id, tag)
                        values (:sid, :tag)
                        on conflict do nothing"""
                    ), {"sid": r, "tag": tag})
        # Class statuses (random Published or Pending if absent)
        # Use VALUES + ON CONFLICT instead of SELECT/WHERE NOT EXISTS to avoid asyncpg AmbiguousParameterError
        for g in GRADES:
            for sec in SECTIONS:
                await conn.execute(text(
                    """insert into class_status (grade, section, result_status, updated_at)
                    values (:g, :s, CASE WHEN random()>0.5 THEN 'Published' ELSE 'Pending' END, now())
                    on conflict (grade, section) do nothing"""
                ), {"g": g, "s": sec})
        # Teachers
        for (g, sec), name in TEACHERS.items():
            await conn.execute(text(
                """insert into class_teachers (grade, section, teacher_name, updated_at)
                values (:g, :s, :name, now())
                on conflict (grade,section) do update set teacher_name=excluded.teacher_name, updated_at=now()"""
            ), {"g": g, "s": sec, "name": name})
        # ---------------- Classes-admin domain seeding (wings / school_classes / class_students) ----------------
        if include_classes_admin:
            # Single wing spanning all grades for simplicity
            await conn.execute(text(
                """insert into wings (academic_year, name, grade_start, grade_end, target_ratio, head)
                values (:ay, 'Main Wing', :gs, :ge, 30, 'Head Teacher')
                on conflict do nothing"""
            ), {"ay": ACADEMIC_YEAR, "gs": GRADES[0], "ge": GRADES[-1]})
            wing_id = (await conn.execute(text("select id from wings where academic_year=:ay and name='Main Wing'"), {"ay": ACADEMIC_YEAR})).scalar_one()
            # Create school classes
            for g in GRADES:
                for sec in SECTIONS:
                    tname = TEACHERS.get((g, sec))
                    await conn.execute(text(
                        """insert into school_classes (academic_year, wing_id, grade, section, teacher_name, target_ratio)
                        values (:ay, :wid, :grade, :sec, :tname, 30)
                        on conflict (academic_year, grade, section) do update set teacher_name=excluded.teacher_name"""
                    ), {"ay": ACADEMIC_YEAR, "wid": wing_id, "grade": g, "sec": sec, "tname": tname})
            # Map students to classes via class_students
            await conn.execute(text(
                """insert into class_students (class_id, student_id)
                select sc.id, s.id
                from students s
                join school_classes sc on sc.academic_year=:ay and sc.grade::text = s.class and sc.section = s.section
                on conflict do nothing"""
            ), {"ay": ACADEMIC_YEAR})
        # ---------------- Exam scores seeding ----------------
        if include_exam_scores:
            try:
                # two exam scores per student: older lower, newer higher to demonstrate averaging of latest
                await conn.execute(text(
                    """insert into exam_scores (student_id, exam_date, exam_type, total_marks, obtained_marks)
                    select id, :dold, 'term', 100, (random()*50)::int + 10 from students
                    on conflict do nothing"""
                ), {"dold": TODAY - timedelta(days=15)})
                await conn.execute(text(
                    """insert into exam_scores (student_id, exam_date, exam_type, total_marks, obtained_marks)
                    select id, :dnew, 'term', 100, (random()*40)::int + 50 from students
                    on conflict do nothing"""
                ), {"dnew": TODAY - timedelta(days=3)})
            except Exception as e:  # exam_scores may not exist in some environments
                print("[classes.seed] Skipping exam_scores seeding:", e)
    print("[classes.seed] Completed class domain seeding.")


def run():  # pragma: no cover
    asyncio.run(seed_classes())

if __name__ == "__main__":  # pragma: no cover
    run()
