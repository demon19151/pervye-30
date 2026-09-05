import { average, isFeminineName } from "../utils";
import type {
  AppState,
  DailyCheckIn,
  ParticipantStats,
  ParticipantStatus,
  User,
  Warning,
} from "../types";
import { getCheckIns, getParticipantDay } from "./checkInService";
import { getParticipants } from "./groupService";
import { getActiveSignals } from "./supportService";

/** Сколько последних дней учитывается в среднем настроении и энергии. */
export const SCORE_WINDOW = 3;

/** Ниже этого значения средние настроение/энергия считаются низкими (условие B). */
export const LOW_SCORE_THRESHOLD = 2.5;

/** Условие A: столько дней подряд без отметки о выполнении. */
export const MISSED_STREAK_THRESHOLD = 3;

/** Мягкий сигнал: столько пропущенных дней всего. */
export const MISSED_TOTAL_THRESHOLD = 2;

/**
 * Выполнение программы к текущему дню участника.
 *
 * Задания весят больше, чем чек-ины: важнее сделать шаг, чем просто отметиться.
 * Значение всегда относительно пройденной части программы, а не всех 30 дней,
 * поэтому участник «в графике» видит 100%.
 */
const TASK_WEIGHT = 0.7;
const CHECK_IN_WEIGHT = 0.3;

function scoreWindow(checkIns: DailyCheckIn[], pick: (item: DailyCheckIn) => number): number {
  const values = checkIns
    .filter((item) => pick(item) > 0)
    .slice(-SCORE_WINDOW)
    .map(pick);

  return average(values);
}

function countMissedDays(checkIns: DailyCheckIn[], currentDay: number): number {
  let missed = 0;

  for (let day = 1; day < currentDay; day += 1) {
    const checkIn = checkIns.find((item) => item.day === day);
    if (!checkIn || !checkIn.completed) missed += 1;
  }

  return missed;
}

function countMissedStreak(checkIns: DailyCheckIn[], currentDay: number): number {
  let streak = 0;

  for (let day = currentDay - 1; day >= 1; day -= 1) {
    const checkIn = checkIns.find((item) => item.day === day);
    if (!checkIn || !checkIn.completed) streak += 1;
    else break;
  }

  return streak;
}

function countCompletedStreak(checkIns: DailyCheckIn[], currentDay: number): number {
  let streak = 0;

  for (let day = currentDay; day >= 1; day -= 1) {
    const checkIn = checkIns.find((item) => item.day === day);
    if (checkIn?.completed) streak += 1;
    else if (day !== currentDay) break;
  }

  return streak;
}

export function getParticipantStats(state: AppState, userId: string): ParticipantStats | null {
  const user = state.users.find((item) => item.id === userId);
  if (!user) return null;

  return buildStats(state, user);
}

function buildStats(state: AppState, user: User): ParticipantStats {
  const checkIns = getCheckIns(state, user.id);
  const currentDay = getParticipantDay(state, user.id);
  const elapsedDays = Math.max(currentDay, 1);

  const completedTasks = checkIns.filter((item) => item.completed).length;
  const activeDays = checkIns.length;

  const progress = Math.round(
    Math.min(
      1,
      (completedTasks / elapsedDays) * TASK_WEIGHT + (activeDays / elapsedDays) * CHECK_IN_WEIGHT,
    ) * 100,
  );

  const mood = scoreWindow(checkIns, (item) => item.mood);
  const energy = scoreWindow(checkIns, (item) => item.energy);
  const missedDays = countMissedDays(checkIns, currentDay);
  const missedStreak = countMissedStreak(checkIns, currentDay);

  const warnings = buildWarnings(state, user.id, { mood, energy, missedDays, missedStreak });

  return {
    user,
    progress,
    currentDay,
    mood,
    energy,
    missedDays,
    completedTasks,
    activeDays,
    streak: countCompletedStreak(checkIns, currentDay),
    // «Активен сегодня» — участник не отстаёт от группы больше чем на один день.
    activeToday: currentDay >= state.group.currentDay - 1,
    status: resolveStatus(warnings, missedDays),
    warnings,
  };
}

type WarningInput = {
  mood: number;
  energy: number;
  missedDays: number;
  missedStreak: number;
};

/**
 * Правила из §8 брифа. Это только социальный сигнал внимания для куратора:
 * никаких оценок состояния человека здесь нет и быть не должно.
 */
function buildWarnings(state: AppState, userId: string, input: WarningInput): Warning[] {
  const warnings: Warning[] = [];

  // Условие A — несколько дней подряд без отметки о выполнении.
  if (input.missedStreak >= MISSED_STREAK_THRESHOLD) {
    warnings.push({
      reason: "missed_tasks",
      label: `Не отмечает задания ${input.missedStreak} ${input.missedStreak > 4 ? "дней" : "дня"} подряд`,
    });
  } else if (input.missedDays >= MISSED_TOTAL_THRESHOLD) {
    warnings.push({ reason: "missed_tasks", label: "Несколько пропущенных дней" });
  }

  // Условие B — низкие средние значения настроения или энергии.
  const lowMood = input.mood > 0 && input.mood <= LOW_SCORE_THRESHOLD;
  const lowEnergy = input.energy > 0 && input.energy <= LOW_SCORE_THRESHOLD;

  if (lowMood || lowEnergy) {
    warnings.push({
      reason: "low_mood",
      label: lowMood && lowEnergy
        ? "Низкие настроение и энергия несколько дней подряд"
        : lowMood
          ? "Низкое настроение несколько дней подряд"
          : "Низкая энергия несколько дней подряд",
    });
  }

  // Условие C — участник сам попросил поддержку.
  const manual = getActiveSignals(state).find(
    (signal) => signal.userId === userId && signal.type === "manual",
  );

  if (manual) {
    warnings.push({
      reason: "manual",
      label: manual.message ? `Просит поддержку: «${manual.message}»` : "Просит поддержку",
    });
  }

  return warnings;
}

function resolveStatus(warnings: Warning[], missedDays: number): ParticipantStatus {
  const needsSupport = warnings.some(
    (warning) => warning.reason === "low_mood" || warning.reason === "manual",
  );

  if (needsSupport) return "needs_support";
  if (missedDays > 0 || warnings.length > 0) return "missed";
  return "active";
}

/** Порядок соответствует порядку вступления в группу — так таблица не «прыгает». */
export function getAllParticipantStats(state: AppState): ParticipantStats[] {
  return getParticipants(state).map((user) => buildStats(state, user));
}

export type GroupStats = {
  participants: number;
  averageProgress: number;
  activeToday: number;
  needAttention: number;
  completedTasks: number;
  currentDay: number;
  duration: number;
};

export function getGroupStats(state: AppState): GroupStats {
  const stats = getAllParticipantStats(state);

  return {
    participants: stats.length,
    averageProgress: stats.length
      ? Math.round(stats.reduce((acc, item) => acc + item.progress, 0) / stats.length)
      : 0,
    activeToday: stats.filter((item) => item.activeToday).length,
    needAttention: stats.filter((item) => item.warnings.length > 0).length,
    completedTasks: stats.reduce((acc, item) => acc + item.completedTasks, 0),
    currentDay: state.group.currentDay,
    duration: state.group.duration,
  };
}

export const statusLabels: Record<ParticipantStatus, string> = {
  active: "Активен",
  missed: "Есть пропуск",
  needs_support: "Нужна поддержка",
};

/** Согласование по роду — мелочь, но интерфейс выглядит живее. */
export function statusLabel(stats: ParticipantStats): string {
  if (stats.status === "active") {
    return isFeminineName(stats.user.name) ? "Активна" : "Активен";
  }

  return statusLabels[stats.status];
}
