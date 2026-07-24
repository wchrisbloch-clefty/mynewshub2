-- MyNewsHub / Spine — Supabase Schema v1
create table public.newshub_profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  config      jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
alter table public.newshub_profiles enable row level security;
create policy "newshub_profiles_select_own" on public.newshub_profiles for select using (auth.uid() = user_id);
create policy "newshub_profiles_insert_own" on public.newshub_profiles for insert with check (auth.uid() = user_id);
create policy "newshub_profiles_update_own" on public.newshub_profiles for update using (auth.uid() = user_id);

create table public.newshub_events (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  event_type  text not null,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index newshub_events_user_id_created_at_idx on public.newshub_events (user_id, created_at desc);
create index newshub_events_event_type_idx on public.newshub_events (event_type);
alter table public.newshub_events enable row level security;
create policy "newshub_events_select_own" on public.newshub_events for select using (auth.uid() = user_id);
create policy "newshub_events_insert_own" on public.newshub_events for insert with check (auth.uid() = user_id);

create table public.newshub_cached_extracts (
  url             text primary key,
  title           text,
  text_content    text,
  source          text,
  extracted_via   text,
  created_at      timestamptz not null default now()
);
create index newshub_cached_extracts_created_at_idx on public.newshub_cached_extracts (created_at desc);
alter table public.newshub_cached_extracts enable row level security;
create policy "newshub_cache_select_all" on public.newshub_cached_extracts for select using (true);
create policy "newshub_cache_insert_all" on public.newshub_cached_extracts for insert with check (true);
