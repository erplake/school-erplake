# Migration Reset (2025-10-03)

We introduced a cleaned, linear Alembic migration lineage under `alembic_clean/` to replace the previously branched / duplicated history in `alembic/`.

## Why
The original `alembic/` directory accumulated branching heads and long revision identifiers (>32 chars) that conflicted with the database `alembic_version.version_num` column length. This caused upgrade failures and 500 errors at runtime (schema mismatch: integer grade columns, missing head_mistress table, etc.).

## What Changed
- New linear chain (baseline forward):
  1. `20251002_2100_baseline`
  2. `20251002_2200_classroom`
  3. `20251002_2300_class_staff`
  4. `20251002_2400_brand_settings`
  5. `20251003_0001_grade_text` (grades to TEXT)
  6. `20251003_0010_heads_cls_sets` (head_mistress + head_id + storage_path + meet_link)
- Legacy directory renamed to `alembic_legacy_20251003/` (archival only—do not run).
- Database was manually patched (safe ALTER/CREATE) before stamping the final revision due to in-flight transactional errors; new environments will not need manual patching—`alembic upgrade head` is sufficient.

## Running Migrations Now
Ensure `DATABASE_URL` env var is set, then run from `services/api`:

```powershell
python -m alembic -c alembic.ini upgrade head
```

The `alembic.ini` already points to `alembic_clean` via `script_location`.

## Adding Future Migrations
Use the standard Alembic revision command (autogenerate optional):

```powershell
alembic -c alembic.ini revision -m "describe change"
# edit file in alembic_clean/versions/
alembic -c alembic.ini upgrade head
```

Keep revision IDs short (<=32 chars). Suggested pattern: `YYYYMMDD_HHMM_short_topic`.

## If You Need the Old State
Refer to `alembic_legacy_20251003/`. Do not mix files from legacy into the clean chain.

## Verifying Schema Drift
Optional script: `app/scripts/check_schema_drift.py` (extend to assert expected columns).

## Disaster Recovery
If a migration partially applies:
1. Inspect: `SELECT * FROM alembic_version;`
2. Manually repair schema tables/columns.
3. Stamp: `UPDATE alembic_version SET version_num='LATEST_REV_ID';`

## Contact / Ownership
Migration reset performed on 2025-10-03. Document authored same day.
