import { createId } from "../storage";
import type { AppState, CalendarEvent, CalendarEventResponse } from "../types";

export type CalendarEventInput = {
  id?: string;
  day: number;
  time: string;
  title: string;
  location?: string;
  link?: string;
  description?: string;
};

function eventsOfGroup(state: AppState): CalendarEvent[] {
  return (state.calendarEvents ?? []).filter((event) => event.groupId === state.group.id);
}

function compareEvents(a: CalendarEvent, b: CalendarEvent): number {
  if (a.day !== b.day) return a.day - b.day;
  return a.time.localeCompare(b.time);
}

export function getCalendarEvents(state: AppState): CalendarEvent[] {
  return [...eventsOfGroup(state)].sort(compareEvents);
}

export function getCalendarEventsByDay(state: AppState, day: number): CalendarEvent[] {
  return eventsOfGroup(state)
    .filter((event) => event.day === day)
    .sort(compareEvents);
}

function normalizeTime(value: string): string {
  const v = value.trim();
  if (/^\d{2}:\d{2}$/.test(v)) return v;
  return v;
}

export function upsertCalendarEvent(
  state: AppState,
  curatorId: string,
  input: CalendarEventInput,
): { state: AppState; event: CalendarEvent } | { error: string } {
  const day = Number(input.day);
  const time = normalizeTime(input.time);
  const title = input.title.trim();
  const location = (input.location ?? "").trim();
  const link = (input.link ?? "").trim();
  const description = (input.description ?? "").trim();

  if (!Number.isInteger(day) || day < 1 || day > state.group.duration) {
    return { error: `День должен быть числом от 1 до ${state.group.duration}.` };
  }

  if (!/^\d{2}:\d{2}$/.test(time)) {
    return { error: "Время должно быть в формате HH:mm (например, 10:00)." };
  }

  if (title.length < 3) {
    return { error: "Название мероприятия слишком короткое." };
  }

  if (!location && !link) {
    return { error: "Нужно указать либо место, либо ссылку." };
  }

  const now = new Date().toISOString();
  const events = state.calendarEvents ?? [];
  const existing = input.id ? events.find((event) => event.id === input.id) : undefined;

  if (existing) {
    const updated: CalendarEvent = {
      ...existing,
      day,
      time,
      title,
      location: location || undefined,
      link: link || undefined,
      description: description || undefined,
      updatedAt: now,
    };

    return {
      state: {
        ...state,
        calendarEvents: events.map((event) => (event.id === existing.id ? updated : event)),
      },
      event: updated,
    };
  }

  const event: CalendarEvent = {
    id: createId("ce"),
    groupId: state.group.id,
    day,
    time,
    title,
    location: location || undefined,
    link: link || undefined,
    description: description || undefined,
    createdAt: now,
    updatedAt: now,
  };

  return {
    state: { ...state, calendarEvents: [...events, event] },
    event,
  };
}

export function getEventResponses(state: AppState, eventId: string): CalendarEventResponse[] {
  return (state.calendarEventResponses ?? []).filter((item) => item.eventId === eventId);
}

export function hasRespondedToEvent(state: AppState, eventId: string, userId: string): boolean {
  return (state.calendarEventResponses ?? []).some(
    (item) => item.eventId === eventId && item.userId === userId,
  );
}

export function getUnseenCalendarEventCount(state: AppState, userId: string): number {
  return eventsOfGroup(state).filter((event) => !hasRespondedToEvent(state, event.id, userId)).length;
}

export function respondToCalendarEvent(
  state: AppState,
  eventId: string,
  userId: string,
): AppState {
  if (hasRespondedToEvent(state, eventId, userId)) return state;

  const response: CalendarEventResponse = {
    id: createId("cer"),
    eventId,
    userId,
    createdAt: new Date().toISOString(),
  };

  return {
    ...state,
    calendarEventResponses: [...(state.calendarEventResponses ?? []), response],
  };
}

export function cancelCalendarEventResponse(
  state: AppState,
  eventId: string,
  userId: string,
): AppState {
  return {
    ...state,
    calendarEventResponses: (state.calendarEventResponses ?? []).filter(
      (item) => !(item.eventId === eventId && item.userId === userId),
    ),
  };
}

export function removeCalendarEvent(state: AppState, eventId: string): AppState {
  return {
    ...state,
    calendarEvents: (state.calendarEvents ?? []).filter((event) => event.id !== eventId),
    calendarEventResponses: (state.calendarEventResponses ?? []).filter(
      (item) => item.eventId !== eventId,
    ),
  };
}
