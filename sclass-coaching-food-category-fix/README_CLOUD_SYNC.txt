Sclass Fitness Cloud Sync Setup

This version still works offline/local, but can save across devices through Supabase.

1. Create a free Supabase project.
2. Go to SQL Editor and run:

create table if not exists public.sclass_coaching_data (
  coach_key text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table public.sclass_coaching_data enable row level security;

create policy "Allow anon dashboard sync"
on public.sclass_coaching_data
for all
to anon
using (true)
with check (true);

3. In the app, open Cloud Save.
4. Paste your Supabase Project URL.
5. Paste your Supabase anon/public key.
6. Use one private Coach Sync ID, for example: dakota-sclass-main.
7. Click Save To Cloud on your main device.
8. On another device, enter the same 3 cloud fields and click Load From Cloud.
9. Turn on Auto Cloud Save after confirming it works.

Important: This simple static version uses a shared Coach Sync ID. Do not share your Supabase URL/key/Coach Sync ID publicly. For full client-login security, the next version should use Supabase Auth.
