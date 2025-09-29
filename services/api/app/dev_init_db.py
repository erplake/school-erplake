"""Development helper to create any missing tables for newly added modules.
Safe to run multiple times. Will only create tables that don't yet exist.
"""
from __future__ import annotations
import asyncio
from sqlalchemy import inspect
from app.core.db import engine, Base

# Import model modules so SQLAlchemy registers them with the Base metadata
# Add new model modules here as you build out features.
from app.modules.classes import models as class_models  # noqa: F401
from app.modules.students import models as student_models  # noqa: F401
from app.modules.students import models_extra as student_models_extra  # noqa: F401
from app.modules.fees import models as fee_models  # noqa: F401
from app.modules.events import models as event_models  # noqa: F401
from app.modules.transport import models as transport_models  # noqa: F401
from app.modules.staff import models as staff_models  # noqa: F401
from app.modules.leaves import models as leaves_models  # noqa: F401
from app.modules.settings import models as settings_models  # noqa: F401
from app.modules.settings import integration_models as settings_integration_models  # noqa: F401
# NOTE: legacy_models omitted here due to legacy pattern; not required for new classroom tables


async def main():
    async with engine.begin() as conn:
        # Use run_sync so synchronous inspector work happens in proper greenlet
        def _get_existing(sync_conn):
            ins = inspect(sync_conn)
            return set(ins.get_table_names())

        existing = await conn.run_sync(_get_existing)
        metadata = Base.metadata
        wanted = {t.name for t in metadata.sorted_tables}
        missing = wanted - existing
        if not missing:
            print("All tables already exist (no-op)")
            return
        print(f"Creating missing tables: {', '.join(sorted(missing))}")
        # Create each missing table explicitly to avoid touching others
        def _create_table(sync_conn, table):  # type: ignore[unused-ignore]
            table.create(sync_conn, checkfirst=True)
        for tbl in metadata.sorted_tables:
            if tbl.name in missing:
                await conn.run_sync(_create_table, tbl)
        print("Done.")

if __name__ == "__main__":
    asyncio.run(main())
