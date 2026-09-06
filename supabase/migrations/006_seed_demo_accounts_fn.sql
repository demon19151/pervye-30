create or replace function public.seed_demo_accounts()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  delete from public.accounts
  where user_id in ('u-anna', 'u-maxim', 'u-irina', 'u-dmitry')
     or login in ('anna', 'maksim', 'irina', 'dmitry', 'maxim');

  insert into public.accounts (user_id, login, password_hash)
  select v.user_id, v.login, crypt(v.password, gen_salt('bf'))
  from (
    values
      ('u-anna', 'anna', 'P30anna7'),
      ('u-maxim', 'maksim', 'P30maksim7'),
      ('u-irina', 'irina', 'P30irina7'),
      ('u-dmitry', 'dmitry', 'P30dmitry7')
  ) as v(user_id, login, password)
  where exists (select 1 from public.users u where u.id = v.user_id);
end;
$$;

grant execute on function public.seed_demo_accounts() to anon, authenticated;

select public.seed_demo_accounts();
