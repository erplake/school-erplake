import pytest, time, hashlib, json

@pytest.mark.asyncio
async def test_bulk_attendance_idempotent(client):
    # ensure students exist
    for i in range(1,4):
        await client.post("/students", json={"name": f"S{i}", "class_name": "5A"})
    records = [
        {"student_id": 1, "date": "2025-09-28", "status": "present"},
        {"student_id": 2, "date": "2025-09-28", "status": "absent"},
        {"student_id": 3, "date": "2025-09-28", "status": "present"},
    ]
    body = json.dumps(records, separators=(",", ":")).encode()
    idem_key = hashlib.sha256(body).hexdigest()
    r1 = await client.post("/attendance/bulk", json=records, headers={"Idempotency-Key": idem_key})
    assert r1.status_code == 200, r1.text
    r2 = await client.post("/attendance/bulk", json=records, headers={"Idempotency-Key": idem_key})
    assert r2.status_code == 200
    assert r1.json() == r2.json()
