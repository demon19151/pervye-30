-- Дата старта уже есть. Добавляем набор по ключу, архив комнаты и смену пароля.

alter table public.groups
  add column if not exists enrollment_open boolean not null default true;

alter table public.groups
  add column if not exists archived_at timestamptz;

comment on column public.groups.enrollment_open is
  'false — по ключу приглашения больше нельзя зарегистрироваться.';

comment on column public.groups.archived_at is
  'Когда наставник завершил программу. Комната сохраняется, набор закрыт.';

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
  v_enrollment_open boolean;
  v_archived_at timestamptz;
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

  select g.id, g.enrollment_open, g.archived_at
    into v_group_id, v_enrollment_open, v_archived_at
  from public.groups g
  where g.invite_code = upper(trim(p_invite_code));

  if v_group_id is null then
    raise exception 'GROUP_NOT_FOUND';
  end if;

  if v_archived_at is not null or v_enrollment_open is false then
    raise exception 'ENROLLMENT_CLOSED';
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

create or replace function public.get_account_login(p_user_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_login text;
begin
  select a.login into v_login from public.accounts a where a.user_id = p_user_id;
  return v_login;
end;
$$;

create or replace function public.change_account_password(
  p_user_id text,
  p_current_password text,
  p_new_password text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
begin
  if char_length(p_new_password) < 6 or char_length(p_new_password) > 72 then
    raise exception 'PASSWORD_INVALID';
  end if;

  select a.password_hash into v_hash from public.accounts a where a.user_id = p_user_id;

  if v_hash is null then
    raise exception 'ACCOUNT_NOT_FOUND';
  end if;

  if v_hash <> crypt(p_current_password, v_hash) then
    raise exception 'PASSWORD_WRONG';
  end if;

  update public.accounts
    set password_hash = crypt(p_new_password, gen_salt('bf'))
  where user_id = p_user_id;
end;
$$;

grant execute on function public.register_account(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.get_account_login(text) to anon, authenticated;
grant execute on function public.change_account_password(text, text, text) to anon, authenticated;
