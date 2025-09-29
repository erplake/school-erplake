import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_payment_event_ingest_and_idempotent(client: AsyncClient):
    # Create a base pg transaction first
    r = await client.post('/payments/pg', json={
        'provider': 'stripe',
        'amount': 10.0,
        'currency': 'USD',
        'order_id': 'ORDER-100',
        'payment_id': 'pay_100'
    })
    assert r.status_code == 200, r.text
    tx = r.json()
    assert tx['status'] == 'CREATED'

    # Ingest a payment succeeded event
    ev_payload = {
        'provider': 'stripe',
        'event_id': 'evt_1',
        'event_type': 'payment_intent.succeeded',
        'order_id': 'ORDER-100',
        'payment_id': 'pay_100',
        'raw': {'status': 'succeeded'}
    }
    r2 = await client.post('/payments/webhook/event', json=ev_payload)
    assert r2.status_code == 200, r2.text
    ev = r2.json()
    assert ev['status_derived'] == 'CAPTURED'
    assert ev['pg_transaction_id'] == tx['id']

    # Fetch transaction again to confirm status updated
    r3 = await client.get(f"/payments/pg/{tx['id']}")
    assert r3.status_code == 200
    tx_after = r3.json()
    assert tx_after['status'] == 'CAPTURED'

    # Re-send same event (idempotent)
    r4 = await client.post('/payments/webhook/event', json=ev_payload)
    assert r4.status_code == 200
    ev2 = r4.json()
    assert ev2['id'] == ev['id']

@pytest.mark.asyncio
async def test_payment_event_no_tx_match(client: AsyncClient):
    ev_payload = {
        'provider': 'razorpay',
        'event_id': 'evt_X',
        'event_type': 'payment.authorized',
        'order_id': 'ORD-NO-TX',
        'payment_id': 'pay_missing',
        'raw': {'status': 'authorized'}
    }
    r = await client.post('/payments/webhook/event', json=ev_payload)
    assert r.status_code == 200, r.text
    ev = r.json()
    assert ev['pg_transaction_id'] is None
    assert ev['status_derived'] == 'AUTHORIZED'
