"""Delta extension modules: settings, auth, files, comms outbox, payments, procurement, social, jobs, analytics, soft-delete, guardian prefs

Revision ID: 20250929_1100
Revises: 20250929_1035
Create Date: 2025-09-29

This migration applies the additional schema objects from delta.sql. It is written to be idempotent
so it can be safely re-run if partially applied (using IF NOT EXISTS / ON CONFLICT / conditional checks).

Materialized views are created without CONCURRENTLY (first creation). Future refreshes can use
REFRESH MATERIALIZED VIEW CONCURRENTLY.
"""
from alembic import op
import sqlalchemy as sa

revision = '20250929_1100'
down_revision = '20250929_1035'
branch_labels = None
depends_on = None


def upgrade():
    # SETTINGS schema
    op.execute("CREATE SCHEMA IF NOT EXISTS settings")
    op.execute("""
    CREATE TABLE IF NOT EXISTS settings.config (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      school_id BIGINT NOT NULL REFERENCES core.school(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      value_json JSONB NOT NULL,
      is_secret BOOLEAN NOT NULL DEFAULT FALSE,
      updated_by BIGINT REFERENCES core.user_account(id),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (school_id, key)
    );
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS settings.integration_credential (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      school_id BIGINT NOT NULL REFERENCES core.school(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      label TEXT,
      credentials_enc BYTEA NOT NULL,
      rotated_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (school_id, provider, label)
    );
    """)

    # Permission action catalog (separate from existing core.permission)
    op.execute("""
    CREATE TABLE IF NOT EXISTS core.permission_action (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      UNIQUE (module, action)
    );
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS core.role_permission_action (
      role core.role NOT NULL,
      permission_action_id BIGINT REFERENCES core.permission_action(id) ON DELETE CASCADE,
      PRIMARY KEY (role, permission_action_id)
    );
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS core.user_permission_override (
      user_id BIGINT REFERENCES core.user_account(id) ON DELETE CASCADE,
      permission_action_id BIGINT REFERENCES core.permission_action(id) ON DELETE CASCADE,
      allow BOOLEAN NOT NULL,
      PRIMARY KEY (user_id, permission_action_id)
    );
    """)

    # AUTH schema & types
    op.execute("CREATE SCHEMA IF NOT EXISTS auth")
    op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'auth'::regnamespace AND typname='factor_type') THEN CREATE TYPE auth.factor_type AS ENUM ('TOTP','SMS_OTP','EMAIL_OTP'); END IF; END $$;")
    op.execute("""
    CREATE TABLE IF NOT EXISTS auth.mfa_factor (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES core.user_account(id) ON DELETE CASCADE,
      factor_type auth.factor_type NOT NULL,
      secret_enc BYTEA,
      phone TEXT, email CITEXT,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS auth.session (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id BIGINT NOT NULL REFERENCES core.user_account(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL,
      ip TEXT, user_agent TEXT,
      revoked_at TIMESTAMPTZ
    );
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS auth.refresh_token (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id BIGINT NOT NULL REFERENCES core.user_account(id) ON DELETE CASCADE,
      session_id UUID REFERENCES auth.session(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ
    );
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS auth.api_key (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      school_id BIGINT NOT NULL REFERENCES core.school(id) ON DELETE CASCADE,
      label TEXT,
      key_hash TEXT NOT NULL,
      scopes TEXT[] NOT NULL,
      created_by BIGINT REFERENCES core.user_account(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_used_at TIMESTAMPTZ
    );
    """)

    # FILES schema
    op.execute("CREATE SCHEMA IF NOT EXISTS files")
    op.execute("""
    CREATE TABLE IF NOT EXISTS files.blob (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      school_id BIGINT NOT NULL REFERENCES core.school(id) ON DELETE CASCADE,
      storage_url TEXT NOT NULL,
      mime_type TEXT,
      bytes BIGINT,
      checksum TEXT,
      is_public BOOLEAN NOT NULL DEFAULT FALSE,
      virus_scan TEXT,
      created_by BIGINT REFERENCES core.user_account(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS files.attachment (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      blob_id BIGINT NOT NULL REFERENCES files.blob(id) ON DELETE CASCADE,
      entity TEXT NOT NULL,
      entity_id BIGINT NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """)

    # COMMS (reuse existing schema)
    op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace='comms'::regnamespace AND typname='channel') THEN CREATE TYPE comms.channel AS ENUM ('INAPP','EMAIL','WHATSAPP','SMS'); END IF; END $$;")
    op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace='comms'::regnamespace AND typname='outbox_status') THEN CREATE TYPE comms.outbox_status AS ENUM ('PENDING','SENDING','SENT','FAILED','CANCELLED'); END IF; END $$;")
    op.execute("""
    CREATE TABLE IF NOT EXISTS comms.message_template (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      school_id BIGINT NOT NULL REFERENCES core.school(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      channel comms.channel NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (school_id, name, channel)
    );
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS comms.outbox (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      school_id BIGINT NOT NULL REFERENCES core.school(id) ON DELETE CASCADE,
      channel comms.channel NOT NULL,
      to_address TEXT NOT NULL,
      subject TEXT,
      body TEXT NOT NULL,
      template_id BIGINT REFERENCES comms.message_template(id),
      provider TEXT,
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
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS comms.delivery_receipt (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      outbox_id BIGINT NOT NULL REFERENCES comms.outbox(id) ON DELETE CASCADE,
      provider_status TEXT,
      received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      raw JSONB
    );
    """)

    # PAYMENTS schema
    op.execute("CREATE SCHEMA IF NOT EXISTS payments")
    op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace='payments'::regnamespace AND typname='pg_status') THEN CREATE TYPE payments.pg_status AS ENUM ('CREATED','AUTHORIZED','CAPTURED','FAILED','REFUNDED','SETTLED'); END IF; END $$;")
    op.execute("""
    CREATE TABLE IF NOT EXISTS payments.pg_transaction (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      school_id BIGINT NOT NULL REFERENCES core.school(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
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
    """)
    # fees.payment may or may not exist; add column if missing
    op.execute("""
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='fees' AND table_name='payment') THEN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns WHERE table_schema='fees' AND table_name='payment' AND column_name='pg_transaction_id'
        ) THEN
          ALTER TABLE fees.payment ADD COLUMN pg_transaction_id BIGINT REFERENCES payments.pg_transaction(id);
        END IF;
      END IF;
    END $$;
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS payments.recon_ledger (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      pg_transaction_id BIGINT REFERENCES payments.pg_transaction(id) ON DELETE CASCADE,
      invoice_id BIGINT REFERENCES fees.invoice(id) ON DELETE SET NULL,
      step TEXT NOT NULL,
      delta NUMERIC(12,2) NOT NULL DEFAULT 0,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """)

    # PROCUREMENT schema
    op.execute("CREATE SCHEMA IF NOT EXISTS procurement")
    op.execute("""
    CREATE TABLE IF NOT EXISTS procurement.vendor (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      school_id BIGINT NOT NULL REFERENCES core.school(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT,
      phone TEXT, email CITEXT,
      gstin TEXT, pan TEXT,
      rating INT CHECK (rating BETWEEN 1 AND 5),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS procurement.vendor_contact (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      vendor_id BIGINT NOT NULL REFERENCES procurement.vendor(id) ON DELETE CASCADE,
      full_name TEXT, phone TEXT, email CITEXT, role_text TEXT
    );
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS procurement.contract (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      vendor_id BIGINT NOT NULL REFERENCES procurement.vendor(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      start_date DATE, end_date DATE,
      terms TEXT, attachment_id BIGINT REFERENCES files.blob(id),
      auto_renew BOOLEAN DEFAULT FALSE,
      renewal_reminder_days INT DEFAULT 30
    );
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS procurement.purchase_order (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      school_id BIGINT NOT NULL REFERENCES core.school(id) ON DELETE CASCADE,
      vendor_id BIGINT NOT NULL REFERENCES procurement.vendor(id),
      po_no TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'OPEN',
      ordered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      note TEXT
    );
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS procurement.purchase_order_line (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      po_id BIGINT NOT NULL REFERENCES procurement.purchase_order(id) ON DELETE CASCADE,
      item_id BIGINT REFERENCES inventory.item(id),
      description TEXT,
      qty NUMERIC(12,2) NOT NULL,
      rate NUMERIC(12,2) NOT NULL
    );
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS procurement.grn (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      po_id BIGINT NOT NULL REFERENCES procurement.purchase_order(id) ON DELETE CASCADE,
      received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      received_by BIGINT REFERENCES core.user_account(id),
      note TEXT
    );
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS procurement.grn_line (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      grn_id BIGINT NOT NULL REFERENCES procurement.grn(id) ON DELETE CASCADE,
      po_line_id BIGINT REFERENCES procurement.purchase_order_line(id),
      qty_received NUMERIC(12,2) NOT NULL
    );
    """)
    # optional stock txn link
    op.execute("""
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='inventory' AND table_name='stock_txn') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='inventory' AND table_name='stock_txn' AND column_name='grn_line_id') THEN
          ALTER TABLE inventory.stock_txn ADD COLUMN grn_line_id BIGINT REFERENCES procurement.grn_line(id);
        END IF;
      END IF;
    END $$;
    """)

    # SOCIAL schema
    op.execute("CREATE SCHEMA IF NOT EXISTS social")
    op.execute("""
    CREATE TABLE IF NOT EXISTS social.account (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      school_id BIGINT NOT NULL REFERENCES core.school(id) ON DELETE CASCADE,
      platform TEXT NOT NULL,
      handle TEXT, credentials_id BIGINT REFERENCES settings.integration_credential(id),
      connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (school_id, platform, handle)
    );
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS social.post (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      account_id BIGINT NOT NULL REFERENCES social.account(id) ON DELETE CASCADE,
      title TEXT, body TEXT,
      media_attachment_id BIGINT REFERENCES files.blob(id),
      status TEXT NOT NULL DEFAULT 'DRAFT',
      scheduled_at TIMESTAMPTZ,
      published_at TIMESTAMPTZ,
      provider_post_id TEXT,
      last_error TEXT
    );
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS social.review_import (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      account_id BIGINT NOT NULL REFERENCES social.account(id) ON DELETE CASCADE,
      provider_review_id TEXT,
      author TEXT, rating INT, body TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (account_id, provider_review_id)
    );
    """)

    # JOBS schema
    op.execute("CREATE SCHEMA IF NOT EXISTS jobs")
    op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace='jobs'::regnamespace AND typname='status') THEN CREATE TYPE jobs.status AS ENUM ('QUEUED','RUNNING','SUCCEEDED','FAILED','CANCELLED','DEAD_LETTER'); END IF; END $$;")
    op.execute("""
    CREATE TABLE IF NOT EXISTS jobs.job (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      school_id BIGINT REFERENCES core.school(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      payload JSONB NOT NULL,
      status jobs.status NOT NULL DEFAULT 'QUEUED',
      priority INT NOT NULL DEFAULT 5,
      run_after TIMESTAMPTZ,
      max_attempts INT NOT NULL DEFAULT 5,
      attempts INT NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS jobs.run (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      job_id BIGINT NOT NULL REFERENCES jobs.job(id) ON DELETE CASCADE,
      started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      finished_at TIMESTAMPTZ,
      worker_id TEXT,
      log TEXT
    );
    """)
    op.execute("""
    CREATE TABLE IF NOT EXISTS jobs.lock (
      key TEXT PRIMARY KEY,
      locked_until TIMESTAMPTZ NOT NULL
    );
    """)

    # ANALYTICS schema and materialized views
    op.execute("CREATE SCHEMA IF NOT EXISTS analytics")
    op.execute("""
    CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.class_attendance_mv AS
    SELECT cs.id AS class_section_id,
           ay.id AS ay_id,
           date_trunc('month', ad.date_on) AS month,
           100.0 * AVG(CASE WHEN ae.status = 'PRESENT' THEN 1 ELSE 0 END) AS attendance_pct
    FROM academics.class_section cs
    JOIN academics.academic_year ay ON cs.ay_id = ay.id
    JOIN academics.attendance_day ad ON ad.class_section_id = cs.id
    JOIN academics.attendance_entry ae ON ae.attendance_day_id = ad.id
    GROUP BY cs.id, ay.id, date_trunc('month', ad.date_on);
    """)
    op.execute("""
    CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.fee_aging_mv AS
    SELECT i.student_id,
           DATE_TRUNC('day', now())::date AS as_of,
           SUM(CASE WHEN i.balance_due > 0 THEN i.balance_due ELSE 0 END) AS total_due,
           SUM(CASE WHEN i.due_date <= now()::date - INTERVAL '30 days' THEN i.balance_due ELSE 0 END) AS over_30,
           SUM(CASE WHEN i.due_date <= now()::date - INTERVAL '60 days' THEN i.balance_due ELSE 0 END) AS over_60
    FROM fees.invoice i
    GROUP BY i.student_id;
    """)
    op.execute("""
    CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.transport_utilization_mv AS
    SELECT r.id AS route_id,
           COUNT(sa.student_id) AS students_on_route,
           v.capacity,
           ROUND(100.0 * COUNT(sa.student_id) / NULLIF(v.capacity,0),2) AS utilization_pct
    FROM transport.route r
    LEFT JOIN transport.vehicle_assignment va ON va.route_id = r.id AND va.active
    LEFT JOIN transport.student_assignment sa ON sa.route_id = r.id
    LEFT JOIN transport.vehicle v ON va.vehicle_id = v.id
    GROUP BY r.id, v.capacity;
    """)

    # SOFT DELETE & guardian prefs alterations
    op.execute("""
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='inventory' AND table_name='item') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='inventory' AND table_name='item' AND column_name='deleted_at') THEN
          ALTER TABLE inventory.item ADD COLUMN deleted_at TIMESTAMPTZ;
        END IF;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='library' AND table_name='title') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='library' AND table_name='title' AND column_name='deleted_at') THEN
          ALTER TABLE library.title ADD COLUMN deleted_at TIMESTAMPTZ;
        END IF;
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='core' AND table_name='guardian') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='core' AND table_name='guardian' AND column_name='contact_pref') THEN
          ALTER TABLE core.guardian ADD COLUMN contact_pref TEXT DEFAULT 'WHATSAPP';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='core' AND table_name='guardian' AND column_name='verified_phone_at') THEN
          ALTER TABLE core.guardian ADD COLUMN verified_phone_at TIMESTAMPTZ;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='core' AND table_name='guardian' AND column_name='verified_email_at') THEN
          ALTER TABLE core.guardian ADD COLUMN verified_email_at TIMESTAMPTZ;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='core' AND table_name='guardian' AND column_name='do_not_disturb') THEN
          ALTER TABLE core.guardian ADD COLUMN do_not_disturb BOOLEAN NOT NULL DEFAULT FALSE;
        END IF;
      END IF;
    END $$;
    """)


def downgrade():
    # Destructive downgrade omitted intentionally for safety.
    pass
