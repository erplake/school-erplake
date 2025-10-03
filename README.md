# School ERPLake — MVP Scaffold (FastAPI, Postgres, Redis, Razorpay, Gupshup)

Per‑school deploy: one VPS, Docker, Caddy reverse proxy, Postgres, Redis, and 4 Python services:
- `api` (FastAPI): auth/RBAC, students, classes, attendance, fees, payments webhook
- `ai` (FastAPI): text generation endpoints (templated, human‑in‑the‑loop)
- `worker` (RQ): PDFs, AI jobs, campaigns
- `notify` (FastAPI thin adapter): Gupshup WhatsApp sender + campaign schedule
- `billing` (FastAPI thin adapter): Razorpay/Stripe adapters + webhook verify

## Quick start (dev)
Docker path:
1. Copy `.env.example` to `.env` and fill secrets.
2. `docker compose up -d --build`
3. Visit `http://localhost` → `GET /healthz` → should return `ok`.
4. API at `/api`, AI at `/ai`. Caddy proxies both.

Local (no Docker) path for API service:
1. Copy `.env.local.example` to `.env.local` and adjust `DATABASE_URL` (ensure Postgres running locally).
2. (Optional) Start Redis locally or adjust `REDIS_URL`.
3. Install Python deps: `pip install -r services/api/requirements.txt`.
4. Run dev script: `powershell -ExecutionPolicy Bypass -File scripts/dev.ps1` (auto loads env, migrates, starts Uvicorn reload).
5. Open http://localhost:8000/docs

Environment precedence: direct process env > .env.local (loaded by script) > fallback defaults.

### Database Migrations (Alembic)
The legacy `infra/sql/schema.sql` bootstraps first-time containers. Ongoing changes should use Alembic:

Inside `services/api` (host or with docker exec):

```
alembic upgrade head          # apply latest migrations
alembic revision -m "change"  # create new migration (edit, then upgrade)
```

`alembic.ini` now points to the cleaned migration lineage in `alembic_clean/` (the legacy `alembic_legacy_20251003/` directory was archived on 2025-10-03). Ensure `DATABASE_URL` is set or Postgres env vars are present. See `services/api/MIGRATION_RESET.md` for details.

> NOTE: This is a scaffold. Implement real persistence, RBAC, and validations per your needs.

## Functional Scope & Domain Specification

An initial comprehensive functional specification covering Foundations (branding, auth, RBAC, audit, notifications), SIS, Academics (timetable, attendance, lesson plans, homework, labs, exams, gradebook/report cards), Communication & PTM, Fees & Accounts, Transport, Library, Inventory & Assets, Staff (HR lite), Events/Sports, Canteen/Uniform/Vendors, and Analytics dashboards is now maintained in:

`docs/functional-spec.md`

Use that document as the authoritative contract when introducing new models, migrations, API endpoints, or UI modules. Update it first (or in the same PR) when altering workflows (e.g., report card publication sequence, refund approval gate). A future `permissions-matrix.md` will enumerate granular action codes referenced by RBAC logic.
\n+Product Backlog Epics A–P (Admissions through Analytics) have now been appended to that spec under the section "Product Backlog Epics (A–P)". Treat each Epic and its listed user stories as the source of truth for scoping new migrations, endpoints, background jobs, and UI slices. When you implement or materially change a story:
1. Update `docs/functional-spec.md` (story status / notes) inline with the epic.
2. Add or adjust corresponding permission codes in `docs/permissions-matrix.md` (the matrix now exists — no longer “future”).
3. Create an Alembic migration to insert new permission rows (and default role mappings) before using them in routers.
4. Reference the permission via `require('domain:ACTION')` decorators / dependency calls.
5. If data shape changes, update Pydantic schemas & frontend API client types in the same PR.

Tip: Preface new permission codes with the epic domain (e.g. `ADMISSIONS.SUBMISSION_APPROVE`, `FEES.INVOICE_CANCEL`, `EXAMS.SCHEDULE_LOCK`) to keep the matrix navigable.

### Clean Multi‑Schema Adoption (Planned Refactor)

An initial multi‑schema baseline (core, academics, comms, fees, transport, library, inventory, events, health, audit) has been introduced via Alembic migration `20250929_1018_multi_schema_baseline`. It currently creates only foundational tables (school, user_account, user_role, academic_year, class_section) alongside existing legacy public tables.

If you want a clean rebuild using the richer domain design (recommended early before significant data accrues):
1. Stop running services (`stop-all` script or docker compose down).
2. Drop the dev database (ensure you are OK losing test data). For example (PowerShell):
	- `psql $env:DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid();"`
	- `dropdb your_db && createdb your_db` (or equivalent UI).
3. Run Alembic upgrade from a fresh clone: `alembic upgrade head` (scripts/start-all will also apply migrations by default).
4. Refactor ORM models to use schema‑qualified tables (e.g. `__table_args__ = {"schema": "core"}`) and gradually deprecate legacy tables (`students`, `attendance_student`, etc.).
5. Introduce new domain tables (exams, fees, transport, library, etc.) in incremental follow-up migrations mirroring `docs/functional-spec.md`.

During transition you can optionally create compatibility database views that match old table shapes while the API layer is refactored. Once all endpoints read from the new schemas, drop the views and remove denormalized columns.

Tracking next steps:
* Implement permission catalog & RBAC persistence (roles ↔ permissions ↔ users).
* Add guardians + enrollment tables mapping to legacy student responses.
* Replace denormalized attendance/fee aggregates with derived queries.
* Add audit log middleware writing to `audit.log`.

This section will evolve as refactors land; keep commit messages referencing spec section numbers.

### RBAC Permission Catalog

Dynamic permission enforcement now loads from database tables (`core.permission`, `core.role_permission`, `core.user_permission_override`). The initial seed is created in migration `20250929_1025_rbac_permissions`.

Reference matrix: `docs/permissions-matrix.md`.

Testing Strategy (RBAC):
The test suite operates against a transient schema created via `Base.metadata.create_all` (not full Alembic migrations) for speed. Permission success-path tests that require seeded `core.permission` + `core.role_permission` rows are deferred; instead we validate:
1. Enforcement path: endpoints guarded by `require('code')` return 403 for roles lacking the code when `RBAC_ENFORCE=1`.
2. Bypass path: with `RBAC_ENFORCE=0` the same endpoints return 200/empty payload even without DB permission rows (graceful development mode).

If you need full permission matrix tests, run migrations inside tests (slower) or add a helper fixture that inserts the minimal permission rows your tests rely on.

To add a new permission:
1. Create an Alembic migration inserting into `core.permission` and mapping defaults in `core.role_permission`.
2. Update `docs/permissions-matrix.md`.
3. Use `require('domain:action')` in routers.
4. (Optional) Grant/revoke for a specific user via `core.user_permission_override` rows.

### New Domain Slices: Files, Comms, Payments (2025-09-29)

These modules were introduced as part of Epics C/D foundational scaffolding. Each exposes a minimal CRUD surface and matching permission codes (seeded by migration `20250929_1205_extend_permissions_files_comms_payments`).

Files API (schema: `files` placeholder ORM models — full multi-schema refactor pending):
```
POST /files/blobs              (perm: files:blob_register)
GET  /files/blobs/{id}         (perm: files:blob_read)
POST /files/attachments        (perm: files:attachment_create)
GET  /files/attachments/{id}   (perm: files:attachment_read)
```
Blob registration stores metadata only (no binary). `storage_backend` + `storage_key` integrate with future drivers (local, S3, GDrive). A presign endpoint stub exists (`/files/presign`) returning 501 for now.

Comms API (template catalog + outbox enqueue):
```
POST /comms/templates          (perm: comms:template_create)
GET  /comms/templates          (perm: comms:template_list)
POST /comms/outbox             (perm: comms:outbox_enqueue)
GET  /comms/outbox/{id}        (perm: comms:outbox_read)
```
Outbox rows start at status=PENDING. Delivery to real providers (Email/SMS/WhatsApp) will be implemented by channel-specific adapters. A lightweight polling worker sets PENDING → SENT (simulation) as a placeholder.

Payments API (gateway transaction registry + reconciliation ledger):
```
POST /payments/pg              (perm: payments:tx_create)
GET  /payments/pg/{id}         (perm: payments:tx_read)
POST /payments/recon           (perm: payments:recon_create)
GET  /payments/recon/{id}      (perm: payments:recon_read)
```
`pg_transaction` records store gateway references (order/payment/refund ids) and opaque JSON payloads. `recon_ledger` captures financial lifecycle steps (AUTH, CAPTURED, REFUND, ADJUST). Future work: tie to `fees.invoice` and derive settlement status metrics.

Outbox Worker (development/local):
```
python -m app.workers.outbox_worker
```
Configuration: Poll interval 2s, batch size 20. Logs processed counts. Replace the simulation block with channel dispatch + retry/backoff (exponential) in future iterations. Consider converting to a dedicated service or integrating with existing `worker` process.

Permissions Reference (added by migration):
```
files:blob_register, files:blob_read, files:attachment_create, files:attachment_read,
comms:template_create, comms:template_list, comms:outbox_enqueue, comms:outbox_read,
payments:tx_create, payments:tx_read, payments:recon_create, payments:recon_read
```
Accountant role receives payment permissions; Admin receives all. Adjust via `core.role_permission` mutations / overrides.


## Frontend (Vite + React Router)

Location: `apps/web`.

Features:
- React 18 + React Router layout (`layout.jsx`) with pages: Dashboard, Students (enriched data grid), Fees, Attendance, Invoices, Settings
- Central API helper (`src/api.js`) reading `VITE_API_BASE` and optional `VITE_DEV_ACCESS_TOKEN` for quick authenticated dev calls
- Basic styling in `src/styles.css`
- Students page now uses enriched backend fields and slide-over profile sheet.
 - RBAC (client demo) provider + management UI with capability taxonomy (localStorage persisted)
 - Template Manager (system templates) powering announcement composition (client demo)
 - Import Center (simulated multi-step CSV ingest + job log, client demo)
 - Discipline Center (incident logging, status transitions, KPIs, RBAC-gated actions – client-side prototype)
 - Admissions Management now guarded by new capabilities: `admissions.view` (read) and `admissions.manage` (create / advance / settings)

Student API prototype fields returned:
```
id, admission_no, first_name, last_name, klass, section, guardian_phone,
attendance_pct, fee_due_amount, transport (JSON), tags (comma-separated),
absent_today, updated_at
```

Additional placeholder endpoints (will later integrate real services):
```
POST /students/{id}/message { message }
GET  /students/{id}/bonafide
```
Frontend sheet exposes guardian messaging (queued stub) & bonafide certificate preview.

Environment file example: copy `apps/web/.env.example` to `apps/web/.env.local` (or `.env`) and set:
```
VITE_API_BASE=http://localhost:8000
# Optional fast dev bypass (only for local experiments)
VITE_DEV_ACCESS_TOKEN=eyJhbGciOi...<JWT>
```

Install & run:
```
cd apps/web
npm install
npm run dev
```

Then visit: http://localhost:5173 (or the auto-assigned port if busy).

Production build (placeholder):
```
npm run build
```
Outputs will land in `dist/` (hook into Caddy / CDN later).

### New: Transport Management UI (Demo Data)

A richer fleet operations page has been added at route:

`/transport/management`

Features included (client‑side demo only – no API calls yet):
- Fleet table with filtering (search, route, status, alerts‑only)
- KPI cards (fleet size, on trip, maintenance, service due, expiring documents)
- Service interval tracking with next service calculation and status badges
- Document expiry highlighting (insurance, permit, fitness, PUC) with color codes
- Driver license expiry badges
- GPS freshness badge (live / minutes ago / offline)
- Bulk selection (assign route, mark maintenance)
- Per‑bus actions (assign driver, log service, log incident, edit bus)
- Modal forms for driver assignment, service logging, incidents, and bus create/edit
- CSV export (filtered subset) + print friendly layout
- Alerts panel aggregating upcoming service/doc/license expirations

Data is seeded in‑memory in `TransportManagement.jsx`. To integrate with real APIs later:
1. Replace the seeded `useState([...])` arrays (`drivers`, `routes`, `buses`) with `useEffect` fetch calls.
2. Centralize date helpers & badge logic in a shared `transport/utils.js` module when backend endpoints are ready.
3. Introduce suspense/loading + mutation hooks (e.g. React Query) and optimistic updates replacing the current direct state maps.

Navigation: A new sidebar link "Transport Mgmt" appears under Finance & HR. The original `/transport` placeholder remains (can be converted to a high‑level routes view or redirect later).

CSV Export: Generates `transport-fleet-YYYY-MM-DD.csv` with quoted/escaped values (Excel compatible).

Print: Uses browser print; future enhancement could render a condensed printable manifest.

Planned follow‑ups (not yet implemented):
- Persist incidents & service history via API
- Driver availability & shift planning
- Route optimization integration
- Geo fencing & live map embed
- Permission‑gated maintenance actions

File location: `apps/web/src/pages/transport/TransportManagement.jsx`.

If you prefer the advanced page to be the default `/transport`, swap the route components or add a redirect in `main.jsx`.

## Unified Dev Scripts (Background Managed)

Two layers now exist for local orchestration depending on how much control you want:

### Option A: PowerShell (Windows)

PowerShell scripts are still present locally but now ignored by git (so Linux-only contributors are not forced to keep Windows scripts). They remain fully usable on Windows:

```
pwsh -File scripts/start-all.ps1 -Open
pwsh -File scripts/status.ps1
pwsh -File scripts/logs.ps1 -Follow
pwsh -File scripts/stop-all.ps1
```

Key switches (same as before): `-NoDb -NoApi -NoWeb -Rebuild -EnvFile -NoMigrate -Attach -Open -ApiPort -WebPort`.

### Option B: Bash (Linux / WSL / macOS)

Cross‑platform bash equivalents live alongside the PowerShell versions:

```
./scripts/start-all.sh --open
./scripts/status.sh
./scripts/logs.sh --follow
./scripts/stop-all.sh
```

Flags (long form only):

`start-all.sh`:
- `--rebuild` force image rebuild
- `--no-db` / `--no-api` / `--no-web`
- `--env-file FILE` (default .env.local)
- `--api-port N` / `--web-port N` (auto bumps if occupied)
- `--no-migrate` skip Alembic upgrade
- `--attach` tail logs after starting (Ctrl+C to detach)
- `--open` attempt to open browser (uses `xdg-open` if available)

`stop-all.sh`:
- `--db` / `--api` / `--web` (default: all) or `--all`

`status.sh`:
- No flags; shows RUNNING / stopped, performs lightweight health probes, lists docker compose services, and probes common local Postgres ports (5544, 5432).

`logs.sh`:
- `--target api|web|all` (default all)
- `--follow` (stream)
- `--lines N` (default 40)

State & logs:
- PID + port files: `scripts/.state/{api.pid,web.pid,db.docker,api.port,web.port}`
- Logs: `scripts/.state/logs/*.log`

Port allocation:
- Both API and web dev servers auto‑increment from the requested starting port until a free one is found.

Migrations:
- By default `start-all.sh` runs `alembic upgrade head` if `services/api/alembic.ini` exists; disable with `--no-migrate`.

### Advanced (Legacy) Stack Script

`scripts/stack.ps1` still exists for Windows users wanting latency color output & restart semantics.

Both approaches (PowerShell & Bash) share the same state directory.

Typical workflow:
```
./scripts/start-all.sh --open
# iterate ...
./scripts/logs.sh --follow
./scripts/stop-all.sh
```

If migrating from the previous single script approach you can keep using:
```
pwsh -File scripts/stack.ps1 -Command up -Open
```
All new docs reference the simpler `start-all.ps1` for clarity.

## Health Endpoints

Every FastAPI service exposes `GET /healthz` returning `{ "ok": true }` for lightweight probes:
- API: service readiness / basic liveness
- AI / Notify / Billing: lightweight JSON ack

The `stack.ps1` script uses the API's endpoint to measure latency; extend similarly for others if you co-run them.

## MinIO (Object Storage)

Docker Compose includes a MinIO service (port 9000). Set:
```
MINIO_ROOT_USER=xxx
MINIO_ROOT_PASSWORD=xxx
MINIO_BUCKET=school-media
MINIO_ENDPOINT=http://localhost:9000
```
When `MINIO_ENDPOINT` is set and `STORAGE_DRIVER=s3`, `s3_storage.py` will route to MinIO. Otherwise fallback is local disk.

## Storage Drivers

Configured via `STORAGE_DRIVER`:
- `local` (default): writes under `LOCAL_STORAGE_PATH` (e.g. `var/storage`).
- `s3` / MinIO: set `MINIO_ENDPOINT`, `MINIO_BUCKET`, credentials; `s3_storage.py` handles both AWS S3 & MinIO.
- `gdrive`: placeholder (`gdrive_storage.py`) pending implementation.

`LocalStorage` implements a sandboxed filesystem backend for development.

## Pre-commit Hooks

Install tooling:
```
pip install pre-commit
pre-commit install
```

Configured hooks:
- Black (format) 100 char line length
- Ruff (lint & autofix)
- Mypy (loose, ignore missing imports)
- Trailing whitespace & EOF fixer

## Testing

Run tests from repo root:
```
pytest -q
```

Test stack:
- pytest + pytest-asyncio (`asyncio_mode=auto`)
- httpx AsyncClient for FastAPI in-process requests
- Temporary schema created & dropped each session (db isolation WIP — consider separate test DB)

Included tests:
- Student create & list
- Bulk attendance idempotency reuse of response

## Seeding Data

To populate a fresh database with demo rows:
```
pwsh -File scripts/seed.ps1
```
This applies migrations then inserts demo users, students, fee heads, one invoice, and attendance for today.

Verify in psql:
```
psql $env:DATABASE_URL -c "\dt"  # list tables
psql $env:DATABASE_URL -c "select * from students;"
```

### New: Classroom / Classes Analytics Seeding

An extended seed for the classroom domain (wings, school classes, student ↔ class mapping, attendance window history, fees, exam scores) now lives at:

`python -m app.modules.classes.seed_classes`

It is idempotent and will:
* Insert synthetic students across grades 5–10 (sections A/B) if missing
* Generate 5 days of historical attendance (random presence)
* Create fee invoices (open, partial, settled) per student
* Assign random tags & teacher names
* Create a wing + `school_classes` rows for a derived academic year (e.g. 2025-26)
* Map students into `class_students`
* Insert two exam scores per student (older lower score, newer higher score) for results averaging

Run (from `services/api` or repo root):
```
python -m app.modules.classes.seed_classes
```

## Classroom Management / Classes Admin API

Endpoint: `GET /classes-admin`

Returns enriched per‑class aggregates consumed by the advanced classroom dashboard.

Response fields (per class):
```
id, academic_year, wing_id, grade, section, teacher_name, target_ratio,
total_students, male, female,
attendance_pct,          # 0-100 rolling window attendance %
fee_due_pct,             # % of students with at least one outstanding (unsettled) fee invoice
results_avg              # Average of each student's latest exam percentage within window
```

### Query Parameters
* `academic_year` (optional): filter classes by academic year. If omitted returns all.
* `attendance_days` (default 1): Rolling day window for attendance percentage. Capped 1–120.
	* Attendance % = (Sum of present events in window) / (attendance_days * total_students) * 100.
* `exam_window_days` (default 90): Look‑back window for selecting each student's latest exam score. Capped 1–365.

### Exam Scores Source
Schema created via native SQL: `infra/sql/exam_scores.sql`
```
exam_scores(id, student_id, exam_date, exam_type, total_marks, obtained_marks, created_at)
```
Latest exam per student within the `exam_window_days` window is used; class `results_avg` is the mean of (obtained/total * 100) across those students that have an exam.

### Attendance Calculation Details
Multiple events for a student per day are summed; typical usage is one row per day per student (present=1 / absent=0). If you later store multiple session records, consider replacing the raw sum with a DISTINCT ON (student_id, date) subquery.

### Fee Due Percentage
Counts students with any invoice where `settled_at IS NULL` and `amount - paid_amount > 0`.

### Caching
In‑process TTL cache (30s) keyed by `(academic_year, attendance_days, exam_window_days)`.
Response includes header:
```
X-Cache: HIT | MISS
```
Invalidated on:
* Class create / update
* Student assignment to class
* CSV import of classes

Planned optional enhancement: Redis‑backed cache implementing same key semantics for multi‑process deployments.

### CSV Import / Export
Import endpoint: `POST /classes-admin/import` with file field `file`.
Expected header:
```
academic_year,wing,grade,section,teacher_name,target_ratio
```
Export endpoint: `GET /classes-admin/export?academic_year=YYYY-YY` returns `{ csv: "..." }`.

### Example Fetch
```
GET /classes-admin?academic_year=2025-26&attendance_days=7&exam_window_days=60
```
Sample (trimmed) JSON:
```json
[
	{
		"id": 12,
		"academic_year": "2025-26",
		"grade": 5,
		"section": "A",
		"total_students": 12,
		"male": 6,
		"female": 6,
		"attendance_pct": 82,
		"fee_due_pct": 58,
		"results_avg": 67
	}
]
```

### Testing Coverage
Added tests:
* Attendance window variation (`attendance_days=1` vs `7`)
* Exam results averaging (latest exam selection)
* Cache HIT/MISS header behavior & invalidation
* Full seed integration producing valid aggregate ranges

Run the suite:
```
pytest -q -k classes_admin
```

### Extending
Potential next steps:
* Subject-level exam score breakdown (introduce `exam_subject_scores`)
* Redis cache backend (feature flag `CLASSES_CACHE_BACKEND=redis`)
* Materialized view or periodic job for heavy aggregates if usage grows
* Attendance normalization to one record per day per student (session collapse)



## Roadmap (next)

- Add OTP auth end-to-end tests (including Redis mock/fallback)
- Expand RBAC persistence
- Worker job definitions & scheduling
- Additional domain modules (exams, library, transport, HR)
- CI workflow (GitHub Actions) with matrix (Python 3.11) running lint + tests

## Troubleshooting: Tables Missing

If you don't see tables in your database:
1. Confirm you are looking at the correct database: `echo $env:DATABASE_URL` (PowerShell).
2. Run migrations manually:
	```
	cd services/api
	python -m alembic upgrade head
	```

## Frontend Platform Foundations (Added)

The React UI now includes three client-side foundational modules pending backend integration:

### RBAC Management (`/system/rbac`)
Source: `apps/web/src/context/RBACContext.jsx` & page `pages/system/RBACManagement.jsx`.
Features:
- Local capability taxonomy (domain.action) with role → capability assignments.
- Impersonation selector for quick permission testing.
- `<RequireCapability capability="x">` component for conditional rendering.
- Persistence: localStorage (future: sync with API roles & permissions tables).

### Template Manager (`/system/templates`)
Source: `context/TemplateContext.jsx` & page `pages/system/TemplateManager.jsx`.
Features:
- Types: announcement, email, sms, certificate.
- CRUD (create / edit / clone / delete) with simple placeholder highlighting (`{{variable.name}}`).
- Local persistence (future: map to comms/templates API + versioning + approval workflow).

### Import Center (`/system/import-center`)
Source: `pages/system/ImportCenter.jsx`.
Features:
- Multi-step (Upload → Map Columns → Review → Commit) simulation.
- Domain selector (students, staff, inventory) with required column schema hints.
- Job history persisted locally with simulated row counts and warnings.
- Backup / Export panel gated by `backup.export` capability.

Planned backend alignment:
1. Replace localStorage with REST endpoints (jobs, templates, roles).
2. Introduce background job status polling via React Query.
3. Add audit log entries for role/permission changes & template edits.

These modules serve as scaffolding to unblock higher-level features (Discipline, Procurement, Scholarship workflows) that will depend on permissions, templated notifications, and bulk data onboarding.
### Capability Catalog Export (Frontend → Docs Sync)

The frontend RBAC prototype defines a capability taxonomy in `apps/web/src/context/RBACContext.jsx` (array `CAPABILITIES`). A helper at `apps/web/src/context/capabilitiesExport.js` can produce portable snapshots:

Runtime (in browser dev console):
```
copy(window.__CAPS_JSON__())   // JSON snapshot (generatedAt, count, capabilities[])
copy(window.__CAPS_MD__())     // Markdown table
```

Programmatic (Node / build tooling):
```
import { getCapabilitiesList, toJSON, toMarkdown } from './src/context/capabilitiesExport';
console.log(toJSON());
```

Intended workflow (until backend permission matrix is authoritative):
1. Add / adjust capabilities in `RBACContext.jsx`.
2. Generate Markdown via helper and paste into `docs/permissions-matrix.md` under a section "Frontend Prototype Capabilities".
3. When backend migration adds formal permissions, reconcile names (prefer kebab or dot consistently — current prototype uses dot form).
4. Remove capabilities here once fully driven by API-provided matrix (future: fetch & hydrate roles dynamically).

Note: The helper also exposes a sorted list ensuring deterministic diffs.

### Enhanced Library Module (Frontend Prototype)
The basic library catalog page has been replaced with an advanced in‑memory prototype (`apps/web/src/pages/library/Library.jsx`) featuring:
* Catalog grid/list with multi‑facet filters (category, format, language) & search (title/author/ISBN)
* Drawer detail view (activity, stock, tags) and inline edit flow
* Issue modal with member selection & due date; tracks active loans (client-side)
* Basic loan listing & overdue highlighting (foundation for circulation tab expansion)
* Add/Edit book form with category/format/language & tag parsing
* RBAC enforcement: `library.view` (page access) / `library.manage` (issue, add/edit, stock mutation)

Future backend alignment: replace local arrays with REST fetch; persist loans, reservations, vendors, and subscription data; move constants to shared domain types; surface real overdue calculations and fines.
3. Ensure Postgres user has rights to create tables.
4. If DSN changed from async pattern, Alembic still uses sync `postgresql://` DSN (ok). Make sure it's reachable.
5. Inspect migration status: `alembic history --verbose`.
6. Recreate DB (DANGER – drops data): drop & create then rerun upgrade.
7. Check for errors in migration output (silent network/SSL issues on Windows can appear if wrong libpq).

After fixing, run seeding again: `pwsh -File scripts/seed.ps1`.

## Auth & Quick Dev Token

Auth flow (simplified MVP): OTP verification issues a JWT with role claims. Protected routes (e.g. `/students`) require a valid bearer token.

For quick frontend iteration you can set `VITE_DEV_ACCESS_TOKEN` (the script inserts it as an `Authorization: Bearer` header for fetches). Remove this for real environments.

Endpoints of interest:
- `POST /auth/otp/start` { phone }
- `POST /auth/otp/verify` { phone, code } → returns access + refresh tokens

## API Latency Colors (Stack Script)

Thresholds (config in script):
- Fast (<100ms) – healthy
- Moderate (100–299ms) – watch
- Slow (>=300ms) – investigate (DB wait, cold start, etc.)
- Timeout – request exceeded 3s window

Adjust logic in `scripts/stack.ps1` if your baseline differs.

---
Updated: Added unified stack script (-Open, latency probe), React frontend scaffold, and improved README guidance.


## Chat Message Sequencing & FTS Search

### Per-Conversation Sequence
Chat messages use a database trigger (`assign_message_sequence`) to assign a monotonically increasing `sequence` **per conversation** at insert time. This avoids race conditions from concurrent writers and keeps ordering stable even if `created_at` timestamps are very close.

Implementation details:
- Table `conversations` has a `next_message_seq` counter (bigint) initialized & backfilled by migration `20250928_0005`.
- Trigger function locks the row (`UPDATE ... RETURNING`) to atomically increment `next_message_seq` and write the resulting value to `messages.sequence` on INSERT.
- ORM model leaves `sequence` nullable pre-flush; after commit it will be populated.

Do NOT attempt to set `sequence` manually in application code; let the trigger manage it. Rely on ordering: `ORDER BY sequence ASC` (or DESC for pagination windows).

### Bulk Inserts (Safety)
If you need to bulk insert messages:
1. Use regular `INSERT` statements without specifying `sequence`.
2. Keep each message as its own INSERT (the trigger fires per row). Multi-row INSERTs also work, but each row still causes a trigger invocation.
3. For very large batches (e.g., history import), batch in chronological order to keep sequence aligned with time; if not possible, sequence still guarantees ordering but timestamps may look inverted.
4. Avoid manual `UPDATE` of `conversations.next_message_seq`; corrupting this value causes sequence collisions or gaps.

To verify sequencing integrity:
```
select conversation_id, count(*) as messages,
	   max(sequence) as max_seq,
	   bool_and(sequence is not null) as all_have_sequence,
	   (max(sequence) - count(*) + 1) = min(sequence) as contiguous
from messages group by 1 limit 20;
```

### Full-Text Search (Messages & Social Posts)
GIN indexes (migration `20250928_0005`) enable fast FTS over `messages.body` and `social_posts.body`.

Endpoints:
- `GET /chat/search/messages?q=terms[&conversation_id=uuid][&limit=50][&lang=english]`
- `GET /social/search/posts?q=terms[&platform=xyz][&limit=50][&lang=english]`

Behavior:
- Uses `websearch_to_tsquery('english', q)` for intuitive Google-like operators (`phrase`, OR, -exclude).
- Returns ranked results with an HTML-safe `snippet` via `ts_headline` highlighting matches (consumer should render safely / escape as needed in UI).
- Results limited (default 50) and ordered by rank then recency.
- Languages supported: `english`, `simple` (set via `lang=`). Unsupported values → 400.
- Rate limiting: per-user sliding window (60s) max 30 chat searches; social posts share generic validation (extend similarly if needed).
- Query guard: empty or length >120 chars → 400.

Response schemas:
- Chat: array of `MessageSearchResult { id, conversation_id, sender_id, sequence, created_at, snippet, rank }`
- Social: array of `SocialPostSearchResult { id, platform, title, snippet, rank, created_at }`

Example curl:
```
curl "http://localhost:8000/chat/search/messages?q=fee+invoice"
curl "http://localhost:8000/social/search/posts?q=annual+day&platform=instagram"
```

### Pagination Strategy
For messages: use `sequence` for forward pagination (`after_sequence=123`). For reverse/initial loads, request newest slice and reverse client-side to display oldest-first.

### Failure / Edge Cases
- An empty or whitespace-only `q` returns 400.
- If a user lacks membership in a conversation (messages search), rows are excluded by the join filter.
- Deleted/masked messages still appear unless filtered application-side (future enhancement: add `deleted_at is null` clause if needed).

### Future Enhancements (Suggested)
- Add language detection and per-language tsvector columns.
- Materialize aggregated conversation search documents for multi-field ranking (title + last messages).
- Streaming search suggestions via trigram or prefix indexes.


