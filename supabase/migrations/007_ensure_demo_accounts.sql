-- Посев без удаления: иначе вход в эти 2–3 секунды ловит «неверный пароль».

create or replace function public.ensure_demo_accounts()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.accounts (user_id, login, password_hash)
  select v.user_id, v.login, crypt(v.password, gen_salt('bf'))
  from (
    values
      ('u-anna', 'anna', 'P30anna7'),
      ('u-maxim', 'maksim', 'P30maksim7'),
      ('u-irina', 'irina', 'P30irina7'),
      ('u-dmitry', 'dmitry', 'P30dmitry7')
  ) as v(user_id, login, password)
  where exists (select 1 from public.users u where u.id = v.user_id)
    and not exists (select 1 from public.accounts a where a.user_id = v.user_id);
end;
$$;

create or replace function public.seed_demo_accounts()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.accounts (user_id, login, password_hash)
  select v.user_id, v.login, crypt(v.password, gen_salt('bf'))
  from (
    values
      ('u-anna', 'anna', 'P30anna7'),
      ('u-maxim', 'maksim', 'P30maksim7'),
      ('u-irina', 'irina', 'P30irina7'),
      ('u-dmitry', 'dmitry', 'P30dmitry7')
  ) as v(user_id, login, password)
  where exists (select 1 from public.users u where u.id = v.user_id)
  on conflict (user_id) do update
    set login = excluded.login,
        password_hash = excluded.password_hash;
end;
$$;

grant execute on function public.ensure_demo_accounts() to anon, authenticated;
grant execute on function public.seed_demo_accounts() to anon, authenticated;
