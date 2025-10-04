import pytest
from sqlalchemy import text as sql_text

# Tests for wings / classes-admin endpoints

@pytest.mark.asyncio
async def test_wings_crud_and_class_creation(session, client):
    # Create wing
    r = await client.post('/wings', json={
        'academic_year':'2025-26',
        'name':'Primary',
        'grade_start':1,
        'grade_end':5,
        'target_ratio':30,
        'head':'Ms Head'
    })
    assert r.status_code == 200, r.text
    wing = r.json()
    assert wing['name']=='Primary'

    # List wings filter by year
    rlist = await client.get('/wings?academic_year=2025-26')
    assert rlist.status_code == 200
    wings = rlist.json()
    assert any(w['name']=='Primary' for w in wings)

    # Update wing
    rupd = await client.patch(f"/wings/{wing['id']}", json={'target_ratio':28})
    assert rupd.status_code == 200
    assert rupd.json()['target_ratio'] == 28

    # Create class under wing
    rcls = await client.post('/classes-admin', json={
        'academic_year':'2025-26',
        'wing_id': wing['id'],
        'grade':2,
        'section':'A',
        'teacher_name':'Ms A',
        'target_ratio':28
    })
    assert rcls.status_code == 200, rcls.text
    cls = rcls.json()
    assert cls['grade']==2 and cls['section']=='A'

    # List classes
    rclslist = await client.get('/classes-admin?academic_year=2025-26')
    assert rclslist.status_code == 200
    classes = rclslist.json()
    assert any(c['section']=='A' for c in classes)

@pytest.mark.asyncio
async def test_assign_students_and_counts(session, client):
    # Ensure wing & class exist
    rwing = await client.post('/wings', json={
        'academic_year':'2025-26', 'name':'Junior','grade_start':6,'grade_end':8
    })
    wing_id = rwing.json()['id']
    rcls = await client.post('/classes-admin', json={
        'academic_year':'2025-26','wing_id': wing_id,'grade':6,'section':'B'
    })
    class_id = rcls.json()['id']

    # Insert students directly
    await session.execute(sql_text("""
        INSERT INTO students (first_name, class, section, gender) VALUES
        ('Stu1','6','B','F'),
        ('Stu2','6','B','M'),
        ('Stu3','6','B','M')
    """))
    await session.commit()

    # Assign student ids 1..3 (assuming clean test DB with sequential ids)
    # Fetch ids explicitly to future-proof
    sid_rows = (await session.execute(sql_text("SELECT id FROM students WHERE class='6' AND section='B' ORDER BY id"))).scalars().all()
    rassign = await client.post(f"/classes-admin/{class_id}/students", json={'student_ids': sid_rows, 'replace': True})
    assert rassign.status_code == 200, rassign.text
    assert rassign.json()['total'] == len(sid_rows)

    # List classes and validate total_students
    rlist = await client.get('/classes-admin?academic_year=2025-26')
    assert rlist.status_code == 200
    cls = next(c for c in rlist.json() if c['id']==class_id)
    assert cls['total_students'] == len(sid_rows)

@pytest.mark.asyncio
async def test_import_export_csv(session, client):
    # Prepare a small CSV (string) and upload
    csv_content = 'academic_year,wing,grade,section,teacher_name,target_ratio\n2025-26,Alpha,7,C,Mr C,30\n'
    import io
    files = {'file': ('classes.csv', io.BytesIO(csv_content.encode('utf-8')), 'text/csv')}
    rimp = await client.post('/classes-admin/import', files=files)
    assert rimp.status_code == 200, rimp.text
    # Export
    rexp = await client.get('/classes-admin/export?academic_year=2025-26')
    assert rexp.status_code == 200
    exported = rexp.json()['csv']
    assert 'Alpha' in exported and '7,C' in exported.replace(',',',')
