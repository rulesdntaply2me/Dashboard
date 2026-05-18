-- Sclass Fitness Cloud Sync V3 Setup
-- Supabase > SQL Editor > New Query > Run

create table if not exists public.sclass_coaching_data (
  coach_key text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table public.sclass_coaching_data enable row level security;

grant usage on schema public to anon;
grant select, insert, update on table public.sclass_coaching_data to anon;

drop policy if exists "sclass anon select" on public.sclass_coaching_data;
drop policy if exists "sclass anon insert" on public.sclass_coaching_data;
drop policy if exists "sclass anon update" on public.sclass_coaching_data;

create policy "sclass anon select"
on public.sclass_coaching_data
for select
to anon
using (true);

create policy "sclass anon insert"
on public.sclass_coaching_data
for insert
to anon
with check (true);

create policy "sclass anon update"
on public.sclass_coaching_data
for update
to anon
using (true)
with check (true);
