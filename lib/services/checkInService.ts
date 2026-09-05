import { createId } from "../storage";
import type { AppState, DailyCheckIn } from "../types";

export type CheckInPatch = Partial<Pick<DailyCheckIn, "completed" | "mood" | "energy" | "note">>;

export function getCheckIns(state: AppState, userId: string): DailyCheckIn[] {
  return state.checkIns.filter((item) => item.userId === userId).sort((a, b) => a.day - b.day);
}

export function getCheckIn(state: AppState, userId: string, day: number): DailyCheckIn | undefined {
  return state.checkIns.find((item) => item.userId === userId && item.day === day);
}

/**
 * Текущий день участника — первый день без чек-ина, но не дальше текущего дня группы.
 * Так участник, пропустивший дни, остаётся на своём дне, а группа живёт по своему графику.
 */
export function getParticipantDay(state: AppState, userId: string): number {
  const checkIns = getCheckIns(state, userId);
  const days = new Set(checkIns.map((item) => item.day));

  let day = 1;
  while (days.has(day) && day <= state.group.duration) day += 1;

  return Math.min(day, state.group.currentDay);
}

/** Создаёт или обновляет чек-ин участника за конкретный день. */
export function upsertCheckIn(
  state: AppState,
  userId: string,
  day: number,
  patch: CheckInPatch,
): AppState {
  const existing = getCheckIn(state, userId, day);
  const updatedAt = new Date().toISOString();

  if (existing) {
    return {
      ...state,
      checkIns: state.checkIns.map((item) =>
        item.id === existing.id ? { ...item, ...patch, updatedAt } : item,
      ),
    };
  }

  const created: DailyCheckIn = {
    id: createId("ci"),
    userId,
    day,
    completed: false,
    mood: 0,
    energy: 0,
    ...patch,
    updatedAt,
  };

  return { ...state, checkIns: [...state.checkIns, created] };
}

export function completeTask(state: AppState, userId: string, day: number): AppState {
  return upsertCheckIn(state, userId, day, { completed: true });
}

export function undoTask(state: AppState, userId: string, day: number): AppState {
  return upsertCheckIn(state, userId, day, { completed: false });
}

export type SaveDayInput = {
  mood: number;
  energy: number;
  note: string;
};

export function saveDay(
  state: AppState,
  userId: string,
  day: number,
  input: SaveDayInput,
): { state: AppState } | { error: string } {
  if (!input.mood || !input.energy) {
    return { error: "Отметьте настроение и энергию, чтобы сохранить день." };
  }

  return {
    state: upsertCheckIn(state, userId, day, {
      mood: input.mood,
      energy: input.energy,
      note: input.note.trim() || undefined,
    }),
  };
}
