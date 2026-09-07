-- Тип «статус» больше не используется: такие шаги становятся вопросами.

update public.tasks
set
  kind = 'question',
  answer_options = coalesce(
    answer_options,
    '[
      {"id":"clear","label":"Всё понятно","needsAttention":false},
      {"id":"question","label":"Есть вопрос","needsAttention":true},
      {"id":"help","label":"Нужна помощь","needsAttention":true}
    ]'::jsonb
  )
where kind = 'status';

alter table public.tasks drop constraint if exists tasks_kind_check;

alter table public.tasks
  add constraint tasks_kind_check
  check (kind in ('required', 'recommended', 'question'));
