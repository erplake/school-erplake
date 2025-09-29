import os
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_config_upsert_and_list(client: AsyncClient):
    r = await client.post('/settings/config', json={
        'key': 'branding.school_name',
        'value_json': {'value': 'My Test School'},
        'is_secret': False
    })
    assert r.status_code == 200, r.text
    body = r.json()
    assert body['key'] == 'branding.school_name'
    r2 = await client.get('/settings/config')
    assert r2.status_code == 200
    keys = [x['key'] for x in r2.json()]
    assert 'branding.school_name' in keys

@pytest.mark.asyncio
async def test_integration_credential_create_and_list(client: AsyncClient, monkeypatch):
    # Ensure encryption key is set so value is tagged
    monkeypatch.setenv('APP_CREDENTIALS_KEY', 'dev-secret-passphrase')
    r = await client.post('/settings/integration-credentials', json={
        'provider': 'gupshup',
        'label': 'primary',
        'credentials': {'api_key': 'XYZ'}
    })
    assert r.status_code == 200, r.text
    created = r.json()
    assert created['provider'] == 'gupshup'
    r2 = await client.get('/settings/integration-credentials')
    assert r2.status_code == 200
    rows = r2.json()
    assert any(row['provider'] == 'gupshup' for row in rows)
