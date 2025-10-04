import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from httpx import AsyncClient, ASGITransport
import jwt
from app.core.config import settings
from app.modules.staff.models import Staff
from app.modules.comms.models import Outbox, Channel
import sqlalchemy as sa
from app.main import app

@pytest.mark.asyncio
async def test_create_substitution_enqueue_notifications(client: AsyncClient, session: AsyncSession):
    # Ensure two staff (absent & covering) with contact info
    rows = (await session.execute(select(Staff).limit(2))).scalars().all()
    while len(rows) < 2:
        s = Staff(staff_code=f'SUB{len(rows)}', name=f'Sub Tester {len(rows)}', role='Teacher', department='Mathematics')
        session.add(s); await session.commit(); await session.refresh(s)
        rows.append(s)
    a, c = rows[0], rows[1]
    if not c.email: c.email = 'cover@test.local'
    if not c.phone: c.phone = '+19990000000'
    await session.commit(); await session.refresh(c)
    payload = {"absent_staff_id": a.id, "covering_staff_id": c.id, "date_from": "2025-10-05", "date_to": "2025-10-07", "notes": "Math periods"}
    r = await client.post('/api/staff/substitutions', json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body['absent_staff_id'] == a.id
    assert body['covering_staff_id'] == c.id
    assert body['notified_email'] or body['notified_whatsapp']  # at least one channel
    # Verify outbox entries
    ob = (await session.execute(select(Outbox).where(Outbox.to_address.in_([c.email, c.phone])))).scalars().all()
    channels = {o.channel for o in ob}
    assert Channel.EMAIL in channels or Channel.WHATSAPP in channels

@pytest.mark.asyncio
async def test_substitution_self_cover_validation(client: AsyncClient, session: AsyncSession):
    s = (await session.execute(select(Staff).limit(1))).scalars().first()
    if not s:
        s = Staff(staff_code='SELF1', name='Self Cover', role='Teacher', department='Mathematics')
        session.add(s); await session.commit(); await session.refresh(s)
    payload = {"absent_staff_id": s.id, "covering_staff_id": s.id, "date_from": "2025-10-05", "date_to": "2025-10-05"}
    r = await client.post('/api/staff/substitutions', json=payload)
    assert r.status_code == 422

@pytest.mark.asyncio
async def test_substitution_date_validation(client: AsyncClient, session: AsyncSession):
    rows = (await session.execute(select(Staff).limit(2))).scalars().all()
    if len(rows) < 2:
        for i in range(2-len(rows)):
            s = Staff(staff_code=f'DATE{i}', name=f'Date Tester {i}', role='Teacher', department='Mathematics')
            session.add(s); await session.commit(); await session.refresh(s)
            rows.append(s)
    a, c = rows[0], rows[1]
    payload = {"absent_staff_id": a.id, "covering_staff_id": c.id, "date_from": "2025-10-08", "date_to": "2025-10-07"}
    r = await client.post('/api/staff/substitutions', json=payload)
    assert r.status_code == 422

@pytest.mark.asyncio
async def test_substitution_permission_enforcement(session: AsyncSession, setup_db):
    # Build token missing staff:substitutions permission
    rows = (await session.execute(select(Staff).limit(2))).scalars().all()
    if len(rows) < 2:
        for i in range(2-len(rows)):
            s = Staff(staff_code=f'PERM{i}', name=f'Perm Tester {i}', role='Teacher', department='Mathematics')
            session.add(s); await session.commit(); await session.refresh(s)
            rows.append(s)
    a, c = rows[0], rows[1]
    token = jwt.encode({"sub": 1, "perms": ["staff:list"]}, settings.jwt_secret, algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", headers=headers) as cclient:
        payload = {"absent_staff_id": a.id, "covering_staff_id": c.id, "date_from": "2025-10-05", "date_to": "2025-10-05"}
        r = await cclient.post('/api/staff/substitutions', json=payload)
        assert r.status_code in (401,403)

@pytest.mark.asyncio
async def test_list_substitutions(client: AsyncClient):
    r = await client.get('/api/staff/substitutions?limit=5')
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    if data:
        sample = data[0]
        for k in ['id','absent_staff_id','covering_staff_id','date_from','date_to']:
            assert k in sample
