"""Backfill normalization tables from legacy denormalized student columns.

Idempotent: skips inserting duplicates.
Run after migrations:

    (. .venv/Scripts/Activate.ps1 on Windows)
    python -m scripts.backfill_students

Environment: uses DATABASE_URL as in application.
"""
from __future__ import annotations
import os
from datetime import datetime
from sqlalchemy import create_engine, text

DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    raise SystemExit("DATABASE_URL not set")

e = create_engine(DB_URL, future=True)

def backfill_tags(conn):
    sql = text(
        """
        INSERT INTO student_tags (student_id, tag, created_at)
        SELECT id, trim(val) AS tag, now()
        FROM (
            SELECT id, unnest(string_to_array(tags, ',')) AS val
            FROM students
            WHERE tags IS NOT NULL AND tags <> ''
        ) s
        WHERE trim(val) <> ''
        AND NOT EXISTS (
            SELECT 1 FROM student_tags st WHERE st.student_id = s.id AND st.tag = trim(val)
        );
        """
    )
    result = conn.execute(sql)
    return result.rowcount if result.rowcount is not None else 0

def backfill_transport(conn):
    # Only insert if no active transport row exists yet
    sql = text(
        """
        INSERT INTO student_transport (student_id, route, stop, active, updated_at)
        SELECT id,
               transport->>'route' AS route,
               transport->>'stop' AS stop,
               1,
               now()
        FROM students s
        WHERE transport IS NOT NULL
          AND transport->>'route' IS NOT NULL
          AND transport->>'stop' IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM student_transport t WHERE t.student_id = s.id AND t.active = 1
          );
        """
    )
    result = conn.execute(sql)
    return result.rowcount if result.rowcount is not None else 0

def backfill_fee_invoices(conn):
    # Create a synthetic open invoice if fee_due_amount > 0 and no invoice rows
    sql = text(
        """
        INSERT INTO fee_invoices (student_id, amount, paid_amount, due_date, created_at)
        SELECT id, fee_due_amount, 0, NULL, now()
        FROM students s
        WHERE fee_due_amount IS NOT NULL AND fee_due_amount > 0
          AND NOT EXISTS (SELECT 1 FROM fee_invoices f WHERE f.student_id = s.id);
        """
    )
    result = conn.execute(sql)
    return result.rowcount if result.rowcount is not None else 0

def main():
    with e.begin() as conn:
        inserted_tags = backfill_tags(conn)
        inserted_transport = backfill_transport(conn)
        inserted_invoices = backfill_fee_invoices(conn)
    print(f"Backfill complete: tags={inserted_tags}, transport={inserted_transport}, invoices={inserted_invoices}")

if __name__ == "__main__":
    main()
