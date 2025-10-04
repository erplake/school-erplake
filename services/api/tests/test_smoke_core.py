import pytest

# Core smoke tests to ensure primary admin endpoints respond without 5xx and basic contract holds.
# Uses in-memory seeded (create_all) schema via setup_db fixture.

SMOKE_WING = {"academic_year": "2025-26", "name": "Primary", "grade_start": "1", "grade_end": "5"}
SMOKE_CLASS = {"academic_year": "2025-26", "wing_id": None, "grade": "3", "section": "A"}

@pytest.mark.asyncio
async def test_health_and_status(client):
    r = await client.get('/healthz')
    assert r.status_code == 200
    assert r.json().get('status','ok') in ('ok','healthy','OK')
    ops = await client.get('/ops/status')
    assert ops.status_code == 200

@pytest.mark.asyncio
async def test_wings_crud_flow(client):
    # List empty
    r = await client.get('/wings')
    assert r.status_code == 200 and r.json() == []
    # Create
    create = await client.post('/wings', json=SMOKE_WING)
    assert create.status_code == 200
    wid = create.json()['id']
    # Get list again
    r2 = await client.get('/wings')
    assert any(w['id']==wid for w in r2.json())

@pytest.mark.asyncio
async def test_head_mistress_and_assign(client):
    # Create head mistress
    hm = await client.post('/head-mistresses', json={"name":"HM One"})
    assert hm.status_code == 200
    hm_id = hm.json()['id']
    # Create wing with head_id
    wing2 = await client.post('/wings', json={"academic_year":"2025-26","name":"Senior","grade_start":"6","grade_end":"8","head_id":hm_id})
    assert wing2.status_code == 200
    getw = await client.get('/wings')
    assert any(w.get('head_id')==hm_id for w in getw.json())

@pytest.mark.asyncio
async def test_class_bulk_settings_and_storage_meet(client):
    # Create wing then classes via bulk settings
    w = await client.post('/wings', json={"academic_year":"2025-26","name":"Middle","grade_start":"3","grade_end":"4"})
    assert w.status_code == 200
    wid = w.json()['id']
    payload = {
        "wing_id": wid,
        "academic_year": "2025-26",
        "classes": [
            {"grade":"3","section":"A","storage_path":"/classes/3-A","meet_link":"https://meet/3A"},
            {"grade":"4","section":"B","storage_path":"/classes/4-B","meet_link":"https://meet/4B"}
        ]
    }
    bulk = await client.post('/classes-admin/bulk-settings', json=payload)
    assert bulk.status_code == 200
    # Fetch classes admin list
    admin_list = await client.get('/classes-admin')
    assert admin_list.status_code == 200
    data = admin_list.json()
    assert any(c.get('storage_path')=="/classes/3-A" for c in data)

@pytest.mark.asyncio
async def test_tasks_and_notes_crud_flow(client):
    # Pre-create a wing and class for tasks
    w = await client.post('/wings', json={"academic_year":"2025-26","name":"TasksWing","grade_start":"1","grade_end":"1"})
    assert w.status_code == 200
    wid = w.json()['id']
    cls_payload = {"wing_id": wid, "academic_year": "2025-26", "grade": "1", "section": "A", "storage_path":"/classes/1-A","meet_link":"https://meet/1A"}
    c = await client.post('/classes-admin', json=cls_payload)
    assert c.status_code in (200,201)
    # Create task
    t = await client.post(f"/classes/1/A/tasks", json={"title":"Prep Notebook","status":"pending"})
    assert t.status_code == 200
    tid = t.json()['id']
    # List tasks
    lst = await client.get(f"/classes/1/A/tasks")
    assert lst.status_code == 200 and any(task['id']==tid for task in lst.json())
    # Update task
    up = await client.put(f"/classes/1/A/tasks/{tid}", json={"title":"Prep NB","status":"done"})
    assert up.status_code == 200 and up.json()['status']=="done"
    # Notes
    n = await client.post(f"/classes/1/A/notes", json={"body":"Important note"})
    assert n.status_code == 200
    nid = n.json()['id']
    notes = await client.get(f"/classes/1/A/notes")
    assert notes.status_code == 200 and any(note['id']==nid for note in notes.json())
    # Delete task & note
    dt = await client.delete(f"/classes/1/A/tasks/{tid}")
    dn = await client.delete(f"/classes/1/A/notes/{nid}")
    assert dt.status_code == 200 and dn.status_code == 200