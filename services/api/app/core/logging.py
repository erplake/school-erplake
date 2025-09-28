import logging, sys, time, uuid, os, json
from fastapi import Request

LOG_FORMAT = os.getenv('LOG_FORMAT', 'plain')  # 'plain' | 'json'

logger = logging.getLogger("api")
handler = logging.StreamHandler(sys.stdout)

if LOG_FORMAT == 'json':
    class JsonFormatter(logging.Formatter):
        def format(self, record: logging.LogRecord):
            base = {
                'ts': self.formatTime(record, '%Y-%m-%dT%H:%M:%S'),
                'level': record.levelname,
                'msg': record.getMessage(),
                'logger': record.name,
            }
            if record.exc_info:
                base['exc_info'] = self.formatException(record.exc_info)
            return json.dumps(base, ensure_ascii=False)
    formatter = JsonFormatter()
else:
    formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')

handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

async def request_logging_middleware(request: Request, call_next):
    rid = str(uuid.uuid4())
    start = time.time()
    request.state.request_id = rid
    logger.info(f"rid={rid} path={request.url.path} start")
    try:
        response = await call_next(request)
    except Exception as e:
        logger.exception(f"rid={rid} error={e}")
        raise
    dur = int((time.time() - start) * 1000)
    logger.info(f"rid={rid} path={request.url.path} status={response.status_code} dur_ms={dur}")
    response.headers["X-Request-ID"] = rid
    return response
