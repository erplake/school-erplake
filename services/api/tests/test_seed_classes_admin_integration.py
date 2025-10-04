import pytest
from app.modules.classes.seed_classes import seed_classes, ACADEMIC_YEAR


@pytest.mark.asyncio
async def test_seed_classes_admin_integration(session, client):
    # Run seeder (idempotent)
    await seed_classes(include_classes_admin=True, include_exam_scores=True)
    # Fetch classes-admin data for academic year
    resp = await client.get(f"/classes-admin?academic_year={ACADEMIC_YEAR}&attendance_days=5&exam_window_days=30")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    # Expect multiple classes
    assert len(data) >= 2
    # Each class should have attendance_pct within 0..100 and results_avg within 0..100
    for c in data:
        assert 0 <= c['attendance_pct'] <= 100
        assert 0 <= c['results_avg'] <= 100
        # After seeding we expect some students
        assert c['total_students'] > 0