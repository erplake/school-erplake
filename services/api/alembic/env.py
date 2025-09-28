import os
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
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

db_url = os.getenv('DATABASE_URL') or (
    f"postgresql://{os.getenv('POSTGRES_USER','school')}:{os.getenv('POSTGRES_PASSWORD','schoolpass')}@{os.getenv('POSTGRES_HOST','db')}:{os.getenv('POSTGRES_PORT','5432')}/{os.getenv('POSTGRES_DB','schooldb')}"
)

def run_migrations_offline():
    context.configure(url=db_url, literal_binds=True, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable: Engine = create_engine(db_url, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
