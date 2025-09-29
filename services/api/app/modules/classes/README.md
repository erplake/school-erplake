# Classes Module API

Endpoints provided:

GET /classes
- Returns array of class summary objects.
- Query Params:
  - grade: int (optional, 1..12) filter
  - section: str (optional)
  - limit: int (default 100, max 500)
  - offset: int (default 0)
- Fields: id (e.g. 8A), grade, section, class_teacher (string or null), total, male, female, attendance_pct, fee_due_count, fee_due_amount, result_status.
- Derived from distinct grade+section in `students` with joined aggregates.

GET /classes/{class_id}
- class_id formats accepted: `8-A` or `8A`.
- Returns roster plus aggregates. Roster includes: student_id, name, roll, guardian_phone, tags, fee_due_amount.
- Includes `class_teacher` when assigned (from `class_teachers`).

POST /classes/bulk-action
Body:
```
{
  "action": "set_result",
  "class_ids": ["8-A","9-B"],
  "params": { "result_status": "Published" }
}
```
- Supported actions: set_result (Published | Pending). Others return queued placeholder.

PATCH /classes/{class_id}
Body (any subset of fields):
```
{ "result_status": "Published" | "Pending", "class_teacher": "Ms. Patel" }
```
- result_status: upsert into class_status; validates allowed values.
- class_teacher: upsert into class_teachers. Sending empty string clears assignment (row deleted).
- Returns updated ClassDetail.

## Data Model Notes
Tables required (see schema.sql additions):
- class_status
- student_tags
- attendance_events
- fee_invoices

## Computations
- attendance_pct: integer = present_events * 100 / total_events for class (or 0).
- fee_due_amount: sum of (amount - paid_amount) for unpaid invoices; currently uses fee_invoices rows where settled_at IS NULL.
- fee_due_count: number of students in class with any outstanding amount.

## Future Enhancements
- Caching heavy aggregates (materialized view or periodic batch).
- Attendance streak / last present date enrichment.
- Bulk teacher assignment endpoint.
