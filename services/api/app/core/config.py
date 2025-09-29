from pydantic import BaseModel
import os
from pathlib import Path

# Early load of .env.local / .env so that Settings picks them up even in one-off scripts
try:
    from dotenv import load_dotenv  # type: ignore
    root = Path(__file__).resolve().parents[4]
    for fname in [".env.local", ".env"]:
        fp = root / fname
        if fp.exists():
            load_dotenv(fp, override=False)
            break
except Exception:
    pass

class Settings(BaseModel):
    env: str = os.getenv("ENV", "dev")
    app_name: str = os.getenv("APP_NAME", "School ERPLake API")

    @property
    def postgres_dsn(self) -> str:
        # Resolve dynamically so tests that set env vars post-import still pick up correct DSN
        _is_pytest = os.getenv("PYTEST_CURRENT_TEST") is not None
        env = os.getenv("ENV", self.env)
        _want_test = env.startswith("test") or _is_pytest
        if _want_test and os.getenv("TEST_DATABASE_URL"):
            return os.getenv("TEST_DATABASE_URL")  # must include _test suffix by convention
        return (
            os.getenv("DATABASE_URL")
            or f"postgresql://{os.getenv('POSTGRES_USER','school')}:{os.getenv('POSTGRES_PASSWORD','schoolpass')}@{os.getenv('POSTGRES_HOST','db')}:{os.getenv('POSTGRES_PORT','5432')}/{os.getenv('POSTGRES_DB','schooldb')}"
        )
    jwt_secret: str = os.getenv("JWT_SECRET", "devsecret-change-me")
    rbac_enforce: bool = os.getenv("RBAC_ENFORCE", "false").lower() == "true"
    storage_driver: str = os.getenv("STORAGE_DRIVER", "local")
    local_storage_path: str = os.getenv("LOCAL_STORAGE_PATH", "var/storage")

settings = Settings()
