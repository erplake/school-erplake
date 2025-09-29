"""Apply server defaults for updated_at on class tables if missing."""
from __future__ import annotations
import asyncio
from sqlalchemy import text
from app.core.db import engine

TARGETS = [
    ("class_status","updated_at"),
    ("class_teachers","updated_at"),
]

CHECK = """SELECT column_default FROM information_schema.columns WHERE table_name=:t AND column_name=:c"""

async def apply():
    async with engine.begin() as conn:
        for t,c in TARGETS:
            d = (await conn.execute(text(CHECK), {"t":t, "c":c})).scalar_one_or_none()
            if d and 'now()' in d.lower():
                print(f"[skip] {t}.{c} has default {d}")
            else:
                print(f"[alter] setting default for {t}.{c}")
                await conn.execute(text(f'ALTER TABLE {t} ALTER COLUMN {c} SET DEFAULT now()'))
    print("Done class updates.")

if __name__ == "__main__":
    asyncio.run(apply())
