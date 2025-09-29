import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict
from prometheus_client import Counter, Histogram
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import async_session
from app.modules.comms.models import Outbox, OutboxStatus, Channel
from app.modules.comms.providers import (
    get_provider_for,
    TransientSendError,
    PermanentSendError,
)

log = logging.getLogger(__name__)

POLL_INTERVAL = 2.0
BATCH_SIZE = 25
MAX_ATTEMPTS = 5
BASE_BACKOFF = 3  # seconds

# Metrics
OUTBOX_ATTEMPTS = Counter('outbox_send_attempts_total', 'Total send attempts', ['channel'])
OUTBOX_SENT = Counter('outbox_sent_total', 'Messages successfully sent', ['channel'])
OUTBOX_FAILED = Counter('outbox_failed_total', 'Messages permanently failed', ['channel'])
OUTBOX_ERRORS = Counter('outbox_error_total', 'Send errors (will retry)', ['channel'])
OUTBOX_LATENCY = Histogram('outbox_send_latency_seconds', 'Latency of last successful send', ['channel'])


# Legacy simple senders removed in favor of provider abstraction (app.modules.comms.providers)


def _should_attempt(msg: Outbox) -> bool:
    if msg.status not in (OutboxStatus.PENDING, OutboxStatus.SENDING, OutboxStatus.ERROR):
        return False
    if msg.attempts == 0:
        return True
    # Exponential backoff with jitter (deterministic simple): base * 2^(attempts-1)
    delay = BASE_BACKOFF * (2 ** (msg.attempts - 1))
    next_time = (msg.sent_at or msg.created_at) + timedelta(seconds=delay)
    return datetime.now(timezone.utc) >= next_time


async def process_once():
    async with async_session() as session:  # type: AsyncSession
        result = await session.execute(
            select(Outbox).where(Outbox.status.in_([OutboxStatus.PENDING, OutboxStatus.ERROR])).limit(BATCH_SIZE)
        )
        rows = result.scalars().all()
        to_process = [m for m in rows if _should_attempt(m)]
        if not to_process:
            return 0
        processed = 0
        for msg in to_process:
            # Provider selection (channel based). Provider may inspect msg.provider field internally.
            try:
                provider = get_provider_for(msg)
            except KeyError:  # pragma: no cover
                msg.status = OutboxStatus.FAILED
                msg.last_error = 'No provider for channel'
                continue
            try:
                msg.status = OutboxStatus.SENDING
                start = datetime.now(timezone.utc)
                result = await provider.send(msg, session)
                msg.status = OutboxStatus.SENT
                msg.sent_at = datetime.now(timezone.utc)
                msg.last_error = None
                if result.provider:
                    msg.provider = result.provider
                if result.provider_message_id:
                    msg.provider_msg_id = result.provider_message_id
                duration = (msg.sent_at - start).total_seconds()
                OUTBOX_SENT.labels(msg.channel.name.lower()).inc()
                OUTBOX_LATENCY.labels(msg.channel.name.lower()).observe(duration)
            except TransientSendError as e:  # retryable
                msg.status = OutboxStatus.ERROR
                msg.last_error = str(e)[:500]
                OUTBOX_ERRORS.labels(msg.channel.name.lower()).inc()
            except PermanentSendError as e:
                msg.status = OutboxStatus.FAILED
                msg.last_error = str(e)[:500]
                OUTBOX_FAILED.labels(msg.channel.name.lower()).inc()
            except Exception as e:  # pragma: no cover unexpected
                msg.status = OutboxStatus.ERROR
                msg.last_error = f"Unexpected: {e}"[:500]
                OUTBOX_ERRORS.labels(msg.channel.name.lower()).inc()
            finally:
                msg.attempts += 1
                OUTBOX_ATTEMPTS.labels(msg.channel.name.lower()).inc()
                processed += 1
                if msg.status in (OutboxStatus.ERROR, OutboxStatus.SENDING) and msg.attempts >= MAX_ATTEMPTS:
                    msg.status = OutboxStatus.FAILED
                    if msg.last_error and 'max attempts' not in msg.last_error.lower():
                        msg.last_error = (msg.last_error or '') + ' (max attempts reached)'
                    OUTBOX_FAILED.labels(msg.channel.name.lower()).inc()
        await session.commit()
        return processed


async def run_forever():
    log.info("Outbox worker started")
    while True:
        try:
            processed = await process_once()
            if processed:
                log.info("Processed %d messages", processed)
            await asyncio.sleep(POLL_INTERVAL)
        except Exception:
            log.exception("Worker loop error")
            await asyncio.sleep(5)


if __name__ == '__main__':
    asyncio.run(run_forever())
