import pytest
from sqlalchemy import text as sql_text


@pytest.mark.asyncio
async def test_attendance_window_affects_percentage(session, client):
    # Seed a class with one student and two days of attendance
    # Create wing & class
    rwing = await client.post('/wings', json={'academic_year':'2025-26','name':'Win','grade_start':1,'grade_end':1})
    wing_id = rwing.json()['id']
    rcls = await client.post('/classes-admin', json={'academic_year':'2025-26','wing_id':wing_id,'grade':1,'section':'A'})
    class_id = rcls.json()['id']

    # Insert single student
    await session.execute(sql_text("""
        INSERT INTO students (first_name, class, section, gender) VALUES
        ('Solo','1','A','F')
    """))
    sid = (await session.execute(sql_text("SELECT id FROM students WHERE class='1' AND section='A'"))).scalar_one()
    await session.commit()
    # Assign
    await client.post(f"/classes-admin/{class_id}/students", json={'student_ids':[sid], 'replace': True})

    # Insert attendance for 2 distinct days: present both days
    await session.execute(sql_text("INSERT INTO attendance_events (student_id, date, present) VALUES (:sid, CURRENT_DATE - INTERVAL '1 day', 1)"), {'sid': sid})
    await session.execute(sql_text("INSERT INTO attendance_events (student_id, date, present) VALUES (:sid, CURRENT_DATE, 1)"), {'sid': sid})
    await session.commit()

    # attendance_days=1 -> only today counts (1/1)
    r1 = await client.get('/classes-admin?academic_year=2025-26&attendance_days=1')
    cls_today = next(c for c in r1.json() if c['id']==class_id)
    pct1 = cls_today['attendance_pct']
    # attendance_days=7 -> two days counted (2/2) still 100 but ensure logic executes; modify one day to absent
    await session.execute(sql_text("UPDATE attendance_events SET present=0 WHERE date = CURRENT_DATE - INTERVAL '1 day' AND student_id=:sid"), {'sid': sid})
    await session.commit()
    r7 = await client.get('/classes-admin?academic_year=2025-26&attendance_days=7')
    cls_week = next(c for c in r7.json() if c['id']==class_id)
    pct7 = cls_week['attendance_pct']
    # Now pct7 should be 50 (1 present out of 2), pct1 stays 100
    assert pct1 == 100
    assert pct7 == 50


@pytest.mark.asyncio
async def test_exam_results_latest_within_window(session, client):
    # Create wing/class
    rw = await client.post('/wings', json={'academic_year':'2025-26','name':'Ex','grade_start':2,'grade_end':2})
    wing_id = rw.json()['id']
    rc = await client.post('/classes-admin', json={'academic_year':'2025-26','wing_id':wing_id,'grade':2,'section':'B'})
    class_id = rc.json()['id']
    # Insert two students
    await session.execute(sql_text("""
        INSERT INTO students (first_name, class, section, gender) VALUES
        ('S1','2','B','M'),
        ('S2','2','B','F')
    """))
    sids = (await session.execute(sql_text("SELECT id FROM students WHERE class='2' AND section='B' ORDER BY id"))).scalars().all()
    await session.commit()
    await client.post(f"/classes-admin/{class_id}/students", json={'student_ids': sids, 'replace': True})
    # Seed exam scores: S1 two exams, S2 one exam (all within 30 days)
    await session.execute(sql_text("INSERT INTO exam_scores (student_id, exam_date, exam_type, total_marks, obtained_marks) VALUES (:s, CURRENT_DATE - INTERVAL '10 day', 'term', 100, 40)"), {'s': sids[0]})
    await session.execute(sql_text("INSERT INTO exam_scores (student_id, exam_date, exam_type, total_marks, obtained_marks) VALUES (:s, CURRENT_DATE - INTERVAL '2 day', 'term', 100, 80)"), {'s': sids[0]})
    await session.execute(sql_text("INSERT INTO exam_scores (student_id, exam_date, exam_type, total_marks, obtained_marks) VALUES (:s, CURRENT_DATE - INTERVAL '5 day', 'term', 100, 50)"), {'s': sids[1]})
    await session.commit()
    r = await client.get('/classes-admin?academic_year=2025-26&exam_window_days=30')
    cls_obj = next(c for c in r.json() if c['id']==class_id)
    # Latest S1 exam = 80%, S2 = 50% -> average = 65%
    assert cls_obj['results_avg'] == 65


@pytest.mark.asyncio
async def test_cache_hit_and_miss(session, client):
    # Wing/class minimal
    rw = await client.post('/wings', json={'academic_year':'2025-26','name':'CacheWing','grade_start':3,'grade_end':3})
    wing_id = rw.json()['id']
    rc = await client.post('/classes-admin', json={'academic_year':'2025-26','wing_id':wing_id,'grade':3,'section':'C'})
    assert rc.status_code == 200
    # First call MISS
    r1 = await client.get('/classes-admin?academic_year=2025-26')
    assert r1.headers.get('x-cache') == 'MISS'
    # Second call HIT
    r2 = await client.get('/classes-admin?academic_year=2025-26')
    assert r2.headers.get('x-cache') == 'HIT'
    # Mutation invalidates (assign student)
    await session.execute(sql_text("INSERT INTO students (first_name, class, section, gender) VALUES ('CacheStu','3','C','M')"))
    sid = (await session.execute(sql_text("SELECT id FROM students WHERE class='3' AND section='C' ORDER BY id DESC LIMIT 1"))).scalar_one()
    await session.commit()
    await client.post(f"/classes-admin/{rc.json()['id']}/students", json={'student_ids':[sid], 'replace': False})
    r3 = await client.get('/classes-admin?academic_year=2025-26')
    assert r3.headers.get('x-cache') == 'MISS'
    # Next call re-cached
    r4 = await client.get('/classes-admin?academic_year=2025-26')
    assert r4.headers.get('x-cache') == 'HIT'