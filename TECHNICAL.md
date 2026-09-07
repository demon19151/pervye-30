# Техническая документация: код «Первые 30»

Эта заметка описывает, как устроена кодовая база текущего MVP проекта `pervye-30`: где лежит бизнес-логика, как устроена синхронизация с Supabase, как считается прогресс и как работает AI-чат-виджет.

## 1. Архитектура в двух слоях

### 1) UI-слой (Next.js App Router)

- Страницы лежат в `app/**/page.tsx` и отвечают за отображение и вызов “сервисов”.
- Компоненты лежат в `components/**` (UI-примитивы и доменные виджеты).

UI не хранит “истину” о состоянии. Он работает с единым снимком состояния приложения (`AppState`).

### 2) Логический слой (lib/)

- Доменная модель и типы: `lib/types.ts`
- “Чистые” сервисы, которые преобразуют состояние: `lib/services/*.ts`
- Supabase-синхронизация (загрузка/запись): `lib/supabase/persist.ts`
- Централизованный стор: `lib/store/app-store.tsx`
- ИИ/поиск по базе знаний: `lib/bot/*`

Ключевое правило: сервисы работают с текущим `state` и возвращают **новый** `state` (или `{ state }` / `{ error }`).

## 2. Единый `AppState` и центр управления состоянием

### `AppStoreProvider`

Центр управления состоянием: `lib/store/app-store.tsx`.

Основные функции:

- `fetchState()` — загрузка снимка из Supabase через `lib/supabase/persist.ts`
- `update(updater)` — применяет чистую функцию сервиса и **асинхронно** сохраняет diff в Supabase через `persistState(prev,next)`
- `updateAsync(updater)` — то же, но ожидает сохранение перед продолжением
- `hydrate(next)` — подмена снимка без записи таблиц (нужно для смены аккаунта/входа)
- `reset()` — “сброс демо” через `resetRemoteState()`

### Сессия на устройстве

Сессия хранится отдельно от Postgres в `localStorage` ключом:

- `pervye-30:session`

Логика сохранения/загрузки сессии — в `lib/supabase/persist.ts` (`loadSession()`, `saveSession()`).

## 3. Как устроена Supabase-синхронизация

Supabase-клиент:

- `lib/supabase/client.ts`
- берёт `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- без них приложение выбрасывает ошибку

### Загрузка: `fetchState()`

В `lib/supabase/persist.ts`:

- `fetchState(preferredGroupId?)`:
  - определяет, какую комнату грузить (`resolveGroupId`)
  - загружает группы/пользователей/задания/сообщения/сигналы/мероприятия/рефлексии из Postgres
  - собирает всё в `AppState`

Таблицы, с которыми работает сборка состояния (`assembleState`):

- `groups`
- `users`
- `tasks`
- `task_completions`
- `messages`
- `direct_messages`
- `signals`
- `announcements`
- `calendar_events`
- `calendar_event_responses`
- `calendar_event_views`
- `summary_reflections`

### Запись: `persistState(prev,next)`

В `lib/supabase/persist.ts`:

1. `groups`: всегда делается `upsert` актуальной записи.
2. Дальше для каждой связанной сущности используется универсальный механизм `syncById()`:
   - вычисляется список удалённых `id` (делает `delete`)
   - вычисляется список изменённых/новых (делает `upsert`)
3. `calendar_event_views`: обработка отличается (удаление “по пользователям”, а затем “обновление изменённых”).
4. `summary_reflections`: сохраняется через `upsert` (обычная `syncById`-логика).

Итог: UI вызывает сервисы, а слой persist делает “запись по разнице” между снимками.

### Сброс демо

`resetRemoteState()`:

- **не удаляет всё приложение**, а удаляет только демо-группу `GROUP_ID`
- связанные данные уйдут по FK on delete cascade
- далее “подчищает” списки в новом стартовом `fresh`
- вызывает `seedDemoAccounts()` (RPC `seed_demo_accounts`)

## 4. Домен: типы и идентификаторы

Типы сущностей определены в `lib/types.ts`.

Ключевые идеи:

- Для новых сущностей используются идентификаторы с префиксом из `lib/storage.ts`:
  - `createId(prefix)` возвращает строку вида `<prefix>-<time>-<rand>`
- У `Group` в текущем MVP длительность фиксирована: программа рассчитана на 30 дней
- Текущий день (`currentDay`) зависит от `programStartDate` и общесистемной длительности.

## 5. Бизнес-логика: где что считается

### 5.1. Комнаты и участники: `lib/services/groupService.ts`

Основные сценарии:

- `createRoom(state,input)` — создаёт новую комнату (инвайт-код, старт, задачи по шаблону, куратора)
- `createGroup(state,input)` — обновляет текущую комнату (в текущем MVP — имя/описание; длительность не редактируется)
- `joinGroup(state,{name,code,role})` — вход участника по приглашению
- `switchRole(state,role)` — переключение роли только для демонстрации
- `setEnrollmentOpen`, `archiveGroup`, `unarchiveGroup`
- `rotateInviteCode` — новый ключ для текущей комнаты

### 5.2. Задания и ответы: `lib/services/taskService.ts`

Концепции:

- `TASK_KINDS`: `required` / `recommended` / `question`
- обязательность влияет на прогресс/предупреждения
- недельная сетка вычисляется через:
  - `getWeekCount(duration)`
  - `getProgramWeek(day,duration)`
  - `getWeekBounds(week,duration)`

Сохранение отметок:

- `completeWeekTask(...)` записывает/обновляет `task_completions`
- `undoWeekTask(...)` снимает отметку

### 5.3. Прогресс и предупреждения: `lib/services/statsService.ts`

`statsService` считает `ParticipantStats` по обязательным шагам “текущих” недель:

- `progress` — доля выполненных обязательных заданий
- `missedDays` / `closedWeeks` — пропуски и закрытые недели
- `warnings` — причины “нужна поддержка” или “есть пропуск”

Предупреждения учитывают:

- пропущенные обязательные задания
- активные сигналы поддержки (ручные сигналы — через `supportService`)

### 5.4. Поддержка: `lib/services/supportService.ts`

Сигналы “Нужна поддержка” хранятся как сущности `signals`:

- `sendSupportSignal(...)`
- `resolveSignalsForUser(...)`
- `resolveAttentionForUser(...)`:
  - помечает как `resolved` “missed_tasks” и “manual”, чтобы statsService перестал формировать предупреждения

### 5.5. Личные переписки: `lib/services/directMessageService.ts`

- тред двух пользователей: `getThread(state,userA,userB)`
- новые сообщения: `addDirectMessage(...)`
- аналитика по треду:
  - `getUnreadCuratorReplies(...)`
  - `getWaitingStudentCount(...)`

### 5.6. Мероприятия: `lib/services/calendarEventsService.ts`

- `upsertCalendarEvent(...)` — добавление/обновление события
- `respondToCalendarEvent(...)` — отметка “ответил”
- `getUpcomingCalendarEvent(...)` / `getUnseenCalendarEventCount(...)`

### 5.7. Итоги: `lib/services/summaryService.ts`

`buildSummary(state,userId)` строит итоговый отчёт:

- цифры берутся из `statsService`
- `preview = currentDay < duration`

Тексты наставника сохраняются функцией `saveSummaryReflection(...)` в `summary_reflections`.

## 6. UI-страницы и роуты: что за что отвечает

В основном страницы вызывают сервисы и обновляют стор через `useAppStore().update(...)` / `updateAsync(...)`.

Примеры “точек входа”:

- `app/page.tsx` — лендинг
- `app/login/page.tsx` — вход по логину/паролю (в демо есть кнопки)
- `app/join/page.tsx` — регистрация по `inviteCode`
- `app/create-group/page.tsx` — создание новой комнаты наставником
- `app/participant/page.tsx` — дашборд участника (задания недели, прогресс, отметки)
- `app/curator/page.tsx` — обзор наставника
- `app/curator/settings/page.tsx` — настройки комнаты наставника (в текущем MVP: имя/описание; старт задаётся при создании)
- `app/ask/page.tsx` — ИИ-помощник
- `app/events/page.tsx`, `app/group/page.tsx`, `app/summary/page.tsx` и т.д.

## 7. ИИ Помощник (RAG-чат)

Серверный endpoint:

- `app/api/bot-chat/route.ts`

Ключевые особенности:

- `runtime = "nodejs"`
- endpoint возвращает **стримом NDJSON**
- в ответе помимо текста возвращаются “sources” при достаточной confidence

Внутренний пайплайн:

- retrieval: `lib/bot/rag/retrieve.ts`
- сбор контекста: `lib/bot/rag/prompt.ts`
- генерация/стрим: `lib/bot/llm.ts`

Ограничения:

- максимальная длина вопроса
- ограничение истории (`MAX_HISTORY_TURNS`)
- rate-limit по `clientKey(...)`

Формат базы знаний:

- `knowledge/*.md` с YAML front-matter
- retrieval собирает фрагменты, которые затем попадают в prompt

## 8. Как безопасно расширять код

### Добавить новую сущность (новую таблицу)

Минимальный путь:

1. Добавить тип в `lib/types.ts`
2. Добавить чтение/маппинг в `lib/supabase/persist.ts` (`assembleState`)
3. Добавить запись/синхронизацию в `persistState` (обычно через `syncById`)
4. Добавить SQL-миграцию в `supabase/migrations/*`
5. Добавить сервис преобразований в `lib/services/*`
6. Использовать сервисы из UI-страниц/компонентов

### Добавить новый тип задания/логику прогресса

- обновить `TaskKind`/валидации в `taskService.ts`
- если это влияет на “обязательность” — обновить:
  - `isRequiredTask(...)`
  - расчёт `progress`/`warnings` в `statsService.ts`

## 9. Конфигурация и env

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ИИ (LLM на сервере): `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`
- embeddings (опционально): `EMBEDDINGS_API_KEY`, `EMBEDDINGS_BASE_URL`, `EMBEDDINGS_MODEL`, `EMBEDDINGS_DIM`

Полный список — в `README.md`.

