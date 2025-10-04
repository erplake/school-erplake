-- Repair script to align DB with expected head revision 20250929_1340
-- Creates missing permission tables, base permission data, role mappings (minimal), and settlement_summary table.
-- Then sets alembic_version to head.

BEGIN;

-- 1. Recreate core.permission and core.role_permission if absent
CREATE TABLE IF NOT EXISTS core.permission (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS core.role_permission (
  role core.role NOT NULL,
  permission_code TEXT NOT NULL REFERENCES core.permission(code) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_code)
);
-- user_permission_override already exists.

-- 2. Seed baseline permissions (subset; expand if needed)
INSERT INTO core.permission(code, description) VALUES
 ('students:list','List students'),
 ('students:create','Create student'),
 ('students:update','Update student'),
 ('students:message','Send guardian message'),
 ('students:bonafide','Generate bonafide certificate'),
 ('attendance:mark','Mark attendance'),
 ('attendance:view','View attendance'),
 ('fees:create_invoice','Create fee invoice'),
 ('fees:view_invoice','View fee invoice'),
 ('staff:list','List staff'),
 ('staff:detail','View staff detail'),
 ('staff:create','Create staff'),
 ('staff:update','Update staff record'),
 ('staff:leave','Manage staff leave'),
 ('transport:read','View transport entities'),
 ('transport:write','Create/Update transport entities'),
 ('transport:maint','Log maintenance / incidents'),
 ('transport:gps','Ingest GPS pings')
ON CONFLICT (code) DO NOTHING;

-- 3. Extended permissions introduced later
INSERT INTO core.permission(code, description) VALUES
 ('files:blob_register','Register file blob metadata'),
 ('files:blob_read','Read file blob metadata'),
 ('files:attachment_create','Create attachment linking blob to entity'),
 ('files:attachment_read','Read attachment metadata'),
 ('comms:template_create','Create message template'),
 ('comms:template_list','List message templates'),
 ('comms:outbox_enqueue','Enqueue outbound message'),
 ('comms:outbox_read','Read outbox record'),
 ('payments:tx_create','Create payment gateway transaction record'),
 ('payments:tx_read','Read payment gateway transaction'),
 ('payments:recon_create','Append reconciliation ledger entry'),
 ('payments:recon_read','Read reconciliation ledger entry'),
 ('audit:log_read','Read audit log entries')
ON CONFLICT (code) DO NOTHING;

-- 4. Minimal ADMIN role mapping (optional; extend as needed)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT code FROM core.permission LOOP
    INSERT INTO core.role_permission(role, permission_code) VALUES ('ADMIN', r.code)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 5. Settlement summary table if missing
CREATE TABLE IF NOT EXISTS payments.settlement_summary (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  school_id BIGINT REFERENCES core.school(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  settlement_date DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  gross_amount NUMERIC(14,2) DEFAULT 0,
  fees_amount NUMERIC(14,2) DEFAULT 0,
  refunds_amount NUMERIC(14,2) DEFAULT 0,
  net_amount NUMERIC(14,2) DEFAULT 0,
  tx_count INT DEFAULT 0,
  refund_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_settlement_day UNIQUE (school_id, provider, settlement_date)
);

-- 6. Set alembic head revision directly
DELETE FROM public.alembic_version;
INSERT INTO public.alembic_version(version_num) VALUES ('20250929_1340');

COMMIT;
