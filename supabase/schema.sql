-- ClassSign Database Schema

-- 班會
create table sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  reg_deadline date not null,
  status text not null default 'open' check (status in ('open', 'closed', 'finished')),
  created_at timestamptz default now()
);

-- 班別（屬於某個班會）
create table classes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);

-- 掛號
create table registrations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  unit text not null check (unit in ('北市','北縣','興一','道一','彰化','華山','基隆','三合','府城','嘉義')),
  name text not null,
  gender text not null check (gender in ('乾','坤')),
  registered boolean not null default true,
  checked_in boolean not null default false,
  checked_in_at timestamptz,
  qr_token text unique not null default gen_random_uuid()::text,
  created_at timestamptz default now()
);

-- 索引
create index on registrations(session_id);
create index on registrations(class_id);
create index on registrations(unit);
create index on registrations(qr_token);

-- RLS（Row Level Security）
alter table sessions enable row level security;
alter table classes enable row level security;
alter table registrations enable row level security;

-- 暫時開放所有權限（之後可加 Auth 限制）
create policy "allow all" on sessions for all using (true);
create policy "allow all" on classes for all using (true);
create policy "allow all" on registrations for all using (true);
