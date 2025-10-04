"""Utility to force-set alembic_version to the new single-lineage baseline.

Usage (from services/api directory):
    python scripts/set_alembic_baseline.py 20251002_2100_baseline
If no revision is supplied it defaults to 20251002_2100_baseline.
"""
from __future__ import annotations
import os
import sys
from typing import Optional

REV_DEFAULT = "20251002_2100_baseline"

def get_db_url() -> str:
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        return db_url
    host = os.getenv('POSTGRES_HOST', 'localhost')
    user = os.getenv('POSTGRES_USER','erplake')
    pw = os.getenv('POSTGRES_PASSWORD','erplake')
    port = os.getenv('POSTGRES_PORT','5544')
    db = os.getenv('POSTGRES_DB','schooldb')
    return f"postgresql://{user}:{pw}@{host}:{port}/{db}"

def main():
    rev: str = sys.argv[1] if len(sys.argv) > 1 else REV_DEFAULT
    url = get_db_url()
    # Use SQLAlchemy core only to avoid full ORM dependency here.
    try:
        import sqlalchemy as sa  # type: ignore
    except ImportError as e:
        print("sqlalchemy not installed in environment", e, file=sys.stderr)
        sys.exit(1)
    engine = sa.create_engine(url, future=True, isolation_level="AUTOCOMMIT")
    with engine.connect() as conn:
        # Ensure table exists (some earlier states lacked it)
        conn.exec_driver_sql("""
        CREATE TABLE IF NOT EXISTS alembic_version (
            version_num VARCHAR(32) NOT NULL
        )""")
        conn.exec_driver_sql("DELETE FROM alembic_version")
        # Basic safety: expected chars (alphanumeric underscore only, length <= 32 per Alembic default)
        import re
        if not re.fullmatch(r"[A-Za-z0-9_]{1,64}", rev):  # allow slightly longer but we know our value size
            print(f"Refusing to set suspicious revision value: {rev}", file=sys.stderr)
            sys.exit(2)
        # Inline literal (safe after validation) to avoid driver param style differences
        conn.exec_driver_sql(f"INSERT INTO alembic_version(version_num) VALUES ('{rev}')")
        row = conn.exec_driver_sql("SELECT version_num FROM alembic_version").fetchone()
    print(f"alembic_version set to: {row[0] if row else '<<missing>>'}")

if __name__ == "__main__":
    main()
