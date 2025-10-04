"""Schema validation utility.

Checks presence & basic shape of required tables/columns used by the API/frontend.
Exit code 0 if all required constraints satisfied, else 1.

Usage:
  python scripts/validate_schema.py [--dsn postgresql://user:pass@host:port/db]

Idempotent / read-only.
"""
from __future__ import annotations
import argparse
import sys
import textwrap
from typing import Dict, List, Tuple

import sqlalchemy as sa

REQUIRED_TABLE_COLUMNS: Dict[str, List[str]] = {
    "wings": ["id", "academic_year", "name", "grade_start", "grade_end", "head_id"],
    "school_classes": [
        "id",
        "academic_year",
        "wing_id",
        "grade",
        "section",
        "storage_path",
        "meet_link",
    ],
    "staff": [
        "id",
        "name",
        "staff_code",
        "role",
        "status",
        "attendance_30",
        "leave_balance",
    ],
    "staff_leave_requests": [
        "id",
        "staff_id",
        "start_date",
        "end_date",
        "status",
    ],
    "head_mistress": ["id", "name", "active"],
}


def fetch_columns(conn, table: str) -> List[str]:
    rows = conn.execute(
        sa.text(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema='public' AND table_name=:t
            ORDER BY ordinal_position
            """
        ),
        {"t": table},
    ).fetchall()
    return [r[0] for r in rows]


def validate(dsn: str) -> int:
    engine = sa.create_engine(dsn, future=True)
    missing_tables: List[str] = []
    missing_columns: List[Tuple[str, List[str]]] = []
    with engine.begin() as conn:
        existing_tables = {
            r[0]
            for r in conn.execute(
                sa.text(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
                )
            ).fetchall()
        }
        for table, required_cols in REQUIRED_TABLE_COLUMNS.items():
            if table not in existing_tables:
                missing_tables.append(table)
                continue
            cols = fetch_columns(conn, table)
            missing = [c for c in required_cols if c not in cols]
            if missing:
                missing_columns.append((table, missing))

    if not missing_tables and not missing_columns:
        print("[schema] OK - all required tables/columns present")
        return 0

    if missing_tables:
        print("[schema] Missing tables:")
        for t in missing_tables:
            print(f"  - {t}")
    if missing_columns:
        print("[schema] Missing columns:")
        for t, cols in missing_columns:
            print(f"  - {t}: {', '.join(cols)}")
    return 1


def parse_args(argv: List[str]):
    ap = argparse.ArgumentParser(
        description="Validate presence of critical schema objects.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=textwrap.dedent(
            """Examples:\n  python scripts/validate_schema.py --dsn postgresql://user:pass@localhost:5544/schooldb"""
        ),
    )
    ap.add_argument(
        "--dsn",
        default="postgresql://erplake:erplake@localhost:5544/schooldb",
        help="PostgreSQL DSN",
    )
    return ap.parse_args(argv)


def main(argv: List[str]):
    args = parse_args(argv)
    code = validate(args.dsn)
    sys.exit(code)


if __name__ == "__main__":  # pragma: no cover
    main(sys.argv[1:])
