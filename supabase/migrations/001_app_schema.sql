-- Схема «Первые 30»: факты, не счётчики. Старые черновые таблицы удаляем.

drop table if exists public.event_reac cascade;
drop table if exists public."Finals_metrics" cascade;
drop table if exists public.progress cascade;
drop table if exists public.grop_members cascade;
drop table if exists public."Events" cascade;
drop table if exists public.groups cascade;
drop table if exists public.profiles cascade;

drop table if exists public.calendar_event_responses cascade;
drop table if exists public.calendar_event_views cascade;
drop table if exists public.calendar_events cascade;
drop table if exists public.task_completions cascade;
drop table if exists public.tasks cascade;
drop table if exists public.messages cascade;
drop table if exists public.direct_messages cascade;
drop table if exists public.signals cascade;
drop table if exists public.announcements cascade;
drop table if exists public.users cascade;

create table public.groups (
  id text primary key,
  name text not null,
  description text not null default '',
  invite_code text not null unique,
  duration integer not null,
  current_day integer not null,
  program_start_date date,
  curator_id text not null,
  weekly_goal_title text,
  weekly_goal_target integer,
  weekly_goal_done integer
);

create table public.users (
  id text primary key,
  name text not null,
  role text not null check (role in ('participant', 'curator')),
  avatar text,
  group_id text not null references public.groups (id) on delete cascade
);

create table public.tasks (
  id text primary key,
  group_id text not null references public.groups (id) on delete cascade,
  week integer not null,
  kind text not null check (kind in ('required', 'recommended', 'question', 'status')),
  title text not null,
  description text not null default ''
);

create table public.task_completions (
  id text primary key,
  task_id text not null references public.tasks (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  answer text,
  unique (task_id, user_id)
);

create table public.messages (
  id text primary key,
  group_id text not null references public.groups (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now(),
  reactions jsonb not null default '{}'::jsonb
);

create table public.direct_messages (
  id text primary key,
  group_id text not null references public.groups (id) on delete cascade,
  from_user_id text not null references public.users (id) on delete cascade,
  to_user_id text not null references public.users (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create table public.signals (
  id text primary key,
  user_id text not null references public.users (id) on delete cascade,
  type text not null check (type in ('manual', 'missed_tasks')),
  message text,
  created_at timestamptz not null default now(),
  resolved boolean not null default false
);

create table public.announcements (
  id text primary key,
  group_id text not null references public.groups (id) on delete cascade,
  curator_id text not null references public.users (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create table public.calendar_events (
  id text primary key,
  group_id text not null references public.groups (id) on delete cascade,
  day integer not null,
  time text not null,
  title text not null,
  location text,
  link text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.calendar_event_responses (
  id text primary key,
  event_id text not null references public.calendar_events (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table public.calendar_event_views (
  user_id text primary key references public.users (id) on delete cascade,
  last_seen_at timestamptz not null
);

alter table public.groups enable row level security;
alter table public.users enable row level security;
alter table public.tasks enable row level security;
alter table public.task_completions enable row level security;
alter table public.messages enable row level security;
alter table public.direct_messages enable row level security;
alter table public.signals enable row level security;
alter table public.announcements enable row level security;
alter table public.calendar_events enable row level security;
alter table public.calendar_event_responses enable row level security;
alter table public.calendar_event_views enable row level security;

create policy groups_demo on public.groups for all to anon, authenticated using (true) with check (true);
create policy users_demo on public.users for all to anon, authenticated using (true) with check (true);
create policy tasks_demo on public.tasks for all to anon, authenticated using (true) with check (true);
create policy task_completions_demo on public.task_completions for all to anon, authenticated using (true) with check (true);
create policy messages_demo on public.messages for all to anon, authenticated using (true) with check (true);
create policy direct_messages_demo on public.direct_messages for all to anon, authenticated using (true) with check (true);
create policy signals_demo on public.signals for all to anon, authenticated using (true) with check (true);
create policy announcements_demo on public.announcements for all to anon, authenticated using (true) with check (true);
create policy calendar_events_demo on public.calendar_events for all to anon, authenticated using (true) with check (true);
create policy calendar_event_responses_demo on public.calendar_event_responses for all to anon, authenticated using (true) with check (true);
create policy calendar_event_views_demo on public.calendar_event_views for all to anon, authenticated using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
