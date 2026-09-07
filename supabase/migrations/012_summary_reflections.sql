-- Итоговый отзыв студента: о наставнике, самое полезное и что осталось непонятным.

create table if not exists public.summary_reflections (
  id text primary key,
  user_id text not null unique references public.users (id) on delete cascade,
  mentor_note text not null default '',
  useful text not null default '',
  unclear text not null default '',
  updated_at timestamptz not null default now()
);

comment on table public.summary_reflections is
  'Итоговый отзыв студента: о наставнике, самое полезное и что осталось непонятным.';

alter table public.summary_reflections enable row level security;

drop policy if exists summary_reflections_demo on public.summary_reflections;
create policy summary_reflections_demo on public.summary_reflections
  for all to anon, authenticated using (true) with check (true);

grant all on table public.summary_reflections to anon, authenticated;
