-- DEPRECATION NOTICE ---------------------------------------------------------
-- This file was used for initial bootstrap via docker ENTRYPOINT. Alembic
-- migrations are now the authoritative schema source. Do NOT add new DDL here.
-- Future changes: create an Alembic revision instead. This file is retained
-- only so first-time container startup on a blank volume does not fail when
-- Alembic isn't invoked yet. Consider removing the mount once environments
-- consistently run `alembic upgrade head` during startup.
------------------------------------------------------------------------------
-- Minimal MVP tables (extend with constraints/indices as needed)
create table if not exists students (
  id serial primary key,
  admission_no text unique,
  first_name text not null,
  last_name text,
  class text,
  section text,
  guardian_phone text,
  created_at timestamptz default now()
);

-- Basic users table for phone-based OTP auth (expand with roles later)
create table if not exists users (
  id serial primary key,
  phone text unique not null,
  email text unique,
  password_hash text,
  created_at timestamptz default now(),
  last_login_at timestamptz
);

create table if not exists attendance_student (
  id serial primary key,
  student_id int references students(id) on delete cascade,
  date date not null,
  status text not null check (status in ('present','absent','late')),
  created_at timestamptz default now(),
  unique(student_id, date)
);

create table if not exists fee_heads (
  id serial primary key,
  name text not null,
  active boolean default true
);

create table if not exists invoices (
  id serial primary key,
  student_id int references students(id) on delete cascade,
  amount_paise bigint not null,
  currency text default 'INR',
  status text not null default 'unpaid',
  due_date date,
  razorpay_order_id text,
  created_at timestamptz default now()
);

create table if not exists payments (
  id serial primary key,
  invoice_id int references invoices(id) on delete cascade,
  provider text not null,
  provider_payment_id text,
  amount_paise bigint not null,
  status text not null,
  payload jsonb,
  created_at timestamptz default now()
);

create table if not exists ai_outputs (
  id serial primary key,
  template_id text,
  model_id text,
  input_hash text,
  reviewer_id int,
  status text not null default 'pending',
  text text,
  created_at timestamptz default now()
);

create table if not exists audit_log (
  id serial primary key,
  actor text,
  action text,
  entity text,
  entity_id text,
  meta jsonb,
  created_at timestamptz default now()
);

-- Idempotency storage (temporary bootstrap; will move to Alembic)
create table if not exists idempotency_keys (
  id serial primary key,
  key text unique not null,
  route text not null,
  method text not null,
  request_hash text not null,
  response_json jsonb,
  created_at timestamptz default now()
);

-- Refresh tokens table (rotation + revocation)
create table if not exists refresh_tokens (
  id serial primary key,
  user_id int references users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, token_hash)
);

-- === Added for Classroom / Classes feature ===
create table if not exists class_status (
  id serial primary key,
  grade int not null,
  section text not null,
  result_status text not null default 'Pending',
  updated_at timestamptz default now(),
  unique(grade, section)
);

create table if not exists student_tags (
  id serial primary key,
  student_id int references students(id) on delete cascade,
  tag text not null,
  created_at timestamptz default now()
);
create index if not exists idx_student_tags_student_id on student_tags(student_id);
create index if not exists idx_student_tags_tag on student_tags(tag);

create table if not exists attendance_events (
  id serial primary key,
  student_id int references students(id) on delete cascade,
  date date not null,
  present int not null check (present in (0,1)),
  created_at timestamptz default now(),
  unique(student_id, date)
);
create index if not exists idx_attendance_events_student_date on attendance_events(student_id, date);

create table if not exists fee_invoices (
  id serial primary key,
  student_id int references students(id) on delete cascade,
  amount int not null,
  paid_amount int not null default 0,
  due_date date,
  created_at timestamptz default now(),
  settled_at timestamptz
);
create index if not exists idx_fee_invoices_student_id on fee_invoices(student_id);

create table if not exists student_transport (
  id serial primary key,
  student_id int references students(id) on delete cascade,
  route text,
  stop text,
  active int default 1,
  updated_at timestamptz default now()
);
create index if not exists idx_student_transport_student_id on student_transport(student_id);

-- Class teacher assignments
create table if not exists class_teachers (
  id serial primary key,
  grade int not null,
  section text not null,
  teacher_name text not null,
  updated_at timestamptz default now(),
  unique(grade, section)
);

-- Additional performance indexes
create index if not exists idx_students_class_section on students(class, section);
create index if not exists idx_fee_invoices_student_settled on fee_invoices(student_id, settled_at);
-- attendance_events already has composite index; ensure one exists
create index if not exists idx_attendance_events_student_date2 on attendance_events(student_id, date);

