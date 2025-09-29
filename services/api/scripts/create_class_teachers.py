"""Create class_teachers table manually if missing (because earlier dev_init_db failed before).
"""
from __future__ import annotations
import asyncio
from sqlalchemy import text
from app.core.db import engine

SQL = """
CREATE TABLE class_teachers (
    id SERIAL PRIMARY KEY,
    grade INTEGER NOT NULL,
    section VARCHAR NOT NULL,
    teacher_name VARCHAR NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_class_teacher_grade_section UNIQUE (grade, section)
);
"""

CHECK = "select 1 from information_schema.tables where table_schema='public' and table_name='class_teachers'"

async def main():
    async with engine.begin() as conn:
        exists = (await conn.execute(text(CHECK))).scalar_one_or_none()
        if exists:
            print("[skip] class_teachers already exists")
        else:
            print("[create] class_teachers")
            await conn.execute(text(SQL))
    print("Done.")

if __name__ == '__main__':
    asyncio.run(main())
