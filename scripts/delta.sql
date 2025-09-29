-- ─────────────────────────────── SETTINGS & RBAC ACTIONS
CREATE SCHEMA IF NOT EXISTS settings;

CREATE TABLE settings.config (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  school_id BIGINT NOT NULL REFERENCES core.school(id) ON DELETE CASCADE,
  key TEXT NOT NULL,                           -- e.g., 'branding.theme', 'window.report_cards.open'
  value_json JSONB NOT NULL,
  is_secret BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by BIGINT REFERENCES core.user_account(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, key)
);

CREATE TABLE settings.integration_credential (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  school_id BIGINT NOT NULL REFERENCES core.school(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,                      -- 'GUPSHUP','RAZORPAY','SMTP','AWS','MINIO'
  label TEXT,
  credentials_enc BYTEA NOT NULL,              -- encrypted blob
  rotated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, provider, label)
);

-- Fine-grained permission actions
CREATE TABLE core.permission_action (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  module TEXT NOT NULL,                        -- 'FEES','EXAMS','LIBRARY','TRANSPORT', etc.
  action TEXT NOT NULL,                        -- 'CANCEL_INVOICE','LOCK_SCHEDULE','MARK_LOST',...
  UNIQUE (module, action)
);

CREATE TABLE core.role_permission_action (
  role core.role NOT NULL,
  permission_action_id BIGINT REFERENCES core.permission_action(id) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_action_id)
);

CREATE TABLE core.user_permission_override (
  user_id BIGINT REFERENCES core.user_account(id) ON DELETE CASCADE,
  permission_action_id BIGINT REFERENCES core.permission_action(id) ON DELETE CASCADE,
  allow BOOLEAN NOT NULL,
  PRIMARY KEY (user_id, permission_action_id)
);

-- ─────────────────────────────── AUTH: MFA, SESSIONS, API KEYS
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TYPE auth.factor_type AS ENUM ('TOTP','SMS_OTP','EMAIL_OTP');

CREATE TABLE auth.mfa_factor (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES core.user_account(id) ON DELETE CASCADE,
  factor_type auth.factor_type NOT NULL,
  secret_enc BYTEA,                            -- TOTP secret encrypted
  phone TEXT, email CITEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE auth.session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES core.user_account(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  ip TEXT, user_agent TEXT,
  revoked_at TIMESTAMPTZ
);

CREATE TABLE auth.refresh_token (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES core.user_account(id) ON DELETE CASCADE,
  session_id UUID REFERENCES auth.session(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,                    -- store hash only
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);

CREATE TABLE auth.api_key (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  school_id BIGINT NOT NULL REFERENCES core.school(id) ON DELETE CASCADE,
  label TEXT,
  key_hash TEXT NOT NULL,
  scopes TEXT[] NOT NULL,                      -- e.g., {'COMMS.SEND','FILES.READ'}
  created_by BIGINT REFERENCES core.user_account(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

-- ─────────────────────────────── FILES & ATTACHMENTS
CREATE SCHEMA IF NOT EXISTS files;

CREATE TABLE files.blob (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  school_id BIGINT NOT NULL REFERENCES core.school(id) ON DELETE CASCADE,
  storage_url TEXT NOT NULL,                   -- s3/minio key or external url
  mime_type TEXT,
  bytes BIGINT,
  checksum TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  virus_scan TEXT,                             -- 'CLEAN','SUSPECT','FAILED'
  created_by BIGINT REFERENCES core.user_account(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generic attachment (entity table name + id)
CREATE TABLE files.attachment (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  blob_id BIGINT NOT NULL REFERENCES files.blob(id) ON DELETE CASCADE,
  entity TEXT NOT NULL,                        -- 'academics.homework','core.student','comms.announcement'
  entity_id BIGINT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────── COMMS: OUTBOX & RECEIPTS
-- (reuses schema 'comms' you already have)
CREATE TYPE comms.channel AS ENUM ('INAPP','EMAIL','WHATSAPP','SMS');

CREATE TABLE comms.message_template (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  school_id BIGINT NOT NULL REFERENCES core.school(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel comms.channel NOT NULL,
  body TEXT NOT NULL,                          -- with placeholders
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, name, channel)
);

CREATE TYPE comms.outbox_status AS ENUM ('PENDING','SENDING','SENT','FAILED','CANCELLED');

CREATE TABLE comms.outbox (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  school_id BIGINT NOT NULL REFERENCES core.school(id) ON DELETE CASCADE,
  channel comms.channel NOT NULL,
  to_address TEXT NOT NULL,                    -- phone/email/user_id for INAPP
  subject TEXT,
  body TEXT NOT NULL,
  template_id BIGINT REFERENCES comms.message_template(id),
  provider TEXT,                               -- 'GUPSHUP','SMTP'
  provider_msg_id TEXT,
  status comms.outbox_status NOT NULL DEFAULT 'PENDING',
  attempts INT NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  last_error TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by BIGINT REFERENCES core.user_account(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE comms.delivery_receipt (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  outbox_id BIGINT NOT NULL REFERENCES comms.outbox(id) ON DELETE CASCADE,
  provider_status TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw JSONB
);

-- ─────────────────────────────── PAYMENTS: PG TRANSACTIONS & RECON
CREATE SCHEMA IF NOT EXISTS payments;

CREATE TYPE payments.pg_status AS ENUM ('CREATED','AUTHORIZED','CAPTURED','FAILED','REFUNDED','SETTLED');

CREATE TABLE payments.pg_transaction (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  school_id BIGINT NOT NULL REFERENCES core.school(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,                      -- 'RAZORPAY'
  order_id TEXT, payment_id TEXT, refund_id TEXT,
  status payments.pg_status NOT NULL DEFAULT 'CREATED',
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  fee NUMERIC(12,2) DEFAULT 0,
  tax NUMERIC(12,2) DEFAULT 0,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ
);

-- Link fees.payment → pg_transaction (optional)
ALTER TABLE fees.payment
  ADD COLUMN pg_transaction_id BIGINT REFERENCES payments.pg_transaction(id);

CREATE TABLE payments.recon_ledger (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pg_transaction_id BIGINT REFERENCES payments.pg_transaction(id) ON DELETE CASCADE,
  invoice_id BIGINT REFERENCES fees.invoice(id) ON DELETE SET NULL,
  step TEXT NOT NULL,                           -- 'CAPTURE_WEBHOOK','SETTLEMENT_FILE','MANUAL_ADJUST'
  delta NUMERIC(12,2) NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────── PROCUREMENT / VENDORS
CREATE SCHEMA IF NOT EXISTS procurement;

CREATE TABLE procurement.vendor (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  school_id BIGINT NOT NULL REFERENCES core.school(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,                                -- 'Uniform','Books','Canteen','IT','General'
  phone TEXT, email CITEXT,
  gstin TEXT, pan TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE procurement.vendor_contact (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vendor_id BIGINT NOT NULL REFERENCES procurement.vendor(id) ON DELETE CASCADE,
  full_name TEXT, phone TEXT, email CITEXT, role_text TEXT
);

CREATE TABLE procurement.contract (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vendor_id BIGINT NOT NULL REFERENCES procurement.vendor(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_date DATE, end_date DATE,
  terms TEXT, attachment_id BIGINT REFERENCES files.blob(id),
  auto_renew BOOLEAN DEFAULT FALSE,
  renewal_reminder_days INT DEFAULT 30
);

CREATE TABLE procurement.purchase_order (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  school_id BIGINT NOT NULL REFERENCES core.school(id) ON DELETE CASCADE,
  vendor_id BIGINT NOT NULL REFERENCES procurement.vendor(id),
  po_no TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'OPEN',          -- OPEN/CLOSED/CANCELLED
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT
);

CREATE TABLE procurement.purchase_order_line (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  po_id BIGINT NOT NULL REFERENCES procurement.purchase_order(id) ON DELETE CASCADE,
  item_id BIGINT REFERENCES inventory.item(id),
  description TEXT,
  qty NUMERIC(12,2) NOT NULL,
  rate NUMERIC(12,2) NOT NULL
);

CREATE TABLE procurement.grn (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  po_id BIGINT NOT NULL REFERENCES procurement.purchase_order(id) ON DELETE CASCADE,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_by BIGINT REFERENCES core.user_account(id),
  note TEXT
);

CREATE TABLE procurement.grn_line (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  grn_id BIGINT NOT NULL REFERENCES procurement.grn(id) ON DELETE CASCADE,
  po_line_id BIGINT REFERENCES procurement.purchase_order_line(id),
  qty_received NUMERIC(12,2) NOT NULL
);

-- Optional: link inventory stock to GRN
ALTER TABLE inventory.stock_txn
  ADD COLUMN grn_line_id BIGINT REFERENCES procurement.grn_line(id);

-- ─────────────────────────────── SOCIAL
CREATE SCHEMA IF NOT EXISTS social;

CREATE TABLE social.account (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  school_id BIGINT NOT NULL REFERENCES core.school(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,                       -- 'FACEBOOK','INSTAGRAM','LINKEDIN','GOOGLE_REVIEWS'
  handle TEXT, credentials_id BIGINT REFERENCES settings.integration_credential(id),
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, platform, handle)
);

CREATE TABLE social.post (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES social.account(id) ON DELETE CASCADE,
  title TEXT, body TEXT,
  media_attachment_id BIGINT REFERENCES files.blob(id),
  status TEXT NOT NULL DEFAULT 'DRAFT',         -- DRAFT/APPROVED/SCHEDULED/PUBLISHED/FAILED
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  provider_post_id TEXT,
  last_error TEXT
);

CREATE TABLE social.review_import (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES social.account(id) ON DELETE CASCADE,
  provider_review_id TEXT,
  author TEXT, rating INT, body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, provider_review_id)
);

-- ─────────────────────────────── JOBS / QUEUE
CREATE SCHEMA IF NOT EXISTS jobs;

CREATE TYPE jobs.status AS ENUM ('QUEUED','RUNNING','SUCCEEDED','FAILED','CANCELLED','DEAD_LETTER');

CREATE TABLE jobs.job (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  school_id BIGINT REFERENCES core.school(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,                           -- 'EXPORT_CSV','SEND_MESSAGE','RECALC_ANALYTICS'
  payload JSONB NOT NULL,
  status jobs.status NOT NULL DEFAULT 'QUEUED',
  priority INT NOT NULL DEFAULT 5,              -- 1 highest
  run_after TIMESTAMPTZ,
  max_attempts INT NOT NULL DEFAULT 5,
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE jobs.run (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES jobs.job(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  worker_id TEXT,
  log TEXT
);

-- lightweight advisory lock table if needed
CREATE TABLE jobs.lock (
  key TEXT PRIMARY KEY,
  locked_until TIMESTAMPTZ NOT NULL
);

-- ─────────────────────────────── ANALYTICS (MVs)
CREATE SCHEMA IF NOT EXISTS analytics;

CREATE MATERIALIZED VIEW analytics.class_attendance_mv AS
SELECT cs.id AS class_section_id,
       ay.id AS ay_id,
       date_trunc('month', ad.date_on) AS month,
       100.0 * AVG(CASE WHEN ae.status = 'PRESENT' THEN 1 ELSE 0 END) AS attendance_pct
FROM academics.class_section cs
JOIN academics.academic_year ay ON cs.ay_id = ay.id
JOIN academics.attendance_day ad ON ad.class_section_id = cs.id
JOIN academics.attendance_entry ae ON ae.attendance_day_id = ad.id
GROUP BY cs.id, ay.id, date_trunc('month', ad.date_on);

CREATE MATERIALIZED VIEW analytics.fee_aging_mv AS
SELECT i.student_id,
       DATE_TRUNC('day', now())::date AS as_of,
       SUM(CASE WHEN i.balance_due > 0 THEN i.balance_due ELSE 0 END) AS total_due,
       SUM(CASE WHEN i.due_date <= now()::date - INTERVAL '30 days' THEN i.balance_due ELSE 0 END) AS over_30,
       SUM(CASE WHEN i.due_date <= now()::date - INTERVAL '60 days' THEN i.balance_due ELSE 0 END) AS over_60
FROM fees.invoice i
GROUP BY i.student_id;

CREATE MATERIALIZED VIEW analytics.transport_utilization_mv AS
SELECT r.id AS route_id,
       COUNT(sa.student_id) AS students_on_route,
       v.capacity,
       ROUND(100.0 * COUNT(sa.student_id) / NULLIF(v.capacity,0),2) AS utilization_pct
FROM transport.route r
LEFT JOIN transport.vehicle_assignment va ON va.route_id = r.id AND va.active
LEFT JOIN transport.student_assignment sa ON sa.route_id = r.id
LEFT JOIN transport.vehicle v ON va.vehicle_id = v.id
GROUP BY r.id, v.capacity;

-- refresh helper (call from scheduler)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.class_attendance_mv;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.fee_aging_mv;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.transport_utilization_mv;

-- ─────────────────────────────── SOFT-DELETE & GUARDIAN PREFS
ALTER TABLE inventory.item ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE library.title   ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE core.guardian
  ADD COLUMN contact_pref TEXT DEFAULT 'WHATSAPP',   -- WHATSAPP/SMS/EMAIL/CALL/NONE
  ADD COLUMN verified_phone_at TIMESTAMPTZ,
  ADD COLUMN verified_email_at TIMESTAMPTZ,
  ADD COLUMN do_not_disturb BOOLEAN NOT NULL DEFAULT FALSE;
