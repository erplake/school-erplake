import pytest
from httpx import AsyncClient
from datetime import datetime

@pytest.mark.asyncio
async def test_settlement_summary_ondemand(client: AsyncClient):
    # Create two transactions for same provider/day
    r1 = await client.post('/payments/pg', json={
        'provider': 'stripe',
        'amount': 100.00,
        'currency': 'USD',
        'order_id': 'ORD-A1',
        'payment_id': 'pay_A1'
    })
    assert r1.status_code == 200
    r2 = await client.post('/payments/pg', json={
        'provider': 'stripe',
        'amount': 50.00,
        'currency': 'USD',
        'order_id': 'ORD-A2',
        'payment_id': 'pay_A2'
    })
    assert r2.status_code == 200

    today = datetime.utcnow().date().isoformat()
    # Trigger captured event for first transaction to affect status
    ev = await client.post('/payments/webhook/event', json={
        'provider': 'stripe',
        'event_id': 'evt_settle1',
        'event_type': 'payment_intent.succeeded',
        'order_id': 'ORD-A1',
        'payment_id': 'pay_A1',
        'raw': {'status': 'succeeded'}
    })
    assert ev.status_code == 200

    # Request settlement summary (on-demand compute)
    res = await client.get(f'/payments/settlements?provider=stripe&day={today}')
    assert res.status_code == 200, res.text
    data = res.json()
    assert len(data) == 1
    summary = data[0]
    # Gross currently sums both tx amounts (regardless of status heuristics)
    assert float(summary['gross_amount']) >= 150.0
    assert summary['provider'] == 'stripe'
