import { createId } from "../storage";
import type { AppState, SupportSignal, SupportSignalType } from "../types";

/** Варианты, которые участник выбирает в модальном окне «Нужна поддержка». */
export const supportOptions = [
  "Хочу поговорить",
  "Есть вопрос",
  "Сейчас просто тяжело",
] as const;

export type SupportOption = (typeof supportOptions)[number];

export function getActiveSignals(state: AppState): SupportSignal[] {
  return state.signals.filter((signal) => !signal.resolved);
}

export function getSignalsForUser(state: AppState, userId: string): SupportSignal[] {
  return state.signals.filter((signal) => signal.userId === userId);
}

export function sendSupportSignal(
  state: AppState,
  userId: string,
  message: string,
  type: SupportSignalType = "manual",
): AppState {
  const signal: SupportSignal = {
    id: createId("s"),
    userId,
    type,
    message,
    createdAt: new Date().toISOString(),
    resolved: false,
  };

  return { ...state, signals: [...state.signals, signal] };
}

export function resolveSignalsForUser(state: AppState, userId: string): AppState {
  return {
    ...state,
    signals: state.signals.map((signal) =>
      signal.userId === userId ? { ...signal, resolved: true } : signal,
    ),
  };
}

/**
 * Снимает участника из блока «Требуют внимания» после того, как куратор реально написал.
 *
 * В отличие от {@link resolveSignalsForUser}, здесь мы:
 * - гарантируем наличие resolved-сигналов для low_mood и missed_tasks,
 *   чтобы statsService перестал формировать предупреждения;
 * - также помечаем resolved все существующие сигналы пользователя.
 */
export function resolveAttentionForUser(state: AppState, userId: string): AppState {
  const typesToEnsure: SupportSignalType[] = ["manual", "low_mood", "missed_tasks"];

  const existingByType = new Map<SupportSignalType, boolean>();
  for (const s of state.signals) {
    if (s.userId === userId) existingByType.set(s.type, true);
  }

  const ensuredSignals: SupportSignal[] = typesToEnsure
    .filter((type) => !existingByType.get(type))
    .map((type) => ({
      id: createId("s"),
      userId,
      type,
      message: undefined,
      createdAt: new Date().toISOString(),
      resolved: true,
    }));

  return {
    ...state,
    signals: [...state.signals.map((signal) => (signal.userId === userId ? { ...signal, resolved: true } : signal)), ...ensuredSignals],
  };
}
