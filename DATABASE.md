# База данных «Первые 30»

Документ описывает, **как устроена БД**, что в ней лежит, а что считается в коде.

Проект: Supabase Postgres `mbnuoxartfkddjymgeif` (eu-west-1).  
Схема: `public`. Миграции: `supabase/migrations/`.

---

## 1. Идея

В базе хранятся **факты**: кто в группе, какие шаги, кто что закрыл, какие мероприятия, кто идёт.

Не хранятся **отчёты**: проценты, «неделя закрыта», «обязательные шаги: 3 из 5», средний прогресс группы. Их считает `lib/services/statsService.ts` из фактов.

Сессия («сейчас на этом устройстве Анна») **не в Postgres**. Она в `localStorage` (`pervye-30:session`). Данные группы общие, «кто я» — локально.

---

## 2. Как приложение ходит в базу

```
Экран (клик «Сделано» / «Пойду» / новое мероприятие)
  → чистая функция сервиса: service(state) → новый AppState
  → AppStore (lib/store/app-store.tsx)
  → persistState(prev, next)  (lib/supabase/persist.ts)
  → таблицы Supabase
```

При загрузке страницы `fetchState()` читает **одну комнату**: группу сессии, иначе демо `g-work`. UI и сервисы работают с этим снимком, как раньше с localStorage. Новые комнаты создаёт куратор (`createRoom`) — у каждой свой `invite_code`.

Запись **по разнице**:

- новая или изменённая строка → `upsert`;
- строка была в прошлом снимке и пропала → `delete`;
- чужие строки, которых этот браузер не видел, не трогаются.

Идентификаторы — текст (`g-work`, `u-anna`, `ce-mtq3sa41-oqn3k`), не UUID. Новые id выдаёт `createId()` в `lib/storage.ts`.

Клиент: `lib/supabase/client.ts` (`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

---

## 3. Карта связей

```
groups 1 ─── * users
groups 1 ─── * tasks ─── * task_completions ─── users
groups 1 ─── * calendar_events ─── * calendar_event_responses ─── users
groups 1 ─── * direct_messages ─── users (from / to)
groups 1 ─── * messages, announcements
users  1 ─── * signals
users  1 ─── 1 calendar_event_views
```

`ON DELETE CASCADE`: удалили группу — исчезли люди, шаги, события и переписка этой группы.

---

## 4. Таблицы

### `groups` — комнаты программы

В базе может быть несколько групп. Демо — `g-work` / `P30WORK`. Новая комната получает ключ вида `P30K7M2`.

| Колонка | Смысл |
| --- | --- |
| `id` | `g-work` или `g-…` |
| `name`, `description` | название и текст группы |
| `invite_code` | уникальный код входа |
| `duration` | длина программы в днях (30) |
| `current_day` | какой сейчас день программы (7) |
| `program_start_date` | календарная дата дня 1 (`2026-08-28`) |
| `curator_id` | кто куратор (`u-elena`) |
| `weekly_goal_title` / `_target` / `_done` | цель недели на вкладке «Группа» |

День мероприятия — **номер дня программы** (1…30), не дата из календаря. Дату клетки считает фронт от `program_start_date`.

### `users` — участники и куратор

| Колонка | Смысл |
| --- | --- |
| `id` | `u-anna`, `u-elena`, … |
| `name` | имя на входе |
| `role` | `participant` или `curator` |
| `avatar` | эмодзи |
| `group_id` | ссылка на `groups` |

Вход `/join`: имя + код + роль. Если такое имя и роль уже есть — берётся существующая строка. Иначе создаётся новая в `users`.

Регистрация ученика — `/join` (имя, логин, пароль, код комнаты). Вход — `/login` (логин и пароль). На входе демо-кнопки Анна / Максим / Ирина / Дмитрий подставляют готовые логины. Куратор создаёт аккаунт на `/create-group`. Хеш пароля клиенту не отдаётся — только RPC `register_account`, `attach_account`, `sign_in_account`.

### `tasks` — шаги недели

| Колонка | Смысл |
| --- | --- |
| `id` | `t-w1-1` |
| `group_id` | чья программа |
| `week` | неделя 1…4 |
| `kind` | `required` / `recommended` / `question` / `status` |
| `title`, `description` | текст шага |

Это каталог заданий, не прогресс.

### `task_completions` — кто закрыл шаг

| Колонка | Смысл |
| --- | --- |
| `id` | id отметки |
| `task_id` + `user_id` | уникальная пара: один человек — один шаг |
| `created_at` | когда отметили |
| `answer` | для вопроса/статуса: `yes`, `no`, `clear`, `question`, `help` |

«Обязательные шаги: 3 из 5» = число строк completions по `required` задачам текущей недели.

### `calendar_events` — мероприятия

| Колонка | Смысл |
| --- | --- |
| `id` | например `ce-meeting` или `ce-mtq3sa41-oqn3k` |
| `group_id` | группа |
| `day` | день программы 1…30 |
| `time` | `HH:mm` |
| `title` | название |
| `location`, `link`, `description` | место, ссылка, текст |
| `created_at`, `updated_at` | служебные |

Куратор жмёт «Добавить» на `/events` — появляется **новая строка здесь**.  
В Table Editor: проект → Table Editor → `calendar_events`.

### `calendar_event_responses` — «Пойду»

| Колонка | Смысл |
| --- | --- |
| `id` | id отклика |
| `event_id` | на какое событие |
| `user_id` | кто идёт |
| `created_at` | когда отметился |

Пара `(event_id, user_id)` уникальна. Снял «Я иду» — строка удаляется.

### `calendar_event_views`

Когда участник открывал вкладку «Мероприятия» (`user_id`, `last_seen_at`). Нужно для бейджа непросмотренных.

### `direct_messages`

Личные сообщения куратор ↔ участник (`/ask`). Поля: `from_user_id`, `to_user_id`, `text`, `created_at`.

### `messages`, `announcements`, `signals`

Остались в схеме (лента, объявления, сигналы поддержки). Часть экранов их больше не показывает, но сброс демо и снимок состояния их ещё читают.

---

## 5. Что происходит при действиях

| Действие | Таблица | Операция |
| --- | --- | --- |
| Войти как Анна | `users` | чтение; новая строка, если имени нет |
| «Сделано» на шаге | `task_completions` | insert |
| Снять отметку | `task_completions` | delete |
| Добавить мероприятие | `calendar_events` | insert |
| Изменить / удалить событие | `calendar_events` | update / delete (+ каскад откликов) |
| «Пойду» | `calendar_event_responses` | insert |
| «Я иду» ещё раз | `calendar_event_responses` | delete |
| Написать куратору | `direct_messages` | insert |
| Сбросить демо | все таблицы группы | delete + залить seed |

Сброс: настройки куратора / профиль / меню имени → `resetRemoteState()`.

---

## 6. Демо-данные

Миграция `supabase/migrations/002_seed_demo.sql`:

- группа `g-work`, код `P30WORK`, день 7, старт 28 августа 2026;
- Елена (куратор), Анна, Максим, Ирина, Дмитрий;
- 18 шагов на 4 недели;
- отметки первой недели;
- 2 стартовых события: собрание (день 5), хакатон (день 25).

---

## 7. Безопасность (важно для документации)

RLS включён, но политики демо: **anon может читать и писать все таблицы**.  
Ключ `NEXT_PUBLIC_SUPABASE_ANON_KEY` лежит в браузере — так и задумано для клиента Supabase. Защита «только свой профиль» ещё не сделана. Для курса/диплома это нужно явно написать как ограничение MVP.

---

## 8. Переменные окружения

| Имя | Где |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local`, Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local`, Vercel |

Без них приложение пишет: «Нет NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_ANON_KEY».  
`NEXT_PUBLIC_*` вшиваются **на сборке**. После добавления на Vercel нужен Redeploy.

Локально: `npm run dev`, в логе должно быть `Environments: .env.local`.

---

## 9. Как проверить

1. Table Editor: [таблицы проекта](https://supabase.com/dashboard/project/mbnuoxartfkddjymgeif/editor).
2. Добавь мероприятие в приложении → новая строка в `calendar_events`.
3. «Пойду» → строка в `calendar_event_responses` с тем же `event_id`.
4. SQL:

```sql
select id, day, time, title, location
from public.calendar_events
order by created_at desc;

select r.id, r.event_id, r.user_id, e.title
from public.calendar_event_responses r
join public.calendar_events e on e.id = r.event_id;
```

---

## 10. Файлы в репозитории

| Файл | Роль |
| --- | --- |
| `supabase/migrations/001_app_schema.sql` | таблицы, FK, RLS |
| `supabase/migrations/002_seed_demo.sql` | демо |
| `supabase/migrations/003_accounts.sql` | логин/пароль, RPC |
| `supabase/migrations/004_accounts_pgcrypto_search_path.sql` | pgcrypto в schema extensions |
| `lib/supabase/client.ts` | клиент |
| `lib/supabase/persist.ts` | чтение/запись снимка |
| `lib/store/app-store.tsx` | загрузка при старте и сохранение после сервисов |
| `lib/types.ts` | доменная модель |
| `.env.example` | имена переменных без секретов |
