"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Clock, MapPin, Pencil, Plus, Trash2 } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProgramWeekCalendar } from "@/components/program-week-calendar";
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
  hasRespondedToEvent,
  removeCalendarEvent,
  respondToCalendarEvent,
  upsertCalendarEvent,
} from "@/lib/services/calendarEventsService";
import type { CalendarEvent } from "@/lib/types";

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

  const calendarRef = useRef<HTMLDivElement>(null);
  const [listMaxHeight, setListMaxHeight] = useState<number | null>(null);

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
    if (!state || !currentUser) return;

    const node = calendarRef.current;
    if (!node) return;

    const syncHeight = () => {
      const desktop = window.matchMedia("(min-width: 1024px)").matches;
      setListMaxHeight(desktop ? Math.round(node.getBoundingClientRect().height) : null);
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(node);
    window.addEventListener("resize", syncHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeight);
    };
  }, [state, currentUser]);

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

  const { duration, currentDay, programStartDate } = state.group;
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
    toast.toast("Записал тебя.", "success");
  };

  const onCancelResponse = (eventId: string) => {
    if (isCurator) return;
    update((current) => cancelCalendarEventResponse(current, eventId, currentUser.id));
    toast.toast("Ок, не идёшь.", "info");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="block text-[2rem] leading-tight tracking-tight sm:text-[2.4rem]">Мероприятия</span>}
        subtitle={
          <span className="block max-w-2xl text-[15px] leading-relaxed sm:text-base">
            День {currentDay} из {duration}
            {events.length > 0
              ? ` · ${events.length} ${pluralize(events.length, "мероприятие", "мероприятия", "мероприятий")}`
              : " · пока без событий"}
            {duration === 30 ? " · неделя в календаре с понедельника" : ""}
          </span>
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

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)]">
        <div ref={calendarRef}>
          <Card className="overflow-visible rounded-2xl p-5 sm:p-6">
            <ProgramWeekCalendar
              duration={duration}
              startDate={programStartDate}
              renderDay={(dayNumber) => (
                <CalendarDayCell
                  dayNumber={dayNumber}
                  events={getCalendarEventsByDay(state, dayNumber)}
                  isToday={dayNumber === currentDay}
                  onOpen={() => openDay(dayNumber)}
                />
              )}
            />

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2.5 text-[13px] text-muted">
              <span className="inline-flex items-center gap-2">
                <span className="size-3 rounded-[4px] bg-accent" aria-hidden />
                день с мероприятием
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-3 rounded-[4px] bg-accent-soft ring-2 ring-inset ring-accent" aria-hidden />
                сегодня
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-3 rounded-[4px] bg-[#f3f2f8] ring-1 ring-inset ring-line" aria-hidden />
                обычный день
              </span>
            </div>
          </Card>
        </div>

        <Card
          className="flex min-h-0 flex-col overflow-hidden rounded-2xl p-0"
          style={listMaxHeight ? { maxHeight: listMaxHeight } : undefined}
        >
          <div className="shrink-0 border-b border-line px-5 py-4 sm:px-6">
            <h2 className="text-lg font-semibold tracking-tight">Список мероприятий</h2>
          </div>

          {events.length > 0 ? (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
              {events.map((event) => (
                  <Card key={event.id} className="overflow-hidden p-5">
                    <div className="flex items-start gap-4">
                      <EventDetails event={event} className="min-w-0 flex-1" />
                      {isCurator ? (
                        <div className="flex shrink-0 flex-col gap-2">
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
            <p className="px-5 py-6 text-[15px] leading-relaxed text-muted sm:px-6">
              {isCurator
                ? "Пока нет мероприятий. Нажми на день в календаре, чтобы добавить первое."
                : "Куратор ещё не добавил мероприятия в календарь."}
            </p>
          )}
        </Card>
      </div>

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

function shortEventLabel(title: string) {
  const word = title.trim().split(/\s+/)[0] ?? title;
  return word.length > 11 ? `${word.slice(0, 10)}…` : word;
}

function CalendarDayCell({
  dayNumber,
  events,
  isToday,
  onOpen,
}: {
  dayNumber: number;
  events: CalendarEvent[];
  isToday: boolean;
  onOpen: () => void;
}) {
  const hasEvent = events.length > 0;
  const eventLabel = hasEvent ? shortEventLabel(events[0].title) : null;
  const label = hasEvent
    ? `День ${dayNumber}: ${events.map((event) => event.title).join(", ")}`
    : isToday
      ? `День ${dayNumber}, сегодня`
      : `День ${dayNumber}`;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      className={cn(
        "relative flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl text-[13px] font-semibold tabular-nums transition-all duration-200 sm:text-[15px]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60",
        hasEvent && "bg-accent text-white hover:bg-accent-strong",
        !hasEvent && !isToday && "bg-[#f3f2f8] text-foreground ring-1 ring-inset ring-line hover:ring-accent",
        !hasEvent && isToday && "bg-accent-soft text-accent ring-2 ring-inset ring-accent hover:bg-accent-soft",
      )}
    >
      <span>{dayNumber}</span>
      {hasEvent ? (
        <span
          className={cn(
            "hidden max-w-[90%] truncate px-0.5 text-[11px] font-medium leading-none sm:block",
            hasEvent ? "text-white/90" : "text-muted",
          )}
        >
          {eventLabel}
        </span>
      ) : isToday ? (
        <span className="hidden text-[11px] font-medium leading-none sm:block">сегодня</span>
      ) : null}
      {events.length > 1 ? (
        <span className="absolute right-1 top-1 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold leading-none text-accent">
          {events.length}
        </span>
      ) : null}
    </button>
  );
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
      <Button
        variant="success"
        size="sm"
        className="shrink-0"
        aria-pressed="true"
        onClick={onCancel}
      >
        <Check className="size-3.5" />
        Я иду
      </Button>
    );
  }

  return (
    <Button size="sm" className="shrink-0" aria-pressed="false" onClick={onRespond}>
      Пойду
    </Button>
  );
}

function EventDetails({
  event,
  hideDay = false,
  className,
}: {
  event: CalendarEvent;
  hideDay?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 space-y-2 overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {hideDay ? null : (
          <span className="inline-flex rounded-full bg-accent px-2.5 py-1 text-[13px] font-semibold text-white">
            День {event.day}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 text-[14px] text-muted">
          <Clock className="size-4 shrink-0" />
          {event.time}
        </span>
      </div>
      <p className="break-all text-[17px] font-semibold leading-snug tracking-tight [overflow-wrap:anywhere]">
        {event.title}
      </p>
      {event.location ? (
        <p className="flex items-start gap-1.5 text-[14px] leading-relaxed text-muted">
          <MapPin className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0 break-all [overflow-wrap:anywhere]">{event.location}</span>
        </p>
      ) : null}
      {event.link ? (
        <a
          href={event.link}
          target="_blank"
          rel="noreferrer"
          className="block break-all text-[14px] text-accent hover:text-accent-strong hover:underline [overflow-wrap:anywhere]"
        >
          {event.link}
        </a>
      ) : null}
      {event.description ? (
        <p className="break-all text-[14px] leading-relaxed text-muted [overflow-wrap:anywhere]">{event.description}</p>
      ) : null}
    </div>
  );
}
