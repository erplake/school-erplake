import pytest

@pytest.mark.asyncio
async def test_staff_list_pagination(client):
    # create 3 staff
    for i in range(3):
        payload = {"staff_code":f"S{i}","name":f"Staff {i}","role":"Teacher"}
        r = await client.post('/staff', json=payload); assert r.status_code==200
    r_all = await client.get('/staff?limit=2&offset=0')
    assert r_all.status_code==200
    assert len(r_all.json())==2
    assert 'X-Total-Count' in r_all.headers and int(r_all.headers['X-Total-Count'])>=3
    r_page2 = await client.get('/staff?limit=2&offset=2')
    assert r_page2.status_code==200
    assert len(r_page2.json())>=1

@pytest.mark.asyncio
async def test_leave_validation_dates(client):
    # create staff
    r = await client.post('/staff', json={"staff_code":"LV1","name":"Leave User","role":"Teacher"})
    assert r.status_code==200
    sid = r.json()['id']
    # invalid: date_from after date_to
    bad = {"staff_id":sid,"leave_type":"Sick Leave","date_from":"2025-10-05","date_to":"2025-10-01","days":1}
    rbad = await client.post('/staff/leave', json=bad)
    assert rbad.status_code==422
    # invalid: days mismatch
    mismatch = {"staff_id":sid,"leave_type":"Sick Leave","date_from":"2025-10-01","date_to":"2025-10-02","days":5}
    rbad2 = await client.post('/staff/leave', json=mismatch)
    assert rbad2.status_code==422
    # valid
    good = {"staff_id":sid,"leave_type":"Sick Leave","date_from":"2025-10-01","date_to":"2025-10-02","days":2}
    rgood = await client.post('/staff/leave', json=good)
    assert rgood.status_code==200