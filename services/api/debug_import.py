"""Helper script to diagnose why uvicorn is exiting.
Run:
  python debug_import.py
Outputs python version then attempts to import app.main, printing traceback on failure.
"""
import sys, traceback

print("Python:", sys.version)
try:
    import app.main  # noqa: F401
    print("IMPORT_OK - app.main imported successfully")
except Exception as e:  # pragma: no cover
    print("IMPORT_FAILED:", e)
    traceback.print_exc()
    sys.exit(1)
