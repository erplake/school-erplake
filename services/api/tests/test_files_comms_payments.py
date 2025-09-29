import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_file_blob_and_attachment_flow(client: AsyncClient):
    # Register blob
    r = await client.post('/files/blobs', json={
        'filename': 'doc.txt',
        'mime_type': 'text/plain',
        'size_bytes': 12,
        'sha256': 'a'*64,
        'storage_backend': 'local',
        'storage_key': 'docs/doc.txt'
    })
    assert r.status_code == 200, r.text
    blob = r.json()
    # Create attachment referencing the blob (parent entity arbitrary example students:1)
    r2 = await client.post('/files/attachments', json={
        'blob_id': blob['id'],
        'entity_type': 'student',
        'entity_id': 1
    })
    assert r2.status_code == 200, r2.text
    att = r2.json()
    assert att['blob_id'] == blob['id']

@pytest.mark.asyncio
async def test_comms_template_and_outbox(client: AsyncClient):
    # Create template
    r = await client.post('/comms/templates', json={'name':'welcome','channel':'EMAIL','subject':'Hi','body':'Hello {{name}}'})
    assert r.status_code == 200, r.text
    tpl = r.json()
    # Enqueue message
    r2 = await client.post('/comms/outbox', json={
        'channel':'EMAIL',
        'template_id': tpl['id'],
        'recipient':'user@example.com',
        'subject_override':'Welcome',
        'body_override':'Custom body'
    })
    assert r2.status_code == 200, r2.text
    ob = r2.json()
    assert ob['status'] == 'PENDING'

@pytest.mark.asyncio
async def test_payments_transaction_and_recon(client: AsyncClient):
    r = await client.post('/payments/pg', json={
        'provider':'stripe',
        'amount': 123.45,
        'currency':'USD',
        'order_id':'ORDER123',
        'raw': {'k':'v'}
    })
    assert r.status_code == 200, r.text
    tx = r.json()
    r2 = await client.post('/payments/recon', json={
        'pg_transaction_id': tx['id'],
        'step':'CAPTURED',
        'delta': 123.45,
        'note': 'Initial capture'
    })
    assert r2.status_code == 200, r2.text
    recon = r2.json()
    assert recon['pg_transaction_id'] == tx['id']
