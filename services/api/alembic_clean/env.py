import os
import sys
from pathlib import Path
from logging.config import fileConfig
from sqlalchemy import create_engine, pool
from alembic import context

# Load root .env if present
try:
    from dotenv import load_dotenv  # type: ignore
    for candidate in [Path(__file__).resolve().parents[3] / '.env.local', Path(__file__).resolve().parents[3] / '.env']:
        if candidate.exists():
            load_dotenv(candidate, override=True)
            break
except Exception:
    pass

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Ensure services/api is on path so app modules can be imported if needed
api_root = Path(__file__).resolve().parents[1]
if str(api_root) not in sys.path:
    sys.path.insert(0, str(api_root))

host = os.getenv('POSTGRES_HOST', 'localhost')
db_url = os.getenv('DATABASE_URL') or (
    f"postgresql://{os.getenv('POSTGRES_USER','erplake')}:{os.getenv('POSTGRES_PASSWORD','erplake')}@{host}:{os.getenv('POSTGRES_PORT','5544')}/{os.getenv('POSTGRES_DB','schooldb')}"
)

def run_migrations_offline():
    context.configure(url=db_url, literal_binds=True, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    engine = create_engine(db_url, poolclass=pool.NullPool)
    with engine.connect() as connection:
        context.configure(connection=connection, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
