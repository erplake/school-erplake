from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_session
from app.core.tenant import get_tenant_context, TenantContext
from . import models, schemas

router = APIRouter(prefix='/comms', tags=['comms'])

@router.post('/templates', response_model=schemas.TemplateOut)
async def create_template(payload: schemas.TemplateCreate, session: AsyncSession = Depends(get_session), tenant: TenantContext = Depends(get_tenant_context)):
    rec = models.MessageTemplate(school_id=tenant.school_id, name=payload.name, channel=payload.channel, body=payload.body)
    session.add(rec)
    await session.commit()
    await session.refresh(rec)
    return rec

@router.get('/templates', response_model=list[schemas.TemplateOut])
async def list_templates(session: AsyncSession = Depends(get_session)):
    rows = (await session.execute(select(models.MessageTemplate))).scalars().all()
    return rows

@router.post('/outbox', response_model=schemas.OutboxOut)
async def enqueue_message(payload: schemas.OutboxEnqueue, session: AsyncSession = Depends(get_session), tenant: TenantContext = Depends(get_tenant_context)):
    if not payload.body and not payload.template_id:
        raise HTTPException(400, 'Provide body or template_id')
    template_body = None
    if payload.template_id:
        tmpl = await session.get(models.MessageTemplate, payload.template_id)
        if not tmpl:
            raise HTTPException(404, 'Template not found')
        template_body = tmpl.body
    body = payload.body or template_body
    rec = models.Outbox(
        school_id=tenant.school_id,
        channel=payload.channel,
        to_address=payload.to_address,
        subject=payload.subject,
        body=body,
        template_id=payload.template_id,
        scheduled_at=payload.scheduled_at
    )
    session.add(rec)
    await session.commit()
    await session.refresh(rec)
    return rec

@router.get('/outbox/{outbox_id}', response_model=schemas.OutboxOut)
async def get_outbox(outbox_id: int, session: AsyncSession = Depends(get_session)):
    rec = await session.get(models.Outbox, outbox_id)
    if not rec:
        raise HTTPException(404, 'Not found')
    return rec
