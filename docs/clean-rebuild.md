# Clean Rebuild & Multi-Schema Baseline

_Last updated: 2025-09-29_

This guide describes how to destroy your current dev database, apply the consolidated multi‑schema baseline (`schema.sql`), align Alembic, and begin refactoring models to schema‑qualified tables.

## 1. When to Use
Use a clean rebuild if:
- You have only disposable sample/demo data.
- You want to adopt the full domain schema (core, academics, fees, transport, etc.) early before incremental tech debt accumulates.
- You are comfortable archiving old migrations that targeted ad‑hoc public tables.

## 2. One-Command Automation (PowerShell)

From repo root:
```
pwsh -File scripts/rebuild_clean.ps1 -Database schooldb -Password <pg_pw> -Force -StampAlembic
```
Parameters:
- `-Database` (default `schooldb`)
- `-Host` (default `localhost`)
- `-Port` (default `5544`)
- `-User` (default `postgres`)
- `-Password` (if omitted, rely on pgpass / prompt)
- `-SchemaFile` (default `schema.sql`)
- `-StampAlembic` stamps Alembic head after rebuild.
- `-Force` skips confirmation prompt.

## 3. Manual Steps (If You Prefer)
1. Stop services.
2. `DROP DATABASE` + recreate.
3. `psql -d newdb -f schema.sql`.
4. Set `DATABASE_URL` env.
5. (Optional) `alembic stamp head` (empty baseline revision beforehand).

## 4. Alembic Baseline Options
### Option A – Empty Baseline (Recommended)
1. Archive existing legacy migrations (zip `alembic/versions/*`).
2. `alembic revision -m "baseline schema applied externally" --empty`.
3. Leave upgrade/downgrade empty with comment.
4. `alembic stamp head`.

### Option B – Model Parity Check
1. Define all ORM models mapping to new schema.
2. `alembic revision --autogenerate -m "baseline"` (should be no ops).
3. Apply; future changes now diff cleanly.

## 5. ORM Model Refactor Pattern
Example mapping to `core.student`:
```python
class Student(Base):
    __tablename__ = "student"
    __table_args__ = {"schema": "core"}
    id = mapped_column(BigInteger, primary_key=True)
    adm_no = mapped_column(String)
    first_name = mapped_column(String, nullable=False)
    last_name = mapped_column(String)
    # ... additional fields
```
Enrollment instead of `class` / `section` on the student row:
```python
class Enrollment(Base):
    __tablename__ = "enrollment"
    __table_args__ = {"schema": "academics"}
    id = mapped_column(BigInteger, primary_key=True)
    student_id = mapped_column(ForeignKey("core.student.id", ondelete="CASCADE"))
    class_section_id = mapped_column(ForeignKey("academics.class_section.id", ondelete="CASCADE"))
    roll_no = mapped_column(Integer)
```

## 6. Incremental Router Migration Sequence
1. Auth / Users → switch to `core.user_account`.
2. Students → `core.student` + join with `academics.enrollment` + `academics.class_section` for klass/section fields.
3. Attendance → replace direct table with `attendance_day` + `attendance_entry` logic (create or fetch day, then upsert entry rows).
4. Fees → invoices rewritten using line items & balance calculations; deprecate legacy amount columns.
5. Transport / Library / Inventory / Events / Health as vertical slices.

## 7. Dropping Legacy Tables
After all endpoints are migrated and tests green:
1. Create migration: drop legacy public tables (`students`, `attendance_student`, `invoices`, `payments`, etc.).
2. Update README to mark migration completion.

## 8. Compatibility Views (Optional Bridge)
To avoid breakage while refactoring:
```sql
CREATE OR REPLACE VIEW students AS
SELECT s.id,
       s.adm_no AS admission_no,
       s.first_name,
       s.last_name,
       cs.grade_label AS class,
       cs.section_label AS section
FROM core.student s
LEFT JOIN academics.enrollment e ON e.student_id = s.id
LEFT JOIN academics.class_section cs ON cs.id = e.class_section_id;
```
Mark legacy ORM models as read-only if using views.

## 9. Testing Checklist
- `alembic stamp head` then `alembic revision --autogenerate` shows no unexpected diffs.
- Creating a school + student + class_section + enrollment works end-to-end.
- Attendance marking creates day + entries with idempotent upsert.
- Fee invoice lines sum to invoice total; balance due updates after payment insert.

## 10. Future Enhancements
- Seed data script adapted to new schema (schools, academic year, one class_section, sample students, enrollments).
- Add a data migration command to import old data (if needed) into new tables.
- Introduce a metadata version table to track baseline adoption (optional).

## 11. Troubleshooting
| Problem | Cause | Fix |
|---------|-------|-----|
| Autogenerate wants to drop tables you created manually | Old migrations still loaded | Archive old versions, recreate baseline revision |
| Enum mismatch | Code adds value not present | Run ALTER TYPE migration before model usage |
| Permission errors after rebuild | RBAC tables empty | Re-run RBAC migration or reseed permissions |

---
Adopt early, keep lean. Update this doc whenever structural steps change.
