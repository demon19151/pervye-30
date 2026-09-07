-- Кнопки ответа, которые куратор задаёт для вопросов и статусов.

alter table public.tasks
  add column if not exists answer_options jsonb;

comment on column public.tasks.answer_options is
  'Кнопки ответа для вопроса/статуса: [{id, label, needsAttention}]';
