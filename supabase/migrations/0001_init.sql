-- ============================================================================
--  TYPESENSE — initial schema (run in the Supabase SQL editor or via CLI)
--  All user data is protected by row-level security: users only ever see
--  their own rows. The frontend only ever receives the anon key.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------ profiles
create table if not exists public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  display_name         text        not null default 'Typist',
  avatar               text        not null default 'keyboard',
  daily_goal_minutes   integer     not null default 15 check (daily_goal_minutes between 1 and 240),
  preferred_difficulty smallint    not null default 3 check (preferred_difficulty between 1 and 5),
  xp                   integer     not null default 0 check (xp >= 0),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- auto-create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------ sessions
create table if not exists public.sessions (
  id            text primary key,
  user_id       uuid        not null references auth.users (id) on delete cascade,
  mode          text        not null check (mode in ('time', 'words', 'custom', 'lesson', 'practice')),
  source        text        not null check (source in ('test', 'practice', 'lesson')),
  practice_mode text,
  lesson_id     text,
  target        integer     not null default 0,
  text          text        not null,
  started_at    timestamptz not null,
  finished_at   timestamptz not null,
  metrics       jsonb       not null,
  key_stats     jsonb       not null default '[]'::jsonb,
  errors        jsonb       not null default '[]'::jsonb,
  timeline      jsonb       not null default '[]'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists sessions_user_started_idx
  on public.sessions (user_id, started_at desc);

-- --------------------------------------------------------- lesson progress
create table if not exists public.lesson_progress (
  user_id        uuid        not null references auth.users (id) on delete cascade,
  lesson_id      text        not null,
  status         text        not null default 'in-progress'
                 check (status in ('locked', 'available', 'in-progress', 'completed')),
  attempts       integer     not null default 0,
  best_accuracy  real        not null default 0,
  best_wpm       real        not null default 0,
  completed_at   timestamptz,
  updated_at     timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- ------------------------------------------------------------------- achivs
create table if not exists public.user_achievements (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  achievement text        not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement)
);

-- ------------------------------------------------------------------ settings
create table if not exists public.user_settings (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  theme     text        not null default 'system' check (theme in ('light', 'dark', 'system')),
  updated_at timestamptz not null default now()
);

-- ============================================================================
--  ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles          enable row level security;
alter table public.sessions          enable row level security;
alter table public.lesson_progress   enable row level security;
alter table public.user_achievements enable row level security;
alter table public.user_settings     enable row level security;

-- profiles: owner only
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- sessions: owner only
drop policy if exists "sessions_select_own" on public.sessions;
create policy "sessions_select_own" on public.sessions
  for select using (auth.uid() = user_id);
drop policy if exists "sessions_insert_own" on public.sessions;
create policy "sessions_insert_own" on public.sessions
  for insert with check (auth.uid() = user_id);
drop policy if exists "sessions_delete_own" on public.sessions;
create policy "sessions_delete_own" on public.sessions
  for delete using (auth.uid() = user_id);

-- lesson progress: owner only
drop policy if exists "lesson_progress_all_own" on public.lesson_progress;
create policy "lesson_progress_all_own" on public.lesson_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- achievements: owner only
drop policy if exists "achievements_all_own" on public.user_achievements;
create policy "achievements_all_own" on public.user_achievements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- settings: owner only
drop policy if exists "settings_all_own" on public.user_settings;
create policy "settings_all_own" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
