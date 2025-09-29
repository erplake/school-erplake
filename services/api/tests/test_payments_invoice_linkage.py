import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_pg_transaction_with_invoice_and_recon_link(client: AsyncClient):
    # Create a payment gateway transaction with invoice_id
    r = await client.post('/payments/pg', json={
        'provider': 'stripe',
        'amount': 77.50,
        'currency': 'USD',
        'order_id': 'ORDER-INV-1',
        'invoice_id': 5551,
        'raw': {'info': 'test'}
    })
    assert r.status_code == 200, r.text
    tx = r.json()
    assert tx['invoice_id'] == 5551

    # Create reconciliation entry referencing same invoice id
    r2 = await client.post('/payments/recon', json={
        'pg_transaction_id': tx['id'],
        'invoice_id': 5551,
        'step': 'CAPTURED',
        'delta': 77.50,
        'note': 'Captured against invoice'
    })
    assert r2.status_code == 200, r2.text
    recon = r2.json()
    assert recon['invoice_id'] == 5551
    assert recon['pg_transaction_id'] == tx['id']