-- ClassSign Database Schema

-- class_templates: 班別範本，可由 admin 管理
-- create table class_templates (
--   id uuid primary key default gen_random_uuid(),
--   name text not null,
--   sort_order int not null default 0
-- );
-- alter table class_templates enable row level security;
-- create policy "anyone can read templates" on class_templates for select using (true);
-- create policy "admin can manage templates" on class_templates for all using (
--   exists (select 1 from profiles where id = auth.uid() and role = 'admin')
-- );
-- insert into class_templates (name, sort_order) values
--   ('前人', 0), ('點傳師', 1), ('壇主人才班', 2),
--   ('長青班', 3), ('青少年班', 4), ('兒童班', 5),
--   ('廚務', 6), ('服務', 7), ('輔導員', 8);

-- 班會
create table sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  reg_deadline date not null,
  status text not null default 'open' check (status in ('open', 'closed', 'finished')),
  -- 報到自訂欄位定義，每場班會可不同
  -- [{ "key": "polo", "label": "POLO衫", "type": "select", "options": ["S","M","L"] }, ...]
  custom_fields jsonb not null default '[]',
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
  -- 報到時填寫的自訂欄位值，對應 sessions.custom_fields 的 key
  -- { "polo": "M", "arrive": "08:30", "meal": true }
  extra jsonb not null default '{}',
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
