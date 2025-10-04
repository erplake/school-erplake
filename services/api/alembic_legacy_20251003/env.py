import os
import sys
from pathlib import Path
try:
    from dotenv import load_dotenv  # type: ignore
    # Attempt to load root .env.local or .env for local development convenience
    for candidate in [Path(__file__).resolve().parents[3] / '.env.local', Path(__file__).resolve().parents[3] / '.env']:
        if candidate.exists():
            load_dotenv(candidate, override=True)
            break
except Exception:
    pass
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Engine
from sqlalchemy import create_engine
from alembic import context

# Interpret the config file for Python logging.
config = context.config

# --- Ensure 'app' package is importable (add services/api root to sys.path) ---
try:
    api_root = Path(__file__).resolve().parents[1]  # .../services/api
    if str(api_root) not in sys.path:
        sys.path.insert(0, str(api_root))
except Exception as _e:  # non-fatal
    print(f"[alembic env] path injection warning: {_e}")
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

host = os.getenv('POSTGRES_HOST', 'db')
# Allow easy local override if docker network not up
if host == 'db' and os.getenv('LOCAL_DEV', '0') in ('1','true','True'):
    host = '127.0.0.1'
db_url = os.getenv('DATABASE_URL') or (
    f"postgresql://{os.getenv('POSTGRES_USER','school')}:{os.getenv('POSTGRES_PASSWORD','schoolpass')}@{host}:{os.getenv('POSTGRES_PORT','5432')}/{os.getenv('POSTGRES_DB','schooldb')}"
)

def run_migrations_offline():
    context.configure(url=db_url, literal_binds=True, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable: Engine = create_engine(db_url, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        # Run preamble SQL in autonomous short transactions so a privilege error does not poison the main migration tx.
        for stmt, label in [
            ("CREATE SCHEMA IF NOT EXISTS public", "public schema create"),
            ("SET search_path TO public, core, academics, fees", "search_path set")
        ]:
            try:
                # Each exec is autocommit in SQLAlchemy 2 style if outside explicit transaction block
                connection.exec_driver_sql(stmt)
            except Exception as e:
                print(f"[alembic env] Note: {label} skipped ({e})")
                # rollback just in case driver opened a transaction implicitly
                try:
                    connection.rollback()
                except Exception:
                    pass
        context.configure(connection=connection, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
