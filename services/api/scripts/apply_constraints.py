"""Add missing unique constraints that weren't in initial table creation.
Currently adds uq_student_tag_unique on (student_id, tag) if absent.
Run: .venv\Scripts\python.exe scripts\apply_constraints.py
"""
from __future__ import annotations
import asyncio
from sqlalchemy import text
from app.core.db import engine

CHECK = """
SELECT 1 FROM pg_constraint WHERE conname=:name
"""

async def ensure_constraints():
    async with engine.begin() as conn:
        exists = (await conn.execute(text(CHECK), {"name": "uq_student_tag_unique"})).scalar_one_or_none()
        if exists:
            print("[skip] uq_student_tag_unique already present")
        else:
            print("[add] Adding uq_student_tag_unique")
            await conn.execute(text("ALTER TABLE student_tags ADD CONSTRAINT uq_student_tag_unique UNIQUE (student_id, tag)"))
    print("Done constraints.")

if __name__ == "__main__":
    asyncio.run(ensure_constraints())
