from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Optional
from app.core.db import get_session
from app.core.tenant import get_tenant_context, TenantContext
from . import models, schemas
from datetime import date as _date
from sqlalchemy import func

router = APIRouter(prefix='/payments', tags=['payments'])

@router.post('/pg', response_model=schemas.PgTransactionOut)
async def create_pg_transaction(payload: schemas.PgTransactionCreate, session: AsyncSession = Depends(get_session), tenant: TenantContext = Depends(get_tenant_context)):
    rec = models.PgTransaction(
        school_id=tenant.school_id,
        provider=payload.provider,
        amount=payload.amount,
        currency=payload.currency,
        order_id=payload.order_id,
        payment_id=payload.payment_id,
        refund_id=payload.refund_id,
        invoice_id=payload.invoice_id,
        raw=payload.raw or {}
    )
    session.add(rec)
    await session.commit()
    await session.refresh(rec)
    return rec

@router.get('/pg/{tx_id}', response_model=schemas.PgTransactionOut)
async def get_pg_transaction(tx_id: int, session: AsyncSession = Depends(get_session)):
    rec = await session.get(models.PgTransaction, tx_id)
    if not rec:
        raise HTTPException(404, 'Not found')
    return rec

@router.post('/recon', response_model=schemas.ReconEntryOut)
async def create_recon_entry(payload: schemas.ReconEntryCreate, session: AsyncSession = Depends(get_session), tenant: TenantContext = Depends(get_tenant_context)):
    tx = await session.get(models.PgTransaction, payload.pg_transaction_id)
    if not tx:
        raise HTTPException(400, 'pg_transaction not found')
    entry = models.ReconLedger(
        pg_transaction_id=payload.pg_transaction_id,
        invoice_id=payload.invoice_id,
        step=payload.step,
        delta=payload.delta,
        note=payload.note
    )
    session.add(entry)
    await session.commit()
    await session.refresh(entry)
    return entry

@router.get('/recon/{entry_id}', response_model=schemas.ReconEntryOut)
async def get_recon_entry(entry_id: int, session: AsyncSession = Depends(get_session)):
    rec = await session.get(models.ReconLedger, entry_id)
    if not rec:
        raise HTTPException(404, 'Not found')
    return rec


STATUS_MAP = {
    # provider neutral fragments
    'payment_intent.succeeded': 'CAPTURED',
    'payment.captured': 'CAPTURED',
    'payment.authorized': 'AUTHORIZED',
    'payment_intent.payment_failed': 'FAILED',
    'refund.processed': 'REFUNDED',
    'refund.succeeded': 'REFUNDED',
}

def _derive_status_from_events(event_type: str, raw: dict) -> Optional[str]:
    et = event_type.lower()
    if et in STATUS_MAP:
        return STATUS_MAP[et]
    # fallback fragment search
    for frag, status in STATUS_MAP.items():
        if frag in et:
            return status
    stat = (raw.get('status') or '').lower()
    if stat in ('succeeded','captured'):
        return 'CAPTURED'
    if stat in ('authorized','auth'):
        return 'AUTHORIZED'
    if stat.startswith('fail'):
        return 'FAILED'
    if stat.startswith('refund') or 'refund' in et:
        return 'REFUNDED'
    return None

@router.post('/webhook/event', response_model=schemas.PaymentEventOut)
async def ingest_payment_event(payload: schemas.PaymentEventIn, session: AsyncSession = Depends(get_session), tenant: TenantContext = Depends(get_tenant_context)):
    # Idempotency on (school, provider, event_id)
    existing = await session.execute(select(models.PaymentEvent).where(
        models.PaymentEvent.school_id==tenant.school_id,
        models.PaymentEvent.provider==payload.provider,
        models.PaymentEvent.event_id==payload.event_id
    ))
    existing_obj = existing.scalar_one_or_none()
    if existing_obj:
        return existing_obj

    # Attempt to resolve related pg_transaction
    tx = None
    if payload.payment_id:
        tx = await session.execute(select(models.PgTransaction).where(models.PgTransaction.payment_id==payload.payment_id))
        tx = tx.scalar_one_or_none()
    if not tx and payload.order_id:
        tx = await session.execute(select(models.PgTransaction).where(models.PgTransaction.order_id==payload.order_id))
        tx = tx.scalar_one_or_none()

    status = _derive_status_from_events(payload.event_type, payload.raw)
    event = models.PaymentEvent(
        school_id=tenant.school_id,
        provider=payload.provider,
        event_id=payload.event_id,
        event_type=payload.event_type,
        pg_transaction_id=tx.id if tx else None,
        status_derived=status,
        raw=payload.raw
    )
    session.add(event)
    # If we derived a new status & have a linked transaction, update it if progression.
    if tx and status:
        # naive progression guard: update if different
        await session.execute(update(models.PgTransaction).where(models.PgTransaction.id==tx.id).values(status=status))
    await session.commit()
    await session.refresh(event)
    return event


@router.get('/settlements', response_model=list[schemas.SettlementSummaryOut])
async def get_settlement(provider: Optional[str] = None, day: Optional[str] = None, session: AsyncSession = Depends(get_session), tenant: TenantContext = Depends(get_tenant_context)):
    # Parse day
    target_day = None
    if day:
        try:
            target_day = _date.fromisoformat(day)
        except ValueError:
            raise HTTPException(400, 'Invalid day format, expected YYYY-MM-DD')
    q = select(models.SettlementSummary).where(models.SettlementSummary.school_id==tenant.school_id)
    if provider:
        q = q.where(models.SettlementSummary.provider==provider)
    if target_day:
        q = q.where(models.SettlementSummary.settlement_date==target_day)
    rows = (await session.execute(q)).scalars().all()
    if target_day and provider and not rows:
        # On-demand compute
        agg = await session.execute(
            select(
                func.coalesce(func.sum(models.PgTransaction.amount),0),
                func.coalesce(func.sum(models.PgTransaction.fee),0),
                func.coalesce(func.sum(models.PgTransaction.amount).filter(models.PgTransaction.status=='REFUNDED'),0),
                func.count(models.PgTransaction.id),
            ).where(
                models.PgTransaction.school_id==tenant.school_id,
                models.PgTransaction.provider==provider,
                func.date(models.PgTransaction.created_at)==target_day
            )
        )
        gross, fees, refunds, tx_count = agg.first() or (0,0,0,0)
        refund_count = 0  # placeholder (could count refund rows separately if modeled)
        net = (gross or 0) - (fees or 0) - (refunds or 0)
        summary = models.SettlementSummary(
            school_id=tenant.school_id,
            provider=provider,
            settlement_date=target_day,
            currency='INR',
            gross_amount=gross or 0,
            fees_amount=fees or 0,
            refunds_amount=refunds or 0,
            net_amount=net or 0,
            tx_count=tx_count or 0,
            refund_count=refund_count
        )
        session.add(summary)
        await session.commit()
        await session.refresh(summary)
        rows = [summary]
    return rows
