import pytest

@pytest.mark.asyncio
async def test_classes_aggregation_basic(session, client):
    # Minimal seed for two classes
    from sqlalchemy import text as _text
    await session.execute(_text("""
        INSERT INTO students (first_name, class, section, gender) VALUES
        ('S1','5','A','F'), ('S2','5','A','M'), ('S3','6','B','F')
    """))
    await session.execute(_text("""
        INSERT INTO attendance_events (student_id,date,present) VALUES
        (1,CURRENT_DATE,1),(2,CURRENT_DATE,0),(3,CURRENT_DATE,1)
    """))
    await session.execute(_text("""
        INSERT INTO fee_invoices (student_id, amount, paid_amount) VALUES
        (1,5000,0),(2,5000,2500),(3,4000,4000)
    """))
    await session.commit()
    resp = await client.get('/classes')
    assert resp.status_code == 200
    data = resp.json()
    # IDs like '5A', '6B'
    ids = {c['id'] for c in data}
    assert '5A' in ids and '6B' in ids
    c5a = next(c for c in data if c['id']=='5A')
    # Basic shape assertions
    for field in ['total','male','female','attendance_pct','fee_due_count','fee_due_amount','class_teacher','result_status']:
        assert field in c5a
    assert c5a['total'] == 2
    # Attendance percent should be between 0 and 100
    assert 0 <= c5a['attendance_pct'] <= 100
