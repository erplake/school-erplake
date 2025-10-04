import pytest
from httpx import AsyncClient

ACADEMIC_YEAR = "2025-26"

@pytest.mark.asyncio
async def test_wings_and_classes_end_to_end(session, client: AsyncClient):
    # 1. Create a wing
    wing_payload = {"academic_year": ACADEMIC_YEAR, "name": "Alpha", "grade_start": 5, "grade_end": 6, "target_ratio": 30, "head": "Head A"}
    r = await client.post("/api/wings", json=wing_payload)
    assert r.status_code in (200,201), r.text
    wing = r.json()

    # 2. Create class under wing
    class_payload = {"academic_year": ACADEMIC_YEAR, "wing_id": wing["id"], "grade": 5, "section": "A", "teacher_name": "Ms Test", "target_ratio": 30}
    r = await client.post("/api/classes-admin", json=class_payload)
    assert r.status_code in (200,201), r.text
    classroom = r.json()

    # 3. List wings
    r = await client.get(f"/api/wings?academic_year={ACADEMIC_YEAR}")
    assert r.status_code == 200
    wings_list = r.json()
    assert any(w["name"] == "Alpha" for w in wings_list)

    # 4. List classes-admin and verify created class present
    r = await client.get(f"/api/classes-admin?academic_year={ACADEMIC_YEAR}")
    assert r.status_code == 200, r.text
    classes_list = r.json()
    assert any(c["grade"] == 5 and c["section"] == "A" for c in classes_list)

    # 5. Update class (set target ratio & teacher)
    cid = classroom["id"]
    r = await client.patch(f"/api/classes-admin/{cid}", json={"target_ratio": 32, "teacher_name": "Ms Updated"})
    assert r.status_code == 200, r.text
    updated = r.json()
    assert updated.get("target_ratio") == 32
    assert updated.get("teacher_name") == "Ms Updated"

    # 6. Brand settings baseline fetch
    r = await client.get("/api/settings/brand")
    assert r.status_code == 200, r.text
    brand = r.json()
    assert "school_name" in brand

@pytest.mark.asyncio
async def test_student_assignment_flow(session, client: AsyncClient):
    # Precondition: at least one class and at least one student (seeders may have populated)
    # Create wing & class if missing
    r = await client.get(f"/api/wings?academic_year={ACADEMIC_YEAR}")
    assert r.status_code == 200
    wings = r.json()
    wing_id = None
    if not wings:
        r2 = await client.post("/api/wings", json={"academic_year": ACADEMIC_YEAR, "name": "Beta", "grade_start": 5, "grade_end": 5})
        assert r2.status_code in (200,201)
        wing_id = r2.json()["id"]
    else:
        wing_id = wings[0]["id"]

    r = await client.get(f"/api/classes-admin?academic_year={ACADEMIC_YEAR}")
    assert r.status_code == 200
    classes = r.json()
    if not classes:
        r2 = await client.post("/api/classes-admin", json={"academic_year": ACADEMIC_YEAR, "wing_id": wing_id, "grade": 5, "section": "B"})
        assert r2.status_code in (200,201)
        classes = [r2.json()]
    class_id = classes[0]["id"]

    # List students
    r = await client.get("/api/students")
    assert r.status_code == 200
    students = r.json()
    if not students:
        pytest.skip("No students available to assign")

    # Assign first student to class
    sid = students[0]["id"]
    assign_payload = {"student_ids": [sid]}
    r = await client.post(f"/api/classes-admin/{class_id}/students", json=assign_payload)
    assert r.status_code in (200,201), r.text

    # Re-fetch class-admin; ensure total_students increased or at least class listed
    r = await client.get(f"/api/classes-admin?academic_year={ACADEMIC_YEAR}")
    assert r.status_code == 200
    classes2 = r.json()
    target = next(c for c in classes2 if c["id"] == class_id)
    assert target["total_students"] >= 1
