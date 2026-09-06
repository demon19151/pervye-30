-- Демо-аккаунты участников g-work. Пароли совпадают с lib/demoAccounts.ts.

insert into public.accounts (user_id, login, password_hash)
select v.user_id, v.login, extensions.crypt(v.password, extensions.gen_salt('bf'))
from (
  values
    ('u-anna', 'anna', 'P30anna7'),
    ('u-maxim', 'maksim', 'P30maksim7'),
    ('u-irina', 'irina', 'P30irina7'),
    ('u-dmitry', 'dmitry', 'P30dmitry7')
) as v(user_id, login, password)
where exists (select 1 from public.users u where u.id = v.user_id)
  and not exists (
    select 1 from public.accounts a
    where a.user_id = v.user_id or a.login = v.login
  );
