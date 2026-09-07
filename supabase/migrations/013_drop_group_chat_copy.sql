-- В продукте нет общего чата группы. Убираем эту формулировку из демо-текстов.

update public.direct_messages
set text = 'Анна, если что-то будет непонятно — пиши сюда. Это личная переписка со мной.'
where id = 'dm-1';

update public.direct_messages
set text = 'Спасибо! Как раз хотела уточнить про оформление учебных документов.'
where id = 'dm-2';

update public.calendar_events
set description = 'Первая встреча курса: куда ходить на пары и кто наставник.'
where id = 'ce-meeting';
