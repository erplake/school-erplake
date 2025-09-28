from fastapi import FastAPI, Request, Response
from typing import Optional
import time
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from .core.logging import request_logging_middleware
from .modules.students.router import router as students_router
from .modules.attendance.router import router as attendance_router
from .modules.attendance.bulk_router import router as attendance_bulk_router
from .modules.fees.router import router as fees_router
from .modules.auth.router import router as auth_router
from .modules.chat.router import router as chat_router
from .modules.events.router import router as events_router
from .modules.social.router import router as social_router
from .modules.settings.router import router as settings_router

app = FastAPI(title="School ERPLake API")
app.middleware('http')(request_logging_middleware)

REQUEST_COUNT = Counter('api_requests_total', 'Total HTTP requests', ['method','path','status'])
REQUEST_LATENCY = Histogram('api_request_duration_seconds', 'Request latency seconds', ['method','path'])

@app.middleware('http')
async def metrics_middleware(request: Request, call_next):
    start = time.time()
    response: Optional[Response] = None
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

# Mount new modular routers
app.include_router(auth_router)
app.include_router(students_router)
app.include_router(attendance_router)
app.include_router(attendance_bulk_router)
app.include_router(fees_router)
app.include_router(chat_router)
app.include_router(events_router)
app.include_router(social_router)
app.include_router(settings_router)
