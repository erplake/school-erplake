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

`alembic.ini` + `alembic/` contain the migration environment. Ensure `DATABASE_URL` is set or Postgres env vars are present.

> NOTE: This is a scaffold. Implement real persistence, RBAC, and validations per your needs.


## Frontend (Vite + React Router)

Location: `apps/web`.

Features:
- React 18 + React Router layout (`layout.jsx`) with pages: Dashboard, Students (fetch example), Fees, Attendance, Invoices, Settings
- Central API helper (`src/api.js`) reading `VITE_API_BASE` and optional `VITE_DEV_ACCESS_TOKEN` for quick authenticated dev calls
- Basic styling in `src/styles.css`
- Students page demonstrates calling the protected `/students` endpoint (token required)

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


