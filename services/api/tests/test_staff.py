import pytest

@pytest.mark.asyncio
async def test_staff_create_list_and_leave(client):
    # Create staff
    payload = {"staff_code":"T100","name":"Test Teacher","role":"Teacher","department":"Mathematics"}
    r = await client.post('/staff', json=payload)
    assert r.status_code == 200, r.text
    staff = r.json()
    assert staff['staff_code'] == 'T100'
    # List
    r2 = await client.get('/staff')
    assert r2.status_code == 200
    all_staff = r2.json()
    assert any(s['staff_code']=='T100' for s in all_staff)
    # Create leave
    leave_payload = {"staff_id": staff['id'], "leave_type":"Sick Leave", "date_from":"2025-10-01", "date_to":"2025-10-02", "days":2, "reason":"Flu"}
    lr = await client.post('/staff/leave', json=leave_payload)
    assert lr.status_code == 200, lr.text
    leave = lr.json()
    assert leave['leave_type']=='Sick Leave'
    # Transition leave
    tr = await client.post(f"/staff/leave/{leave['id']}/transition?target=Approved")
    assert tr.status_code == 200, tr.text
    assert tr.json()['status']=='Approved'
    # List leaves
    lr_list = await client.get('/staff/leave')
    assert lr_list.status_code == 200
    assert any(x['id']==leave['id'] for x in lr_list.json())
