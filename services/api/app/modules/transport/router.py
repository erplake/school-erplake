from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Response, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from ..transport.models import TransportBus, TransportServiceLog, TransportIncident, TransportGpsPing
from ..transport.schemas import (
    BusCreate, BusUpdate, BusOut,
    ServiceLogCreate, ServiceLogOut,
    IncidentCreate, IncidentOut,
    GpsPingCreate, GpsPingOut
)
from ...core.db import get_session
from ...core.security import require
from datetime import datetime
import asyncio

router = APIRouter(prefix="/transport", tags=["transport"])


@router.post('/buses', response_model=BusOut)
async def create_bus(body: BusCreate, session: AsyncSession = Depends(get_session), user=Depends(require('transport:write'))):
    existing = (await session.execute(select(TransportBus).where(TransportBus.code==body.code))).scalar_one_or_none()
    if existing:
        raise HTTPException(409, 'code already exists')
    bus = TransportBus(**body.dict())
    session.add(bus)
    await session.commit(); await session.refresh(bus)
    return BusOut.model_validate(bus)


@router.get('/buses', response_model=List[BusOut])
async def list_buses(
    response: Response,
    session: AsyncSession = Depends(get_session),
    user=Depends(require('transport:read')),
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[str] = None,
    search: Optional[str] = None,
):
    stmt = select(TransportBus)
    if status:
        stmt = stmt.where(TransportBus.status==status)
    if search:
        like = f"%{search.lower()}%"
        from sqlalchemy import or_, func
        stmt = stmt.where(or_(func.lower(TransportBus.code).like(like), func.lower(TransportBus.model).like(like)))
    total = (await session.execute(stmt.with_only_columns(TransportBus.id))).all()
    stmt = stmt.order_by(TransportBus.id.desc()).offset(offset).limit(limit)
    rows = (await session.execute(stmt)).scalars().all()
    response.headers['X-Total-Count'] = str(len(total))
    return [BusOut.model_validate(r) for r in rows]


@router.get('/buses/{bus_id}', response_model=BusOut)
async def get_bus(bus_id: int, session: AsyncSession = Depends(get_session), user=Depends(require('transport:read'))):
    bus = (await session.execute(select(TransportBus).where(TransportBus.id==bus_id))).scalar_one_or_none()
    if not bus:
        raise HTTPException(404, 'Not found')
    return BusOut.model_validate(bus)


@router.patch('/buses/{bus_id}', response_model=BusOut)
async def update_bus(bus_id: int, body: BusUpdate, session: AsyncSession = Depends(get_session), user=Depends(require('transport:write'))):
    bus = (await session.execute(select(TransportBus).where(TransportBus.id==bus_id))).scalar_one_or_none()
    if not bus:
        raise HTTPException(404, 'Not found')
    for k,v in body.dict(exclude_unset=True).items():
        setattr(bus, k, v)
    await session.commit(); await session.refresh(bus)
    return BusOut.model_validate(bus)


@router.post('/service', response_model=ServiceLogOut)
async def create_service_log(body: ServiceLogCreate, session: AsyncSession = Depends(get_session), user=Depends(require('transport:maint'))):
    bus = (await session.execute(select(TransportBus).where(TransportBus.id==body.bus_id))).scalar_one_or_none()
    if not bus:
        raise HTTPException(404, 'Bus not found')
    log = TransportServiceLog(bus_id=body.bus_id, date=body.date, odometer_km=body.odometer_km, work=body.work)
    bus.last_service_date = body.date
    if body.odometer_km is not None:
        bus.odometer_km = body.odometer_km
    session.add(log)
    await session.commit(); await session.refresh(log)
    return ServiceLogOut.model_validate(log)


@router.get('/service/{bus_id}', response_model=list[ServiceLogOut])
async def list_service_logs(bus_id: int, session: AsyncSession = Depends(get_session), user=Depends(require('transport:read'))):
    logs = (await session.execute(select(TransportServiceLog).where(TransportServiceLog.bus_id==bus_id).order_by(TransportServiceLog.date.desc()))).scalars().all()
    return [ServiceLogOut.model_validate(l) for l in logs]


@router.post('/incidents', response_model=IncidentOut)
async def create_incident(body: IncidentCreate, session: AsyncSession = Depends(get_session), user=Depends(require('transport:maint'))):
    bus = (await session.execute(select(TransportBus).where(TransportBus.id==body.bus_id))).scalar_one_or_none()
    if not bus:
        raise HTTPException(404, 'Bus not found')
    inc = TransportIncident(bus_id=body.bus_id, date=body.date, note=body.note)
    session.add(inc)
    await session.commit(); await session.refresh(inc)
    return IncidentOut.model_validate(inc)


@router.get('/incidents/{bus_id}', response_model=list[IncidentOut])
async def list_incidents(bus_id: int, session: AsyncSession = Depends(get_session), user=Depends(require('transport:read'))):
    rows = (await session.execute(select(TransportIncident).where(TransportIncident.bus_id==bus_id).order_by(TransportIncident.date.desc()))).scalars().all()
    return [IncidentOut.model_validate(r) for r in rows]


@router.post('/gps', response_model=GpsPingOut)
async def ingest_gps(body: GpsPingCreate, session: AsyncSession = Depends(get_session), user=Depends(require('transport:gps'))):
    bus = (await session.execute(select(TransportBus).where(TransportBus.id==body.bus_id))).scalar_one_or_none()
    if not bus:
        raise HTTPException(404, 'Bus not found')
    ping = TransportGpsPing(bus_id=body.bus_id, lat=body.lat, lng=body.lng, speed_kph=body.speed_kph, pinged_at=datetime.utcnow())
    session.add(ping)
    await session.commit(); await session.refresh(ping)
    return GpsPingOut.model_validate(ping)


# Simple Server-Sent Events stream placeholder for GPS updates.
@router.get('/gps/stream')
async def gps_stream():
    from fastapi import Response
    async def event_gen():
        # Placeholder: in a real impl, poll recent pings or subscribe to pubsub.
        for _ in range(3):
            await asyncio.sleep(1)
            yield f"data: {{\"ping\": true, \"t\": {datetime.utcnow().timestamp()} }}\n\n"
    return Response(event_gen(), media_type='text/event-stream')
