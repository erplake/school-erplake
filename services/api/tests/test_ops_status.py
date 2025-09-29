import pytest
from httpx import AsyncClient

@pytest.mark.asyncio(loop_scope="session")
async def test_ops_status_basic(client: AsyncClient):
    resp = await client.get('/ops/status')
    assert resp.status_code == 200
    data = resp.json()
    assert 'ports' in data and isinstance(data['ports'], dict)
    assert 'db' in data and isinstance(data['db'], dict)
    # ports should include expected keys
    for p in [5544, 8000, 8001, 5173]:
        assert str(p) in {str(k) for k in data['ports'].keys()}  # allow int vs str serialization differences
    # db tables list shape
    assert 'tables' in data['db']
    assert isinstance(data['db']['tables'], list)
    # counts map shape (may be empty if tables not yet created in this isolated test schema)
    if 'counts' in data['db']:
        assert isinstance(data['db']['counts'], dict)
