"""Legacy monolithic app preserved temporarily.

All functionality is being migrated into modular structure under app/.
This file now simply re-exports the new FastAPI instance so existing
Dockerfile / entrypoints keep working until updated.
"""

from app.main import app  # type: ignore

# Backward compatibility note: endpoints for attendance, fees still pending migration
# and will be re-added as modules. Existing routes for students now reside in modules/students/router.py.

