"use client";

import { useEffect, useState } from "react";
import { Check, Clock, MapPin, Pencil, Plus, Trash2, Users } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn, pluralize } from "@/lib/utils";
import { useAppStore } from "@/lib/store/app-store";
import {
  cancelCalendarEventResponse,
  getCalendarEvents,
  getCalendarEventsByDay,
  getEventResponses,
  hasRespondedToEvent,
  removeCalendarEvent,
  respondToCalendarEvent,
  upsertCalendarEvent,
} from "@/lib/services/calendarEventsService";
import type { AppState, CalendarEvent } from "@/lib/types";

export default function EventsPage() {
  return (
    <AppShell>
      <EventsCalendar />
    </AppShell>
  );
}

/*
  VK-лента мероприятий временно отключена — вместо неё календарь программы.
  Код ниже оставляем, чтобы потом вернуть загрузку из сообществ.

  function EventsFeed() {
    const [data, setData] = useState(null);
    useEffect(() => { void fetch("/api/vk-events"); }, []);
    return ... VkEventCard ...
  }
*/

function EventsCalendar() {
  const { state, currentUser, update } = useAppStore();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [infoDay, setInfoDay] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [day, setDay] = useState(1);
  const [time, setTime] = useState("10:00");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!modalOpen || !state) return;

    const existing = editingId
      ? (state.calendarEvents ?? []).find((event) => event.id === editingId)
      : undefined;

    setDay(existing?.day ?? day);
    setTime(existing?.time ?? "10:00");
    setTitle(existing?.title ?? "");
    setLocation(existing?.location ?? "");
    setLink(existing?.link ?? "");
    setDescription(existing?.description ?? "");
  }, [modalOpen, editingId, state]);

  if (!state || !currentUser) return null;

  const { duration } = state.group;
  const isCurator = currentUser.role === "curator";
  const events = getCalendarEvents(state);
  const infoEvents = infoDay !== null ? getCalendarEventsByDay(state, infoDay) : [];

  const openDay = (dayNumber: number) => {
    if (isCurator) {
      setEditingId(null);
      setDay(dayNumber);
      setModalOpen(true);
      return;
    }

    setInfoDay(dayNumber);
  };

  const openCreate = (dayNumber: number) => {
    if (!isCurator) return;
    setEditingId(null);
    setDay(dayNumber);
    setModalOpen(true);
  };

  const openEdit = (event: CalendarEvent) => {
    if (!isCurator) return;
    setEditingId(event.id);
    setDay(event.day);
    setModalOpen(true);
  };

  const onSubmit = () => {
    if (!isCurator) return;

    const res = upsertCalendarEvent(state, currentUser.id, {
      id: editingId ?? undefined,
      day,
      time,
      title,
      location: location || undefined,
      link: link || undefined,
      description: description || undefined,
    });

    if ("error" in res) {
      toast.toast(res.error, "warning");
      return;
    }

    update(() => res.state);
    toast.toast(editingId ? "Мероприятие обновлено." : "Мероприятие сохранено.", "success");
    setModalOpen(false);
    setEditingId(null);
  };

  const onDelete = (eventId: string) => {
    if (!isCurator) return;
    update((current) => removeCalendarEvent(current, eventId));
    toast.toast("Мероприятие удалено.", "info");
    setModalOpen(false);
    setEditingId(null);
  };

  const onRespond = (eventId: string) => {
    if (isCurator) return;
    update((current) => respondToCalendarEvent(current, eventId, currentUser.id));
    toast.toast("Отклик отправлен.", "success");
  };

  const onCancelResponse = (eventId: string) => {
    if (isCurator) return;
    update((current) => cancelCalendarEventResponse(current, eventId, currentUser.id));
    toast.toast("Отклик отменён.", "info");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Мероприятия"
        subtitle={
          isCurator
            ? "Нажми на день, чтобы добавить ещё одно мероприятие. В один день можно несколько событий."
            : "Нажми на день или откликнись на мероприятие. Уведомление исчезнет после отклика."
        }
        action={
          isCurator ? (
            <Button size="sm" onClick={() => openCreate(day || 1)}>
              <Plus className="size-4" />
              Добавить
            </Button>
          ) : null
        }
      />

      <Card className="overflow-visible p-5 sm:p-6">
        <div className="grid grid-cols-6 gap-2 overflow-visible sm:grid-cols-10">
          {Array.from({ length: duration }, (_, index) => index + 1).map((dayNumber) => {
            const dayEvents = getCalendarEventsByDay(state, dayNumber);
            const hasEvent = dayEvents.length > 0;

            return (
              <div
                key={dayNumber}
                role="button"
                tabIndex={0}
                onClick={() => openDay(dayNumber)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openDay(dayNumber);
                  }
                }}
                className={cn(
                  "relative flex aspect-square cursor-pointer items-center justify-center rounded-xl text-[13px] font-semibold tabular-nums ring-1 ring-inset transition-colors hover:ring-2 hover:ring-[#6d55f5]",
                  hasEvent
                    ? "bg-[#6d55f5] text-white ring-[#6d55f5] shadow-accent"
                    : "bg-surface-muted text-subtle ring-line",
                )}
              >
                <span>{dayNumber}</span>
                {dayEvents.length > 1 ? (
                  <span className="absolute right-1 top-1 rounded-full bg-white/90 px-1 text-[9px] font-bold leading-4 text-[#6d55f5]">
                    {dayEvents.length}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#6d55f5]" aria-hidden />
            день с мероприятиями
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-surface-muted ring-1 ring-inset ring-line" aria-hidden />
            обычный день
          </span>
        </div>
      </Card>

      {events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <EventDetails
                  event={event}
                  responses={responseNames(state, event.id)}
                  className="min-w-0 flex-1"
                />
                {isCurator ? (
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    <Button variant="outline" size="sm" onClick={() => openEdit(event)}>
                      <Pencil className="size-3.5" />
                      Изменить
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => onDelete(event.id)}>
                      <Trash2 className="size-3.5" />
                      Удалить
                    </Button>
                  </div>
                ) : (
                  <RespondButton
                    responded={hasRespondedToEvent(state, event.id, currentUser.id)}
                    onRespond={() => onRespond(event.id)}
                    onCancel={() => onCancelResponse(event.id)}
                  />
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">
          {isCurator
            ? "Пока нет мероприятий. Нажми на день в календаре, чтобы добавить первое."
            : "Куратор ещё не добавил мероприятия в календарь."}
        </p>
      )}

      <Modal
        open={infoDay !== null}
        onClose={() => setInfoDay(null)}
        title={infoDay !== null ? `День ${infoDay}` : "День"}
        description={
          infoEvents.length > 0
            ? `На этот день ${infoEvents.length} ${pluralize(infoEvents.length, "мероприятие", "мероприятия", "мероприятий")}.`
            : "Информация о мероприятиях в этот день программы."
        }
        footer={
          <Button variant="ghost" onClick={() => setInfoDay(null)}>
            Закрыть
          </Button>
        }
      >
        {infoEvents.length > 0 ? (
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {infoEvents.map((event) => (
              <div key={event.id} className="overflow-hidden rounded-2xl bg-surface-muted p-4">
                <div className="flex items-start gap-3">
                  <EventDetails
                    event={event}
                    hideDay
                    responses={responseNames(state, event.id)}
                    className="min-w-0 flex-1"
                  />
                  {isCurator ? null : (
                    <RespondButton
                      responded={hasRespondedToEvent(state, event.id, currentUser.id)}
                      onRespond={() => onRespond(event.id)}
                      onCancel={() => onCancelResponse(event.id)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-muted">
            На этот день куратор пока не добавил мероприятия.
          </p>
        )}
      </Modal>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
        }}
        title={editingId ? "Редактировать мероприятие" : "Добавить мероприятие"}
        description="В один день можно несколько событий. Заполни название, место или ссылку и краткое описание."
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            {editingId ? (
              <Button variant="danger" onClick={() => onDelete(editingId)}>
                <Trash2 className="size-4" />
                Удалить
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                variant="ghost"
                onClick={() => {
                  setModalOpen(false);
                  setEditingId(null);
                }}
              >
                Отмена
              </Button>
              <Button
                onClick={onSubmit}
                disabled={
                  title.trim().length < 3 ||
                  (!location.trim() && !link.trim()) ||
                  !/^\d{2}:\d{2}$/.test(time.trim())
                }
              >
                Сохранить
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="День программы" htmlFor="event-day" hint={`1..${duration}`}>
            <Input
              id="event-day"
              type="number"
              min={1}
              max={duration}
              value={day}
              onChange={(event) => setDay(Number(event.target.value))}
              className="max-w-28"
            />
          </Field>

          <Field label="Время" htmlFor="event-time">
            <Input
              id="event-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </Field>

          <Field label="Название" htmlFor="event-title" hint="Например: Хакатон">
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название мероприятия"
              maxLength={120}
            />
          </Field>

          <Field label="Место" htmlFor="event-location" hint="Если указываешь ссылку — место можно оставить пустым.">
            <Input
              id="event-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Например: Главный корпус, ауд. 123"
              maxLength={180}
            />
          </Field>

          <Field label="Ссылка" htmlFor="event-link" hint="Ссылка на страницу/регистрацию.">
            <Input
              id="event-link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              maxLength={220}
            />
          </Field>

          <Field label="Краткое описание" htmlFor="event-description">
            <Textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Коротко: что будет и что нужно сделать участникам."
              maxLength={400}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

function responseNames(state: AppState, eventId: string): string[] {
  return getEventResponses(state, eventId)
    .map((item) => state.users.find((user) => user.id === item.userId)?.name)
    .filter((name): name is string => Boolean(name));
}

function RespondButton({
  responded,
  onRespond,
  onCancel,
}: {
  responded: boolean;
  onRespond: () => void;
  onCancel: () => void;
}) {
  if (responded) {
    return (
      <Button variant="secondary" size="sm" className="shrink-0" onClick={onCancel}>
        <Check className="size-3.5" />
        Вы откликнулись
      </Button>
    );
  }

  return (
    <Button size="sm" className="shrink-0" onClick={onRespond}>
      Откликнуться
    </Button>
  );
}

function EventDetails({
  event,
  hideDay = false,
  responses = [],
  className,
}: {
  event: CalendarEvent;
  hideDay?: boolean;
  responses?: string[];
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 space-y-1.5 overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {hideDay ? null : (
          <span className="inline-flex rounded-full bg-[#6d55f5] px-2.5 py-0.5 text-[12px] font-semibold text-white">
            День {event.day}
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-[13px] text-muted">
          <Clock className="size-3.5 shrink-0" />
          {event.time}
        </span>
      </div>
      <p className="break-all text-[16px] font-semibold [overflow-wrap:anywhere]">{event.title}</p>
      {event.location ? (
        <p className="flex items-start gap-1.5 text-[13px] text-muted">
          <MapPin className="mt-0.5 size-3.5 shrink-0" />
          <span className="min-w-0 break-all [overflow-wrap:anywhere]">{event.location}</span>
        </p>
      ) : null}
      {event.link ? (
        <a
          href={event.link}
          target="_blank"
          rel="noreferrer"
          className="block break-all text-[13px] text-[#6d55f5] hover:underline [overflow-wrap:anywhere]"
        >
          {event.link}
        </a>
      ) : null}
      {event.description ? (
        <p className="break-all text-[14px] leading-relaxed text-muted [overflow-wrap:anywhere]">{event.description}</p>
      ) : null}
      {responses.length > 0 ? (
        <p className="flex items-start gap-1.5 text-[13px] text-muted">
          <Users className="mt-0.5 size-3.5 shrink-0" />
          <span className="min-w-0 break-all [overflow-wrap:anywhere]">
            Откликнулись ({responses.length}): {responses.join(", ")}
          </span>
        </p>
      ) : null}
    </div>
  );
}
