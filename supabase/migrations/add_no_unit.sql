-- 「不分單位」migration
-- 讓 registrations.unit 允許新值「不分單位」（僅聯合班會掛號時使用）
-- 在 Supabase SQL Editor 執行一次即可

-- registrations 的 unit check 是匿名約束，Postgres 預設命名為 registrations_unit_check
alter table registrations drop constraint if exists registrations_unit_check;

alter table registrations add constraint registrations_unit_check
  check (unit in ('北市','北縣','興一','道一','彰化','華山','基隆','三合','府城','嘉義','不分單位'));
