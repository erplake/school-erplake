# School Platform Functional Specification

_Last updated: 2025-09-29_

This document captures the foundational multi‑module scope for the School ERPLake platform. It defines baseline capabilities, role scopes, workflows, integration points, gating windows, and publication / approval semantics. Treat this as the authoritative functional contract for subsequent domain design, backlog grooming, and API/schema evolution.

## 0. Foundation (Global Layer)

### 0.1 Branding & Tenancy
- Per‑school (tenant) attributes: name, logo (raster + optional SVG), wordmark, primary & accent color tokens, favicon, letterhead assets, footer/legal text, academic year code(s), time zone, locale.
- Subdomain mapping: `<tenant>.school.example` with CNAME provisioning; store verification DNS token.
- Runtime theme injection: CSS variables resolved from tenant tokens (fallback to defaults if unset).

### 0.2 Users & Roles (Baseline Roles)
Roles (extensible; implement RBAC matrix):
Owner, Principal, Admin, Class Teacher, Subject Teacher, Accountant, Librarian, Transport, Nurse, Counselor, Security, Vendor, Parent/Guardian, Student (read‑only self).
- Support multiple role assignments per user (e.g., Teacher + House Mentor).
- Role scoping: class/section or subject specific grants (fine-grained for teachers, counselors, transport staff).
- Future: custom roles with permission bundle editing UI.

### 0.3 Authentication & Security
- OTP (WhatsApp/SMS) via Gupshup: start & verify endpoints with rate limiting & lockout on repeated failure.
- MFA (phase 2): TOTP app enrollment (QR + recovery codes) with policy flag (required for staff).
- Optional SSO: Google Workspace (domain allowlist) – just‑in‑time provisioning of users.
- Idle session timeout (config per tenant) & absolute session lifetime.
- Device/session limits: active session list & remote revoke.
- IP Allow/Deny (optional): CIDR list per tenant (enforced only if configured).
- Admin Impersonation: privileged users can assume another user context with mandatory reason + immutable audit record (start/end events).
- Password fallback (optional for parents in markets where OTP unreliable) – salted hash, rotation reminder.

### 0.4 Permissions Model
- CRUD per domain module entity (granular: create, read, update, delete).
- Special action gates: Approve (fee refund), Publish (report card, timetable, lesson plan), Finalize (exam marks), Release (admissions offer).
- Derived permissions: If user has Approve for refunds, can view pending refund requests regardless of invoice visibility.
- Deny overrides allow (explicit deny list for conflict resolution).

### 0.5 Windows / Locks
Configurable open/close windows controlling operations:
- Exams mark entry window
- Report Cards publish window
- Lesson Plan edit lock window (post-publication freeze)
- Admissions application window
- Timetable publish window
Behavior: outside window → soft lock (view allowed, edit blocked) with override permission for Admin/Principal.

### 0.6 Integrations
- Gupshup (WhatsApp/SMS): OTP, announcements, attendance alerts, fee reminders, custom campaigns.
- Email provider (pluggable; SMTP baseline).
- Razorpay (fees) – webhooks (payment captured, refund processed) + reconciliation jobs.
- Social (Google, Facebook, LinkedIn, Instagram) – limited to pulling reviews/embedding feeds (phase 2).
- Maps (Google Maps / OpenStreetMap) – geocoding stops, route visualization.
- Future: GPS tracking provider for buses.

### 0.7 Audit & Compliance
- Immutable audit log: actor, action, entity type/id, before/after snapshot (diff for sensitive fields), IP/device metadata.
- Data retention policies: per entity purge schedule (e.g., logs 365d, OTP codes 7d).
- Bulk export tools (JSON/CSV) with throttling & permission gating.
- Automated backups (encrypted) – rotation policy (daily x7, weekly x4, monthly x6) – restore playbook documented.
- DPDP compliance rails: consent capture (guardian), data subject access request workflow (export + anonymize), deletion requests (soft then scheduled hard delete).

### 0.8 Notifications System
Channels: in‑app, email, WhatsApp.
- Template library with merge fields (e.g., {StudentName}, {AY}, {DueAmount}).
- Schedules & recurrence (one‑off, daily summary, weekly digest) – worker queue.
- Delivery status tracking & retry (exponential backoff for transient failures).
- User preferences / opt‑outs per channel category (where legally required).

### 0.9 File & Template Management
- Storage abstractions (local, S3/MinIO, future Drive) for letterheads, report templates, certificate backgrounds.
- Placeholder tokens: {SchoolName} {AY} {Logo} {StudentName} {Class}.
- Version history & active flag per template.
- Permission: Only Admin/Principal can activate templates.

### 0.10 Performance & Scalability (Guidelines)
- All list endpoints: pagination (cursor) + server‑side filters + max page size.
- Caching layer candidates: frequently accessed read‑only catalogs (subjects, classes, fee heads).
- Async tasks: PDF generation, bulk notifications, heavy exports.

### 0.11 Internationalization (i18n) (Future)
- Store locale per user; default tenant locale fallback.
- Translatable strings for report card remarks & notification templates.

---

## 1. Student Information System (SIS)
### 1.1 Profiles
- Student core: admission no, names, DOB, gender, address, languages, email, phones, house, photo.
- Guardians: multiple (mother, father, guardian) – contacts, occupations, preferred language, communication preference.
- Documents: birth cert, transfer cert, prior report cards, ID proofs – upload + expiry tracking for relevant docs.

### 1.2 Health & Safety
- Allergies (severity), medical conditions, medication consent, emergency contacts ordered, insurance info.
- Incident log: date, type (injury, behavioral, other), description, actions taken, staff involved, follow‑up status.
- Nurse can update health records; teachers view read‑only key alerts (allergies, conditions) at roster glance.

### 1.3 Transport Details
- Route assignment, stop, bus id, driver, attendant, pickup/drop alt contact.
- Historical changes (audit) for reassignments.

### 1.4 House & Clubs
- House allocation (points tally), clubs/teams membership, leadership roles (Head Boy/Girl, Prefect, Monitor, Captain).
- Points log: event, points delta, reason, approved_by.

### 1.5 Admissions
- Stages: inquiry → application → document verification → assessment → offer → acceptance → enrolled / waitlist / declined.
- Lateral/transfer in/out support: map previous school & docs.
- Fee mapping: initial fee plan attach at acceptance.
- Waitlist priority & seat availability dashboard.

### 1.6 Conduct & Counseling
- Private notes (visibility restricted to counselors + principal when flagged).
- Interventions: plan, start/end, responsible staff, review date.
- Follow‑ups with status (open, in progress, closed).

### 1.7 Awards & Discipline
- Achievements: category (academic, sports, cultural), description, date, issuing_authority.
- Infractions: type, severity, description, actions (warning, detention, suspension), resolution status.

---

## 2. Academics
### 2.1 Classes & Subjects
- Academic year & term setup; class (grade) & section configuration; subject catalog (core vs elective) with code & weight.
- Room mapping & capacity; subject‑teacher assignments; max load per teacher validation.

### 2.2 Timetable
- Builder UI with clash detection (room conflict, teacher overload, subject duplicate slot rules).
- Export to PDF & web share link (public read token); substitution planning (mark teacher absent → recommend available qualified teachers).

### 2.3 Attendance
- Daily (AM/PM) & period attendance; reasons (illness, excused, unexcused) catalog.
- Parent auto‑notify (WhatsApp/email) for absent or threshold breaches.
- Early departure workflow: request → approve → log time out.

### 2.4 Lesson Plans & Syllabus
- Unit plan: objectives, resources, activities, assessments, completion %.
- Pacing tracker vs planned schedule; lock editing after publish window (unless override permission).

### 2.5 Homework / Classwork & Assignments
- Create assignments per class/section; attachments, due date, submission tracking, grading status.
- Parent visibility toggle (published vs draft); late submission flagging, reminders.

### 2.6 Labs / Practicals
- Practical schedule list; safety checklist acknowledgment per session; rubric grading entry; inventory item linkage (consumables usage logs).

### 2.7 Tests / Quizzes & Exams
- Quiz/Test item bank (objective questions) with tags & difficulty.
- Term exam setup: papers, seating plan generation, hall tickets, invigilation roster.
- Secure marks entry window; moderation pass; finalize & publish sequence.

### 2.8 Gradebook & Report Cards
- Grading schemes: CBSE/ICSE/State/Custom – weightages & conversion logic.
- Moderation workflow before publish; remarks library and auto suggestions.
- Publication flow: draft → review → approve → release (parents notified & PDF generated on letterhead).

---

## 3. Communication & PTM
### 3.1 Announcements
- Target scopes: school-wide, class/section, house, club.
- Channel selection: in‑app, email, WhatsApp (fallback strategy if WhatsApp fails to deliver?).
- Schedule or immediate send; read receipts (in-app) & delivery stats.

### 3.2 Parent–Teacher Communication
- Directory of class/section WhatsApp groups (metadata only; no message ingestion initially).
- 1‑to‑1 message log (metadata: timestamp, channel, direction) for compliance; no content storage if privacy constrained.
- Call notes: initiated by teacher with summary & optional follow-up task.

### 3.3 PTM (Parent Teacher Meetings)
- Slot scheduling: teacher availability windows; parent booking per child; conflict detection.
- Attendance logging & feedback form (rating + comments) stored per meeting.

### 3.4 Alerts
- Health (allergy incident), fee due reminders, attendance thresholds, timetable changes.
- Deduplication logic prevents duplicate sends within cooldown windows (configurable).

### 3.5 To‑Do / Tasks
- Personal tasks for teacher/admin with due date, priority, optional student/class linkage.
- Reminders via notification system; completion toggle & history.

---

## 4. Fees & Accounts
- Fee catalogs: tuition, transport, lab, exam – head definitions with periodicity (monthly, term, annual) & default amount.
- Concessions: scholarships/discount rules (percentage, fixed, tiered) applied at student or group level.
- Invoice lifecycle: draft → issued → paid/partial → overdue → closed.
- Payment methods: Razorpay online, offline (cash, cheque, bank transfer) with receipt numbering.
- Aging & dues dashboard; automated reminders schedule.
- Refunds: request → approve (permission gate) → initiate gateway API → status sync.
- Settlement & reconciliation exports (CSV/PDF) with signature line.

---

## 5. Transport
- Vehicle registry: bus/van metadata (RC no, insurance expiry, fitness expiry, PUC expiry, last service date, odometer, capacity, status: active/maintenance/offline).
- Service history: date, type, cost, next_due calculation.
- Driver & attendant profiles: KYC docs, license expiry, training status.
- Routes: ordered stops with timings; capacity utilization tracking.
- Student mapping: current route/stop; exceptions (temporary stop change date range, early departure pass workflow).
- GPS (future): ingestion endpoint for location pings; freshness badge logic.
- Imports: CSV for initial route and vehicle data.

---

## 6. Library
- Catalog: books (ISBN, title, author, edition, tags, subject), copies with barcode/id & location.
- External lookup: ISBN/Z39.50 import (future module adapter).
- Circulation: issue → due date calc → return/renewal (limit, fine rules) → fine ledger entries.
- Reservations & hold queue; lost/damaged flow (mark status, charge fine, reorder suggestion).
- Reading logs: pages read, time, optional review summary; analytics per class/student.

---

## 7. Inventory & Assets
- Categories: Labs, Sports, ICT/Smart Boards, Furniture, Kitchen/Pantry, Auditorium, Other.
- Stock items: SKU/code, description, unit, qty on hand, min qty, vendor links, warranty/AMC expiry.
- Movements: stock in (PO ref), stock out (reason: consumption, issue to room/person), adjustment (audit reason required).
- Maintenance calendar & reminders for assets (projector service, etc.).
- Depreciation (optional): simple straight-line metadata only (rate, start date) for export.

---

## 8. Staff (HR Lite)
- Hiring & onboarding: candidate record → documents collection → status (applied, shortlisted, hired, rejected).
- Staff profile: roles, subjects load, class teacher assignment, ID docs, background/police verification status.
- Attendance & leave: leave types catalog (casual, sick, etc.), approval chain, substitution auto‑flag for timetable gaps.
- Trainings/workshops: catalog entries, attendance, certificate upload.
- Payroll interface: export staff remuneration CSV (not in‑app payment processing initially).
- Performance (future): aggregated parent feedback 5‑point rating summary.

---

## 9. Events, Sports & Competitions
- Events calendar: academic, cultural, sports, exams (linked), holidays.
- Registrations with consent capture (guardian e-sign or acknowledgment flag).
- Team lists & fixtures; result entry & automatic house points assignment.
- Certificate generation with template placeholders.

---

## 10. Canteen / Uniform & Books / Vendors
### 10.1 Canteen
- Menus with allergens; daily/weekly cycle; vendor linkage.
- Optional prepaid balance or ledger (phase 2) – transactions (purchase, top-up, adjustment).

### 10.2 Uniform & Books
- Item catalog (uniform parts, textbooks) with sizes/editions & price.
- Order windows (open/close) & fulfillment records (issued date, qty, student).

### 10.3 Vendor Management
- Vendors: KYC docs, contract dates, reminder alerts (expiry), rating (internal).
- Invoices: captured for inventory/canteen/uniform procurement with status (draft, approved, paid).

---

## 11. Analytics & Dashboards
### 11.1 Role-Based Dashboards
- Principal: attendance %, fee dues, exam status (mark entry progress), incident summaries.
- Teacher: today’s roster, pending grading items, unread parent messages, upcoming PTM slots.
- Accountant: collections vs target, aging buckets, refund queue.
- Transport: expiring docs, capacity utilization, service due list.
- Librarian: overdues, reservations, acquisition suggestions.
- Parent: child snapshot (attendance, upcoming homework deadlines, fee due, next exam, transport stop/time, health alert summary).

### 11.2 Teacher Workspace
- Aggregated “Today” view: timetable, mark attendance panel, lesson plan quick view, homework create/preview, quick quiz launch.
- Gradebook inline entry & remarks; report card status panel; parent comms shortcuts.
- To‑do list & reminders integrated.
- Class roster with transport, health alerts, birthdays.

### 11.3 Parent App (Essentials)
- Child profile overview (basic SIS data, photo, class, house).
- Timetable (current day & week view).
- Homework & assignment list (submitted/pending status).
- Grades & report cards (download PDF when released).
- Fees & payment history (pay outstanding invoices, receipts).
- Announcements feed (filterable).
- Transport stop & live/predicted time (future real-time when GPS integrated).
- Leave request & early departure request workflows.
- PTM slot booking & history.
- Chat directory (teacher/class channels – metadata only currently).

---

## Cross-Cutting Non-Functional Requirements
- Logging: structured (JSON) with correlation IDs per request & async job.
- Observability: metrics (requests, latency, queue depth) & health probes used by orchestrator.
- Rate Limiting: OTP endpoints, search endpoints, bulk exports.
- Data Model Versioning: migrations tracked, backward compatible additive changes where possible.
- Disaster Recovery: RPO <= 24h (daily backups) initial; aim for 6h incremental in phase 2.

## Open Questions / Future Decisions
- Multi-tenant physical vs logical DB separation strategy (current: per-school logical partition). Evaluate scaling breakpoints.
- Real-time push (WebSockets vs SSE) for attendance and transport updates.
- Pluggable rules engine for custom approval chains.
- Parent aggregated feedback weighting in performance module.

## Appendix
- Token Reference: standard merge tokens enumerated in a separate template guide (TBD).
- Role Permission Matrix: maintain in `docs/permissions-matrix.md` (not yet created).

---
This file should be versioned with meaningful commit messages. When altering workflows, annotate rationale & migration considerations.

---

## Product Backlog Epics (A–P)

This section enumerates higher-order Epics derived from the functional foundation. Each Epic lists representative user stories with concise Acceptance Criteria (AC). These refine scope for phased delivery and map to future permission/action codes.

### EPIC A — Admissions & SIS
Stories & AC:
1. Admission wizard (new/lateral/transfer) — AC: validates required docs; generates sequential admission number (per school); auto places student into current AY + class/section; creates audit log; supports CSV import with pre‑flight validation & diff preview.
2. Guardian linkage & preferences — AC: set exactly one primary guardian; capture channel preference (WhatsApp/SMS/Email/Call/None); phone/email verification status; DND blocks non‑critical sends; override only with elevated permission.
3. House & clubs assignment — AC: bulk assign from filtered list; leaderboard recalculates house points; maintains historical log for transfers.
4. Student profile soft delete/restore — AC: sets deleted_at, excludes from default queries; restore reinstates relations; audit entries for both actions.

### EPIC B — Teacher Workspace
1. "Today" view — AC: aggregate timetable + pending attendance + homework due + grading queue loads <1.5s for 40+ periods; keyboard shortcuts; persisted class switcher (local storage or server preference).
2. Attendance entry with alerts — AC: submitting marks absent triggers guardian channel send (respect DND and channel pref); edit history retained.
3. Homework create/review — AC: attachments stored via central file registry; late submissions flagged; toggle parent visibility; track grading status.

### EPIC C — Timetable & Substitutions
1. Timetable builder — AC: detects teacher, room, subject clashes before save; supports effective-from date; export PDF.
2. Substitution planning — AC: suggests free qualified teachers (subject match) sorted by load; notification to original & substitute teacher.

### EPIC D — Exams, Gradebook & Report Cards
1. Exam schedule lock — AC: only users with EXAMS.SCHEDULE_EDIT prior to lock; locking action recorded; post-lock read-only except unlock permission.
2. Marks entry grid — AC: paste multi-cell from clipboard; validate max marks; conflict detection (simultaneous edits) with optimistic token.
3. Report-card publish window — AC: state machine DRAFT→REVIEW→APPROVED→PUBLISHED; window enforced; batch PDF generation uses active letterhead template.

### EPIC E — Communications & PTM
1. Announcement composer — AC: multi-target selection (class/section/house/role); template merge preview; schedule; outbox record with per-channel receipt.
2. PTM sessions & bookings — AC: slot capacity enforced; parent self-book limited to one active per child per session; teacher day agenda export.

### EPIC F — Fees, Payments & Reconciliation
1. Fee plan & invoice generation — AC: run by class/section; preview aggregate totals; rerun is idempotent (no duplicate lines); diff summary shown.
2. Collections (online/offline) — AC: Razorpay webhook creates pg_transaction row; partial payments adjust balance & status transitions; offline receipt numbering monotonic.
3. Dues & reminders — AC: aging buckets computed (0-30/31-60/etc.); reminder job respects guardian DND & channel preference; queue idempotency key prevents duplicates.
4. Refunds with approval gate — AC: two-step approval; reversal ledger entries; audit snapshot (pre/post invoice state).

### EPIC G — Transport
1. Route/stop mapping — AC: capacity validation (route seats vs assigned); change history retained; export for attendants.
2. Compliance expiries — AC: dashboard highlights expiring license/insurance/fitness; reminder jobs feed outbox.

### EPIC H — Library
1. Issue/return (barcode/QR) — AC: fine accrual on late return (grace config); permission-gated mark lost/damaged; inventory of copies updated instantly.
2. Overdues — AC: weekly job enumerates overdue copies, enqueues notices, tracks per-send state.

### EPIC I — Inventory & Vendor / Procurement
1. Vendor master & contracts — AC: KYC completeness score; contract renewal reminders; status changes audited.
2. PO → GRN → Stock — AC: GRN cannot exceed PO qty; variance report; stock movements atomic; vendor performance metrics (OTD% / variance ratio).
3. Asset registers — AC: checkout assigns to room or user; maintenance due list; history of transfers.

### EPIC J — Centralized Messaging (WhatsApp/SMS/Email)
1. Channel accounts & templates — AC: per-school credential store (encrypted); template variables validated; preview w/ sample data.
2. Outbox & receipts — AC: message lifecycle states PENDING→SENDING→SENT/FAILED; provider message_id captured; retry policy w/ exponential backoff & max attempts; respects channel preference & DND.

### EPIC K — Social Media Management
1. Connect social accounts — AC: OAuth token refresh reminder; minimal scope storage; revoke action sets disabled_at.
2. Post scheduler & review aggregation — AC: draft→approve→schedule workflow; published receipts stored; nightly review import deduped by provider ID.

### EPIC L — Files, Exports & Registry
1. File registry + attachments — AC: any entity attaches file record (hash, size, storage backend key, virus_scan_status); permission inherits from parent entity; soft delete retains metadata.
2. Export jobs — AC: CSV/PDF job persists status PROGRESS/COMPLETE/FAILED; notification w/ signed URL on completion; retention window cleanup.

### EPIC M — Background Jobs & Observability
1. Job runner & locks — AC: at-least-once with visibility timeout; distributed lock per job key; dead-letter queue after N failures.
2. Admin job console — AC: filter by type/status; cancel signals graceful abort; payload redaction fields list.

### EPIC N — Security, Auth & MFA
1. MFA factors — AC: TOTP enrollment w/ QR + scratch codes; step-up for sensitive actions; factor disable audit.
2. API keys — AC: per-scope hashed key storage; last_used_at updated asynchronously; revoke sets revoked_at.

### EPIC O — Settings, Windows & Fine-Grained Permissions
1. Config store — AC: typed keys (string/int/json/secret); secret values encrypted; change history w/ actor.
2. Permission actions matrix — AC: per-action code (e.g., FEES.CANCEL_INVOICE) seeded; role grants; user override precedence evaluation helper.

### EPIC P — Analytics
1. Materialized views for dashboards — AC: refresh schedule (cron) stored; metrics attendance%, fee aging, transport utilization, exam summaries, library overdues; read-only role restricted.

---
_Backlog Epics section added 2025-09-29; keep synchronized with permissions matrix & roadmap document._
