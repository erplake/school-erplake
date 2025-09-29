"""Comms provider abstraction layer.

Responsibilities:
 - Uniform interface (send()) for all channels/providers.
 - Credential lookup + decryption (lazy) using IntegrationCredential records.
 - Error classification (transient vs permanent) communicated via custom exceptions.
 - Lightweight provider selection via factory using Outbox row (channel + provider override).

Future extensions:
 - Add rate limiting, circuit breaker / health, bulk batching.
 - Provider-specific webhook signature helpers.
 - Template rendering (currently handled before enqueue).
"""
from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Optional, Any, Protocol

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from .models import Outbox, Channel
from app.modules.settings import config_models


class TransientSendError(Exception):
    """Indicates a retryable provider error (network timeout, 5xx, throttling)."""


class PermanentSendError(Exception):
    """Indicates a non-retryable error (validation, auth, configuration)."""


@dataclass
class ProviderResult:
    provider: str
    provider_message_id: Optional[str] = None
    raw: Optional[dict] = None


class Provider(Protocol):  # pragma: no cover - structural only
    async def send(self, msg: Outbox, session: AsyncSession) -> ProviderResult: ...


# --- Credential Loader ----------------------------------------------------
async def _load_credentials(session: AsyncSession, school_id: int, provider: str) -> dict:
    row = (
        await session.execute(
            select(config_models.IntegrationCredential).where(
                config_models.IntegrationCredential.school_id == school_id,
                config_models.IntegrationCredential.provider == provider,
            ).order_by(config_models.IntegrationCredential.id.desc())  # latest
        )
    ).scalars().first()
    if not row:
        raise PermanentSendError(f"No credentials configured for provider '{provider}'")
    try:
        return config_models.IntegrationCredential.decode_credentials(row.credentials_enc)
    except Exception as e:  # pragma: no cover (unexpected decode issue)
        raise PermanentSendError(f"Credential decode failed: {e}") from e


# --- Concrete Providers (stubs) ------------------------------------------
class EmailProvider:
    name = "email.default"

    async def send(self, msg: Outbox, session: AsyncSession) -> ProviderResult:  # pragma: no cover (simple stub)
        creds = await _load_credentials(session, msg.school_id, msg.provider or 'email')
        # Simulate network latency
        await asyncio.sleep(0)
        # Example failure simulation hook (disabled by default)
        if creds.get('force_error') == 'transient':
            raise TransientSendError('Simulated transient email failure')
        if creds.get('force_error') == 'permanent':
            raise PermanentSendError('Simulated permanent email failure')
        return ProviderResult(provider=self.name, provider_message_id="stub-email-id")


class SmsProvider:
    name = "sms.default"

    async def send(self, msg: Outbox, session: AsyncSession) -> ProviderResult:  # pragma: no cover
        creds = await _load_credentials(session, msg.school_id, msg.provider or 'sms')
        await asyncio.sleep(0)
        if creds.get('force_error') == 'transient':
            raise TransientSendError('Simulated transient sms failure')
        if creds.get('force_error') == 'permanent':
            raise PermanentSendError('Simulated permanent sms failure')
        return ProviderResult(provider=self.name, provider_message_id="stub-sms-id")


class WhatsAppProvider:
    name = "whatsapp.default"

    async def send(self, msg: Outbox, session: AsyncSession) -> ProviderResult:  # pragma: no cover
        creds = await _load_credentials(session, msg.school_id, msg.provider or 'whatsapp')
        await asyncio.sleep(0)
        if creds.get('force_error') == 'transient':
            raise TransientSendError('Simulated transient whatsapp failure')
        if creds.get('force_error') == 'permanent':
            raise PermanentSendError('Simulated permanent whatsapp failure')
        return ProviderResult(provider=self.name, provider_message_id="stub-wa-id")


class InAppProvider:
    """In-app messages might not need external credentials; treat as immediate success."""
    name = "inapp.local"

    async def send(self, msg: Outbox, session: AsyncSession) -> ProviderResult:  # pragma: no cover
        await asyncio.sleep(0)
        return ProviderResult(provider=self.name, provider_message_id=None)


_PROVIDER_REGISTRY: dict[Channel, Provider] = {
    Channel.EMAIL: EmailProvider(),
    Channel.SMS: SmsProvider(),
    Channel.WHATSAPP: WhatsAppProvider(),
    Channel.INAPP: InAppProvider(),
}


def get_provider_for(msg: Outbox) -> Provider:
    return _PROVIDER_REGISTRY[msg.channel]


__all__ = [
    'Provider', 'ProviderResult', 'TransientSendError', 'PermanentSendError',
    'get_provider_for'
]
