"""Seed attendance (today + last 3 days) and sample gallery images.

Assumptions:
 - Legacy attendance table: public.attendance_student (student_id -> public.students.id)
 - We only mark students that exist; statuses cycled for diversity.
 - Gallery requires files.blob rows; we create tiny placeholder blobs (text) if table exists.

Run: python -m app.seed_attendance_gallery
"""
from __future__ import annotations
import asyncio
from datetime import date, timedelta
from sqlalchemy import text
try:
    from app.core.db import engine  # type: ignore
except ModuleNotFoundError:
    # Allow running as: python app/seed_attendance_gallery.py from services/api directory
    import sys, os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent = os.path.dirname(current_dir)
    if parent not in sys.path:
        sys.path.append(parent)
    from app.core.db import engine  # retry

ATT_STATUSES = ['present','present','late','absent','excused']  # weighted variety

GALLERY_FILES = [
    ('class_fun1.jpg','image/jpeg',1234),
    ('experiment.jpg','image/jpeg',2048),
    ('project_poster.png','image/png',4096),
]

async def seed():
    async with engine.begin() as conn:
        # Ensure legacy attendance table exists
        await conn.execute(text("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='attendance_student') THEN
                CREATE TABLE public.attendance_student (
                    student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
                    date date NOT NULL,
                    status text NOT NULL CHECK (status IN ('present','absent','late','excused')),
                    PRIMARY KEY (student_id, date)
                );
            END IF;
        END $$;
        """))
        # Collect legacy students
        student_ids = [r[0] for r in (await conn.execute(text("SELECT id FROM students ORDER BY id"))).all()]
        if not student_ids:
            print('[seed_attendance_gallery] No legacy students found; run students seed first.')
            return

        today = date.today()
        days = [today - timedelta(days=i) for i in range(0,4)]  # today + last 3 days

        for d in days:
            for idx, sid in enumerate(student_ids):
                status = ATT_STATUSES[idx % len(ATT_STATUSES)]
                await conn.execute(text("""
                    INSERT INTO attendance_student (student_id, date, status)
                    VALUES (:sid,:dt,:st)
                    ON CONFLICT (student_id,date) DO UPDATE SET status=EXCLUDED.status
                """), {'sid': sid,'dt': d,'st': status})

        # Gallery seeding: need class_section ids
        class_rows = (await conn.execute(text("SELECT id FROM academics.class_section ORDER BY id LIMIT 3"))).all()
        if not class_rows:
            print('[seed_attendance_gallery] No class sections found; run core academics seed.')
            return
        class_ids = [r[0] for r in class_rows]

        # Ensure files.blob table exists (Alembic should have created; create if missing with correct columns)
        await conn.execute(text("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='files' AND table_name='blob') THEN
                CREATE TABLE files.blob (
                  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                  school_id BIGINT NOT NULL REFERENCES core.school(id) ON DELETE CASCADE,
                  storage_url TEXT NOT NULL,
                  mime_type TEXT,
                  bytes BIGINT,
                  checksum TEXT,
                  is_public BOOLEAN NOT NULL DEFAULT FALSE,
                  virus_scan TEXT,
                  created_by BIGINT REFERENCES core.user_account(id),
                  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
                );
            END IF;
        END $$;
        """))
        # Pick a school id
        school_id_row = await conn.execute(text("SELECT id FROM core.school ORDER BY id LIMIT 1"))
        school_id = school_id_row.scalar_one_or_none()
        if school_id is None:
            print('[seed_attendance_gallery] No school found; run core academics seed.')
            return

        gallery_exists = await conn.execute(text("""
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema='files' AND table_name='class_gallery_image'
        """))
        if gallery_exists.first() is None:
            print('[seed_attendance_gallery] Gallery table missing; skipping gallery image seeding (run migrations to enable).')
            print('[seed_attendance_gallery] Attendance seeding still completed.')
            return

        # Insert blobs + gallery rows; guard against duplicate original_filename per class by checking existing row
        for i, (fname, mime, size) in enumerate(GALLERY_FILES):
            class_id = class_ids[i % len(class_ids)]
            exists = await conn.execute(text("""
                SELECT 1 FROM files.class_gallery_image 
                WHERE class_section_id=:cls AND original_filename=:fname LIMIT 1
            """), {'cls': class_id, 'fname': fname})
            if exists.first():
                continue
            blob_ins = await conn.execute(text("""
                INSERT INTO files.blob (school_id, storage_url, mime_type, bytes, is_public)
                VALUES (:school, :url, :mime, :bytes, TRUE) RETURNING id
            """), {'school': school_id, 'url': f'seed://{fname}', 'mime': mime, 'bytes': size})
            blob_id = blob_ins.scalar_one()
            await conn.execute(text("""
                INSERT INTO files.class_gallery_image (class_section_id, blob_id, uploader_id, original_filename, mime_type, size_bytes, content_hash)
                VALUES (:cls,:blob,NULL,:fname,:mime,:size,NULL)
            """), {'cls': class_id,'blob': blob_id,'fname': fname,'mime': mime,'size': size})

    print('[seed_attendance_gallery] Attendance (4 days) and gallery samples seeded.')

def run():
    asyncio.run(seed())

if __name__ == '__main__':
    run()
