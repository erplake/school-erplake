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
