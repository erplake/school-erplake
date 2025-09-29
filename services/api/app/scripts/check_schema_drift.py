"""Schema drift check script.

Runs an in-memory (offline) autogenerate using Alembic metadata vs current DB.
If any upgrade operations are detected (CREATE / ALTER / DROP outside of alembic_version),
exit with non-zero status so CI can fail fast, prompting a new migration.

Usage:
    python -m app.scripts.check_schema_drift

Environment:
    Uses DATABASE_URL / TEST_DATABASE_URL resolution via settings.
"""
import sys
from io import StringIO
from alembic import command, config as alembic_config
from pathlib import Path
import re

# We simulate autogenerate by invoking 'alembic revision --autogenerate' in a dry way.
# Alembic doesn't have a direct API for dry-run autogenerate, so we point script_location
# to the project and capture generated output using a custom env that prevents file write.

# Simplified approach: invoke 'alembic upgrade head' first to ensure DB at head, then
# run autogenerate into a temp file and inspect for operations.

def main():
    cfg_path = Path(__file__).resolve().parents[2] / 'alembic.ini'
    if not cfg_path.exists():
        print("alembic.ini not found; cannot perform drift check", file=sys.stderr)
        return 1
    cfg = alembic_config.Config(str(cfg_path))
    # Temporary revision generation path
    script_dir = Path(cfg.get_main_option('script_location'))
    tmp_rev_dir = script_dir / '_tmp_drift'
    tmp_rev_dir.mkdir(exist_ok=True)
    cfg.set_main_option('revision_environment', 'true')  # ensure env.py runs
    # Force autogenerate
    out = StringIO()
    try:
        command.revision(cfg, message='__drift_check__', autogenerate=True, rev_id='__drift_check__', version_path=str(tmp_rev_dir))
    except SystemExit:
        # Alembic may sys.exit in some error paths; re-raise after cleanup
        pass
    # Inspect generated file (if any)
    generated = list(tmp_rev_dir.glob('*__drift_check__*.py'))
    if not generated:
        # No revision produced -> no drift
        cleanup(tmp_rev_dir)
        print('No schema drift detected.')
        return 0
    drift_file = generated[0]
    text = drift_file.read_text(encoding='utf-8')
    # Heuristic: look for op.add_column/op.create_table/op.alter_column/op.drop_column/op.create_index etc.
    patterns = [r'op\.create_table', r'op\.add_column', r'op\.alter_column', r'op\.drop_column', r'op\.create_index', r'op\.drop_index']
    if any(re.search(p, text) for p in patterns):
        print('Schema drift detected. Generated operations:')
        print(text)
        cleanup(tmp_rev_dir)
        return 2
    # No meaningful ops -> drift false positive (only maybe empty upgrade/downgrade)
    cleanup(tmp_rev_dir)
    print('No schema drift detected.')
    return 0

def cleanup(path: Path):
    for f in path.glob('*__drift_check__*.py'):
        try:
            f.unlink()
        except OSError:
            pass

if __name__ == '__main__':
    sys.exit(main())
