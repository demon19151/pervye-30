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
