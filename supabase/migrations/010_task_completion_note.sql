-- Свободный комментарий студента к шагу-вопросу.

alter table public.task_completions
  add column if not exists answer_note text;

comment on column public.task_completions.answer_note is
  'Текст, который студент написал к шагу-вопросу. Наставник видит его в ответах недели.';
