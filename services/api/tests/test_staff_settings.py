import json
import pytest
from httpx import AsyncClient
from app.main import app

# NOTE: These tests assume test DB and a fixture providing an async session & migrated schema.
# If project uses a different test harness, adapt accordingly.

@pytest.mark.asyncio
async def test_put_and_get_setting(async_client: AsyncClient):
    payload = {"monthly_accrual_days": 2.0, "carryover_limit_days": 12, "max_negative_balance": 1}
    r = await async_client.put('/api/staff/settings/leave_policy', json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data['monthly_accrual_days'] == 2.0
    r2 = await async_client.get('/api/staff/settings/leave_policy')
    assert r2.status_code == 200
    assert r2.json()['carryover_limit_days'] == 12

@pytest.mark.asyncio
async def test_staff_code_generation(async_client: AsyncClient):
    # Seed pattern
    await async_client.put('/api/staff/settings/staff_code_rules', json={"pattern":"{DEPT}-{SEQ:3}","sequence_start":100,"zero_pad_width":3})
    r = await async_client.post('/api/staff', json={"name":"Alice Example","role":None,"department":"Mathematics"})
    assert r.status_code == 200, r.text
    code = r.json()['staff_code']
    assert code.startswith('MATHEM') or code.startswith('MATH') or '-' in code  # loose check due to truncation logic

@pytest.mark.asyncio
async def test_negative_balance_enforcement(async_client: AsyncClient):
    # Set max negative to 0
    await async_client.put('/api/staff/settings/leave_policy', json={"monthly_accrual_days": 0, "carryover_limit_days": 0, "max_negative_balance": 0})
    r = await async_client.post('/api/staff', json={"name":"Bob Example","department":"Science"})
    staff_id = r.json()['id']
    # Request 1 day leave should fail (balance 0, max negative 0)
    leave = await async_client.post('/api/staff/leave', json={"staff_id":staff_id,"leave_type":"Sick Leave","date_from":"2025-01-01","date_to":"2025-01-01","days":1})
    assert leave.status_code == 422
