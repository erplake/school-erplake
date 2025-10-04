from fastapi import FastAPI, Request, Response, Depends, HTTPException, APIRouter
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import time
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from .core.logging import request_logging_middleware
import logging, traceback, os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_session
from app.core.tenant import AuditLog, get_tenant_context, TenantContext
from app.core.security import CurrentUser, get_current_user, require
import uuid
from .modules.students.router import router as students_router
from .modules.attendance.router import router as attendance_router
from .modules.attendance.bulk_router import router as attendance_bulk_router
from .modules.fees.router import router as fees_router
from .modules.auth.router import router as auth_router
from .modules.chat.router import router as chat_router
from .modules.events.router import router as events_router
from .modules.social.router import router as social_router
from .modules.settings.router import router as settings_router
from .modules.admissions.router import router as admissions_router
from .modules.leaves.router import router as leaves_router
from .modules.classes.router import router as classes_router
from .modules.classes.router_headmistress import router as head_mistress_router
from .modules.classes.router_wings import router_wings, router_classes_admin
from .modules.staff.router import router as staff_router
from .modules.transport.router import router as transport_router
from .modules.ops.router import router as ops_router
from .modules.files.router import router as files_router
from .modules.comms.router import router as comms_router
from .modules.payments.router import router as payments_router
from .modules.gallery.router import router as gallery_router
from .modules.teacher.router import router as teacher_router
from sqlalchemy import text
from .core.db import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Former startup logic
    from .core.config import settings as _settings
    if not _settings.env.startswith('test'):
        async with engine.begin() as conn:
            from sqlalchemy import text as _text
            table_count = (await conn.execute(_text("""
                SELECT count(*) FROM information_schema.tables
                WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name <> 'alembic_version'
            """))).scalar()
            version_present = False
            try:
                version_present = (await conn.execute(_text("SELECT 1 FROM alembic_version LIMIT 1"))).first() is not None
            except Exception:
                version_present = False
        if table_count == 0 and not version_present:
            raise RuntimeError("Database appears empty and unmigrated (no tables, no alembic_version). Run bootstrap or alembic upgrade before starting API.")
    yield
    # (Optional future shutdown cleanup)

app = FastAPI(title="School ERPLake API", lifespan=lifespan)
logger = logging.getLogger("erplake.api")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s %(levelname)s %(name)s %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
API_DEBUG = os.getenv('API_DEBUG', '').lower() in ('1','true','yes','on')
logger.setLevel(logging.DEBUG if API_DEBUG else logging.INFO)
app.middleware('http')(request_logging_middleware)

if API_DEBUG:
    @app.middleware('http')
    async def exception_debug_middleware(request: Request, call_next):
        try:
            return await call_next(request)
        except Exception as e:
            tb = ''.join(traceback.format_exception(type(e), e, e.__traceback__))
            logger.error("Unhandled exception path=%s method=%s %s", request.url.path, request.method, tb)
            raise

# CORS configuration to allow frontend dev server
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REQUEST_COUNT = Counter('api_requests_total', 'Total HTTP requests', ['method','path','status'])
REQUEST_LATENCY = Histogram('api_request_duration_seconds', 'Request latency seconds', ['method','path'])
REQUEST_ID_HEADER = 'X-Request-ID'

@app.middleware('http')
async def metrics_middleware(request: Request, call_next):
    start = time.time()
    response: Optional[Response] = None
    # Attach a request id
    req_id = request.headers.get(REQUEST_ID_HEADER) or str(uuid.uuid4())
    request.state.request_id = req_id
    try:
        response = await call_next(request)
        return response
    finally:
        path = request.url.path
        # Avoid high cardinality: collapse dynamic numeric IDs
        norm_path = '/'.join(['{id}' if p.isdigit() else p for p in path.split('/') if p]) or '/'
        duration = time.time() - start
        status = getattr(response, 'status_code', 500)
        REQUEST_COUNT.labels(request.method, norm_path, status).inc()
        REQUEST_LATENCY.labels(request.method, norm_path).observe(duration)

@app.get('/metrics')
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get('/healthz')
async def healthz():
    return {'ok': True}


from typing import Optional

api_router = APIRouter(prefix="/api")

@api_router.get('/healthz')
async def api_health_alias():
    return {'ok': True}

if API_DEBUG:
    @api_router.get('/debug/fail')
    async def debug_fail():
        raise RuntimeError("Intentional debug failure for logging verification")

@api_router.get('/ops/audit', dependencies=[Depends(require('ops:audit_read'))])
async def list_audit(action: Optional[str] = None, object_type: Optional[str] = None, limit: int = 50, session: AsyncSession = Depends(get_session)):
    q = select(AuditLog).order_by(AuditLog.id.desc()).limit(min(limit, 200))
    if action:
        q = q.filter(AuditLog.action==action)
    if object_type:
        q = q.filter(AuditLog.object_type==object_type)
    rows = (await session.execute(q)).scalars().all()
    return [
        {
            'id': r.id,
            'at': r.created_at,
            'action': r.action,
            'object_type': r.object_type,
            'object_id': r.object_id,
            'verb': r.verb,
            'user_id': r.user_id,
            'school_id': r.school_id,
            'request_id': r.request_id
        } for r in rows
    ]

"""Mount all routers under /api prefix for consistent frontend proxying."""
api_router.include_router(auth_router)
api_router.include_router(students_router)
api_router.include_router(attendance_router)
api_router.include_router(attendance_bulk_router)
api_router.include_router(fees_router)
api_router.include_router(chat_router)
api_router.include_router(events_router)
api_router.include_router(social_router)
api_router.include_router(settings_router)
api_router.include_router(admissions_router)
api_router.include_router(leaves_router)
api_router.include_router(classes_router)
api_router.include_router(router_wings)
api_router.include_router(router_classes_admin)
api_router.include_router(head_mistress_router)
api_router.include_router(staff_router)
api_router.include_router(transport_router)
api_router.include_router(ops_router)
api_router.include_router(files_router)
api_router.include_router(comms_router)
api_router.include_router(payments_router)
api_router.include_router(gallery_router)
api_router.include_router(teacher_router)

app.include_router(api_router)

## Startup event replaced by lifespan context above.
