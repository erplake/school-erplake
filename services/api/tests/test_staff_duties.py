import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.modules.comms.models import Outbox, Channel
from app.modules.staff.models import Staff
import sqlalchemy as sa

@pytest.mark.asyncio
async def test_create_duty_enqueue_notifications(client: AsyncClient, session: AsyncSession):
    # Ensure a staff member exists with email & phone
    s = (await session.execute(select(Staff).limit(1))).scalars().first()
    if not s:
        # create minimal staff directly if fixture DB empty
        from app.modules.staff.models import Staff as StaffModel
        s = StaffModel(staff_code='T999', name='Duty Tester', role='Teacher', department='Mathematics', email='duty@test.local', phone='+10000000000')
        session.add(s); await session.commit(); await session.refresh(s)
    else:
        # patch in contact info if missing
        updated = False
        if not s.email:
            s.email = 'duty@test.local'; updated = True
        if not s.phone:
            s.phone = '+10000000000'; updated = True
        if updated:
            await session.commit(); await session.refresh(s)

    payload = {"staff_id": s.id, "title": "Gate Duty", "duty_date": "2025-10-05", "notes": "Morning shift"}
    r = await client.post('/api/staff/duties', json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body['title'] == 'Gate Duty'
    assert body['notified_email'] is True
    assert body['notified_whatsapp'] is True

    # duplicate should conflict (case-insensitive)
    r_dup = await client.post('/api/staff/duties', json=payload)
    assert r_dup.status_code == 409

    # Verify outbox rows exist (best-effort) - at least one for each channel
    ob_rows = (await session.execute(select(Outbox).where(Outbox.to_address.in_([s.email, s.phone])))).scalars().all()
    channels = {o.channel for o in ob_rows}
    assert Channel.EMAIL in channels
    assert Channel.WHATSAPP in channels

@pytest.mark.asyncio
async def test_list_upcoming_duties(client: AsyncClient):
    r = await client.get('/api/staff/duties?upcoming_only=1&limit=5')
    assert r.status_code == 200
    # shape check
    arr = r.json()
    assert isinstance(arr, list)
    if arr:
        sample = arr[0]
        for key in ['id','staff_id','title','duty_date']:
            assert key in sample

@pytest.mark.asyncio
async def test_case_insensitive_duplicate(client: AsyncClient, session: AsyncSession):
    # Ensure staff exists
    s = (await session.execute(select(Staff).limit(1))).scalars().first()
    if not s:
        from app.modules.staff.models import Staff as StaffModel
        s = StaffModel(staff_code='T100', name='Case Tester', role='Teacher', department='Mathematics')
        session.add(s); await session.commit(); await session.refresh(s)
    base_payload = {"staff_id": s.id, "title": "Hall Supervision", "duty_date": "2025-10-06"}
    r1 = await client.post('/api/staff/duties', json=base_payload)
    assert r1.status_code == 200, r1.text
    # Different casing in title should collide
    payload2 = dict(base_payload)
    payload2['title'] = 'hall supervision'  # lower-case variant
    r2 = await client.post('/api/staff/duties', json=payload2)
    assert r2.status_code == 409, r2.text

@pytest.mark.asyncio
async def test_permission_enforcement_no_staff_duty(session: AsyncSession, setup_db):
    """Simulate a user missing staff:duty permission by crafting a token without that capability.

    We manually call the app with a client lacking the permission and expect 403.
    """
    from httpx import AsyncClient, ASGITransport
    from app.main import app
    from app.core.config import settings
    import jwt
    # seed a staff row
    staff = (await session.execute(select(Staff).limit(1))).scalars().first()
    if not staff:
        from app.modules.staff.models import Staff as StaffModel
        staff = StaffModel(staff_code='PX01', name='Perm Test', role='Teacher')
        session.add(staff); await session.commit(); await session.refresh(staff)
    # Token with only staff:list (common read) but not staff:duty
    token = jwt.encode({"sub": 1, "perms": ["staff:list"]}, settings.jwt_secret, algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", headers=headers) as c:
        payload = {"staff_id": staff.id, "title": "Security Check", "duty_date": "2025-10-07"}
        r = await c.post('/api/staff/duties', json=payload)
        assert r.status_code in (401,403), r.text
        # 403 expected if auth accepted but permission denied; 401 if token structure not recognized by security layer.
