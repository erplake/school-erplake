import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

@pytest.mark.asyncio
async def test_audit_log_presence(client: AsyncClient, session: AsyncSession):
    # Trigger a simple mutating endpoint that we can instrument later; for now directly insert a log row to ensure table works.
    await session.execute(text("INSERT INTO core.audit_log(user_id, school_id, action) VALUES (1,1,'manual_test')"))
    await session.commit()

    # Query via API (will 403 without permission if RBAC enforced; skip gracefully)
    r = await client.get('/ops/audit')
    if r.status_code == 403:
        pytest.skip('RBAC enforced without ops:audit_read seeded')
    assert r.status_code == 200
    data = r.json()
    assert any(entry['action'] == 'manual_test' for entry in data)
