import pytest

@pytest.mark.asyncio
async def test_create_and_list_student(client):
    payload = {"name": "Alice", "class_name": "5A"}
    r = await client.post("/students", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["name"] == "Alice"
    r2 = await client.get("/students")
    assert r2.status_code == 200
    students = r2.json()
    assert any(s["name"] == "Alice" for s in students)
