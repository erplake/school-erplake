import io, csv, pytest
from httpx import AsyncClient

TEMPLATE_HEADERS = [
    'staff_code','employee_id','name','role','department','grade','email','phone','date_of_joining','birthday',
    'reports_to','status','attendance_30','leave_balance','emergency_contact_name','emergency_contact_relation','emergency_contact_phone','emergency_contact_address'
]

async def _upload(async_client: AsyncClient, rows):
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(TEMPLATE_HEADERS)
    for r in rows:
        w.writerow([r.get(h,'') for h in TEMPLATE_HEADERS])
    data = buf.getvalue().encode('utf-8')
    files = {'file': ('staff_import.csv', data, 'text/csv')}
    return await async_client.post('/api/staff/import', files=files)

@pytest.mark.asyncio
async def test_staff_import_create_and_update(async_client: AsyncClient):
    # Create two new staff
    r = await _upload(async_client, [
        {'employee_id':'E100','name':'Alpha Teacher','department':'Mathematics','role':'Teacher','leave_balance':'5'},
        {'employee_id':'E101','name':'Beta Admin','department':'Administration','role':'Admin','attendance_30':'7'}
    ])
    assert r.status_code == 200, r.text
    summary = r.json()
    assert summary['created'] == 2
    assert summary['updated'] == 0
    assert summary['errors'] == []
    # Update one (change attendance & add emergency contact)
    r2 = await _upload(async_client, [
        {'employee_id':'E100','name':'Alpha Teacher','attendance_30':'10','emergency_contact_name':'Jane','emergency_contact_phone':'12345'},
    ])
    assert r2.status_code == 200
    summary2 = r2.json()
    assert summary2['created'] == 0
    assert summary2['updated'] == 1
    assert summary2['errors'] == []
    # Fetch list and verify fields updated
    list_resp = await async_client.get('/api/staff?search=Alpha')
    assert list_resp.status_code == 200
    rows = list_resp.json()
    target = next((x for x in rows if x['employee_id']=='E100'), None)
    assert target is not None
    assert target['attendance_30'] == 10

@pytest.mark.asyncio
async def test_staff_import_duplicate_employee_id(async_client: AsyncClient):
    # First create
    r = await _upload(async_client, [ {'employee_id':'E200','name':'Gamma Person'} ])
    assert r.status_code == 200
    # Second upload with two rows, one dup, one good
    r2 = await _upload(async_client, [
        {'employee_id':'E200','name':'Different Name'},
        {'employee_id':'E201','name':'Delta Person'}
    ])
    assert r2.status_code == 200
    summary = r2.json()
    assert summary['created'] == 1
    assert summary['updated'] == 1  # E200 is an update, not an error
    # NOTE: In import logic we treat existing employee_id as update not error unless duplicate on create path.

@pytest.mark.asyncio
async def test_staff_import_missing_name(async_client: AsyncClient):
    r = await _upload(async_client, [ {'employee_id':'E300','name':''} ])
    assert r.status_code == 200
    summary = r.json()
    assert summary['created'] == 0
    assert summary['updated'] == 0
    assert any('name required' in e for e in summary['errors'])
