-- 報到自訂欄位 migration
-- 在現有 Supabase DB 執行（SQL Editor 貼上跑一次即可）

-- 班會：定義要收集哪些自訂報到欄位
alter table sessions
  add column if not exists custom_fields jsonb not null default '[]';

-- 掛號：存報到時填寫的自訂欄位值
alter table registrations
  add column if not exists extra jsonb not null default '{}';
