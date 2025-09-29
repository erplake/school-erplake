"""One-off helper to ensure server-side defaults exist on legacy tables.
Run with:  .venv\Scripts\python.exe scripts\apply_defaults.py
Idempotent: only alters if missing.
"""
from __future__ import annotations
import asyncio
from sqlalchemy import text
from app.core.db import engine

ALTERS = [
    ("student_tags", "created_at"),
    ("fee_invoices", "created_at"),
]

CHECK_SQL = """
SELECT column_default FROM information_schema.columns
WHERE table_name=:t AND column_name=:c
"""

async def ensure_defaults():
    async with engine.begin() as conn:
        for table, col in ALTERS:
            current = (await conn.execute(text(CHECK_SQL), {"t": table, "c": col})).scalar_one_or_none()
            if current and "now()" in current.lower():
                print(f"[skip] {table}.{col} already has default: {current}")
                continue
            print(f"[alter] Setting default now() on {table}.{col}")
            await conn.execute(text(f'ALTER TABLE {table} ALTER COLUMN {col} SET DEFAULT now()'))
    print("Done applying defaults.")

if __name__ == "__main__":
    asyncio.run(ensure_defaults())
