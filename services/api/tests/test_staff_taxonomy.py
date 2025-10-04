import pytest
import sqlalchemy as sa

@pytest.mark.asyncio
async def test_role_create_update_deactivate_with_reassign(client):
    # Initial list (seed roles)
    r = await client.get('/staff/roles')
    assert r.status_code == 200
    baseline = r.json()
    assert len(baseline) > 0

    # Create new role
    create_payload = {"name": "Assistant", "description": "Assists teachers", "display_order": 555}
    r2 = await client.post('/staff/roles', json=create_payload)
    assert r2.status_code == 200, r2.text
    new_role = r2.json()
    assert new_role['name'] == 'Assistant'
    assert new_role['active'] is True

    # Create staff using new role
    staff_payload = {"staff_code": "AX100", "name": "Aux Person", "role": "Assistant"}
    sresp = await client.post('/staff', json=staff_payload)
    assert sresp.status_code == 200, sresp.text
    staff_rec = sresp.json()
    assert staff_rec['role'] == 'Assistant'

    # Create another target role for reassignment
    r3 = await client.post('/staff/roles', json={"name": "Support"})
    assert r3.status_code == 200, r3.text
    support_role = r3.json()

    # Attempt deactivate without reassign (should 409 because role in use)
    r4 = await client.post(f"/staff/roles/{new_role['id']}/deactivate", json={})
    assert r4.status_code == 409, r4.text

    # Deactivate with reassignment to Support
    r5 = await client.post(f"/staff/roles/{new_role['id']}/deactivate", json={"reassign_to": support_role['id']})
    assert r5.status_code == 200, r5.text
    deactivated = r5.json()
    assert deactivated['active'] is False

    # Staff record should now have Support role
    sfetch = await client.get(f"/staff?id={staff_rec['id']}")  # not existing filter; use list & find
    # Fallback: list all staff and find
    all_staff = (await client.get('/staff')).json()
    updated_staff = next(s for s in all_staff if s['id']==staff_rec['id'])
    assert updated_staff['role'] == 'Support'

@pytest.mark.asyncio
async def test_department_create_and_inactive_validation(client):
    # Create department
    r1 = await client.post('/staff/departments', json={"name": "Advisory"})
    assert r1.status_code == 200, r1.text
    dept = r1.json()

    # Create a staff referencing new department
    s1 = await client.post('/staff', json={"staff_code": "DPT1", "name": "Dept User", "department": "Advisory"})
    assert s1.status_code == 200, s1.text

    # Deactivate department (no staff reassign yet -> should require reassign) -> expect 409
    d2 = await client.post(f"/staff/departments/{dept['id']}/deactivate", json={})
    assert d2.status_code == 409, d2.text

    # Create alternate department and reassign
    r2 = await client.post('/staff/departments', json={"name": "Advisory2"})
    assert r2.status_code == 200
    dept2 = r2.json()

    d3 = await client.post(f"/staff/departments/{dept['id']}/deactivate", json={"reassign_to": dept2['id']})
    assert d3.status_code == 200, d3.text
    assert d3.json()['active'] is False

    # Attempt to create staff with inactive department should 422
    s_bad = await client.post('/staff', json={"staff_code": "DPT2", "name": "Dept Fail", "department": "Advisory"})
    assert s_bad.status_code == 422, s_bad.text

@pytest.mark.asyncio
async def test_meta_extended_shape(client):
    r = await client.get('/staff/meta')
    assert r.status_code == 200
    meta = r.json()
    assert 'roles' in meta and 'departments' in meta
    # Each role object should have keys: id, name, active
    if meta['roles']:
        sample = meta['roles'][0]
        for key in ['id','name','active','protected','display_order']:
            assert key in sample
