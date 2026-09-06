-- Аккаунты: логин и хеш пароля. Анон не читает таблицу — только RPC.

create extension if not exists pgcrypto;

create table public.accounts (
  user_id text primary key references public.users (id) on delete cascade,
  login text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.accounts enable row level security;

create or replace function public.register_account(
  p_user_id text,
  p_name text,
  p_role text,
  p_login text,
  p_password text,
  p_invite_code text
)
returns table (user_id text, group_id text, role text, name text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_login text := lower(trim(p_login));
  v_group_id text;
begin
  if p_name !~ '^[A-Za-zА-Яа-яЁё]{2,40}$' then
    raise exception 'NAME_INVALID';
  end if;

  if v_login !~ '^[a-z0-9_]{3,24}$' then
    raise exception 'LOGIN_INVALID';
  end if;

  if char_length(p_password) < 6 or char_length(p_password) > 72 then
    raise exception 'PASSWORD_INVALID';
  end if;

  if p_role not in ('participant', 'curator') then
    raise exception 'ROLE_INVALID';
  end if;

  select g.id into v_group_id
  from public.groups g
  where g.invite_code = upper(trim(p_invite_code));

  if v_group_id is null then
    raise exception 'GROUP_NOT_FOUND';
  end if;

  if exists (select 1 from public.accounts a where a.login = v_login) then
    raise exception 'LOGIN_TAKEN';
  end if;

  insert into public.users (id, name, role, avatar, group_id)
  values (
    p_user_id,
    p_name,
    p_role,
    case when p_role = 'curator' then '🧑‍🏫' else '🙂' end,
    v_group_id
  );

  insert into public.accounts (user_id, login, password_hash)
  values (p_user_id, v_login, crypt(p_password, gen_salt('bf')));

  return query select p_user_id, v_group_id, p_role, p_name;
end;
$$;

create or replace function public.attach_account(
  p_user_id text,
  p_login text,
  p_password text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_login text := lower(trim(p_login));
begin
  if not exists (select 1 from public.users u where u.id = p_user_id) then
    raise exception 'USER_NOT_FOUND';
  end if;

  if v_login !~ '^[a-z0-9_]{3,24}$' then
    raise exception 'LOGIN_INVALID';
  end if;

  if char_length(p_password) < 6 or char_length(p_password) > 72 then
    raise exception 'PASSWORD_INVALID';
  end if;

  if exists (select 1 from public.accounts a where a.login = v_login) then
    raise exception 'LOGIN_TAKEN';
  end if;

  if exists (select 1 from public.accounts a where a.user_id = p_user_id) then
    raise exception 'ACCOUNT_EXISTS';
  end if;

  insert into public.accounts (user_id, login, password_hash)
  values (p_user_id, v_login, crypt(p_password, gen_salt('bf')));
end;
$$;

create or replace function public.sign_in_account(
  p_login text,
  p_password text
)
returns table (user_id text, group_id text, role text, name text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_login text := lower(trim(p_login));
begin
  return query
  select u.id, u.group_id, u.role, u.name
  from public.accounts a
  join public.users u on u.id = a.user_id
  where a.login = v_login
    and a.password_hash = crypt(p_password, a.password_hash);
end;
$$;

revoke all on public.accounts from public, anon, authenticated;
grant execute on function public.register_account(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.attach_account(text, text, text) to anon, authenticated;
grant execute on function public.sign_in_account(text, text) to anon, authenticated;
