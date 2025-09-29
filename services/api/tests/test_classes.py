import pytest

# Basic tests for /classes endpoints

@pytest.mark.asyncio
async def test_classes_list_empty(client):
    # Fresh schema (setup_db fixture) => expect no classes
    r = await client.get('/classes')
    assert r.status_code == 200
    assert r.json() == []

@pytest.mark.asyncio
async def test_classes_with_students(session, client):
    # seed two classes with students
    from sqlalchemy import text as _text
    await session.execute(_text("""
        INSERT INTO students (first_name, class, section, gender) VALUES
        ('Asha','8','A','F'),
        ('Rohan','8','A','M'),
        ('Meera','9','B','F')
    """))
    await session.execute(_text("""
        INSERT INTO attendance_events (student_id,date,present) VALUES
        (1, CURRENT_DATE, 1), (2, CURRENT_DATE, 0), (3, CURRENT_DATE, 1)
    """))
    await session.execute(_text("""
        INSERT INTO fee_invoices (student_id, amount, paid_amount) VALUES
        (1, 5000, 0), (2, 5000, 2500), (3, 3000, 3000)
    """))
    await session.commit()
    r = await client.get('/classes')
    assert r.status_code == 200
    data = r.json()
    # Two classes expected: 8A and 9B
    ids = {c['id'] for c in data}
    assert '8A' in ids and '9B' in ids
    c8 = next(c for c in data if c['id']=='8A')
    assert c8['total'] == 2
    assert c8['male'] == 1 and c8['female'] == 1

@pytest.mark.asyncio
async def test_class_detail_and_bulk_action(session, client):
    # Ensure class status update works
    r = await client.post('/classes/bulk-action', json={
        'action':'set_result',
        'class_ids':['8-A','9-B'],
        'params':{'result_status':'Published'}
    })
    assert r.status_code == 200
    assert r.json()['status'] == 'ok'
    # Fetch detail for 8-A
    r2 = await client.get('/classes/8-A')
    assert r2.status_code == 200
    detail = r2.json()
    assert detail['id'] == '8A'
    assert detail['result_status'] == 'Published'

@pytest.mark.asyncio
async def test_patch_endpoint(session, client):
    # Insert a class with students
    from sqlalchemy import text as _text
    await session.execute(_text("""
        INSERT INTO students (first_name, class, section, gender) VALUES
        ('Tia','7','A','F'),
        ('Arun','7','A','M')
    """))
    await session.commit()
    # Patch set teacher
    r = await client.patch('/classes/7-A', json={'class_teacher':'Ms. Dee'} )
    assert r.status_code == 200
    body = r.json()
    assert body['class_teacher'] == 'Ms. Dee'
    # Patch set result_status
    r2 = await client.patch('/classes/7-A', json={'result_status':'Published'})
    assert r2.status_code == 200
    body2 = r2.json()
    assert body2['result_status'] == 'Published'
    # Remove teacher
    r3 = await client.patch('/classes/7-A', json={'class_teacher': ''})
    assert r3.status_code == 200
    assert r3.json()['class_teacher'] is None

@pytest.mark.asyncio
async def test_list_filters_and_pagination(session, client):
    # Add multiple classes if not already present
    from sqlalchemy import text as _text
    await session.execute(_text("""
        INSERT INTO students (first_name, class, section, gender) VALUES
        ('A1','10','A','F'),
        ('A2','10','A','M'),
        ('B1','10','B','F')
    """))
    await session.commit()
    r = await client.get('/classes?grade=10')
    assert r.status_code == 200
    data = r.json()
    # Expect just classes with grade 10
    assert all(c['grade']==10 for c in data)
    # Pagination limit=1
    r2 = await client.get('/classes?grade=10&limit=1')
    assert r2.status_code == 200
    assert len(r2.json()) <= 1
