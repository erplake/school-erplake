"""Bootstrap (or restore) an EMPTY Postgres database to the current SQLAlchemy model state
and stamp the Alembic head revision. Optionally seed minimal reference data.

Intended usage:
    1. Target DB must be truly empty (no user tables & no alembic_version row).
    2. Runs Base.metadata.create_all() AFTER ensuring `public` schema exists & search_path set.
    3. Stamps Alembic head (does not replay historical migrations).
    4. (Optional) Runs minimal seed if --seed passed.

Safety:
    - Refuses to run if any tables already exist.
    - Refuses to run if database name does NOT look like a dev/local database unless --force provided.

Examples:
    python -m app.scripts.bootstrap_db
    python -m app.scripts.bootstrap_db --seed
    python -m app.scripts.bootstrap_db --force  (if you really know it's empty & safe)
"""
import asyncio
import os
import argparse
from sqlalchemy import text
from app.core.db import engine, Base
from alembic.config import Config
from alembic import command

ALLOWED_FORCE_DB_PREFIXES = ("schooldb", "erplake", "dev", "local")

async def ensure_empty_and_prep_schema():
    async with engine.begin() as conn:
        # Ensure public schema and search_path
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS public"))
        await conn.execute(text("SET search_path TO public"))
        has_version = (await conn.execute(text(
            "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='alembic_version' LIMIT 1"
        ))).scalar() is not None
        table_count = (await conn.execute(text(
            "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
        ))).scalar()
        return has_version, table_count

async def create_all():
    async with engine.begin() as conn:
        # search_path should already be set, but enforce again defensively
        await conn.execute(text("SET search_path TO public"))
        await conn.run_sync(Base.metadata.create_all)

async def seed_minimal():
    from . import seed_minimal as seed_module  # local import to avoid early engine usage
    await seed_module.seed()

async def main():
    parser = argparse.ArgumentParser(description="Bootstrap empty database to current model state")
    parser.add_argument('--seed', action='store_true', help='Run minimal seed after creating tables')
    parser.add_argument('--force', action='store_true', help='Bypass dev db name heuristic check')
    parser.add_argument('--drop-existing', action='store_true', help='Dangerous: DROP SCHEMA public CASCADE then recreate before bootstrap (dev only)')
    args = parser.parse_args()

    # Basic heuristic to prevent accidental prod restore
    dsn = os.getenv('DATABASE_URL') or ''
    lower_dsn = dsn.lower()
    if not args.force:
        # allow if any allowed prefix appears in db name segment
        # naive parse: split last path fragment
        dbname = lower_dsn.rsplit('/', 1)[-1].split('?')[0]
        if not any(dbname.startswith(p) for p in ALLOWED_FORCE_DB_PREFIXES):
            print(f"Refusing: database name '{dbname}' not recognized as dev/local. Use --force to override.")
            return 3

    has_version, table_count = await ensure_empty_and_prep_schema()
    if (has_version or table_count > 0) and not args.drop_existing:
        print(f"Refusing to bootstrap: has_version={has_version} table_count={table_count} (use --drop-existing to wipe)")
        return 2
    if args.drop_existing and (has_version or table_count > 0):
        async with engine.begin() as conn:
            print(f"[bootstrap] Dropping existing schema: tables={table_count} alembic_version_present={has_version}")
            await conn.execute(text("DROP SCHEMA public CASCADE"))
            await conn.execute(text("CREATE SCHEMA public"))
            await conn.execute(text("SET search_path TO public"))
        # Re-evaluate emptiness
        has_version, table_count = await ensure_empty_and_prep_schema()
        if has_version or table_count > 0:
            print("[bootstrap] ERROR: schema not empty after drop; aborting")
            return 4
    print("[bootstrap] Creating all tables from SQLAlchemy metadata...")
    await create_all()
    # Verify at least one expected table exists
    async with engine.begin() as conn:
        created_count = (await conn.execute(text(
            "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
        ))).scalar()
    if created_count == 0:
        print("[bootstrap] ERROR: No tables were created. Aborting before stamping.")
        return 5
    cfg = Config("alembic.ini")
    command.stamp(cfg, "head")
    print("[bootstrap] Stamped alembic head.")
    if args.seed:
        print("[bootstrap] Running minimal seed...")
        await seed_minimal()
    print("[bootstrap] Complete: tables=", created_count)
    return 0

if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
