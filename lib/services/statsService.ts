import { isFeminineName } from "../utils";
import type {
  AppState,
  ParticipantStats,
  ParticipantStatus,
  User,
  Warning,
} from "../types";
import { getParticipantDay, getParticipants } from "./groupService";
import { getActiveSignals, getSignalsForUser } from "./supportService";
import {
  getCompletedTaskCount,
  getProgramWeek,
  getTasksByWeek,
  getWeekCount,
  hasCompletedTask,
  isRequiredTask,
} from "./taskService";

/**
 * Выполнение программы к текущему дню участника.
 * Считается только по обязательным заданиям уже начавшихся недель.
 */
function countOverdueTasks(state: AppState, userId: string, currentDay: number): number {
  const currentWeek = getProgramWeek(currentDay, state.group.duration);
  return state.tasks.filter(
    (task) =>
      isRequiredTask(task) &&
      task.week < currentWeek &&
      !hasCompletedTask(state, task.id, userId),
  ).length;
}

function countClosedWeeks(state: AppState, userId: string, currentDay: number): number {
  const currentWeek = getProgramWeek(currentDay, state.group.duration);
  const weeks = Math.min(currentWeek, getWeekCount(state.group.duration));
  let closed = 0;

  for (let week = 1; week <= weeks; week += 1) {
    const required = getTasksByWeek(state, week).filter(isRequiredTask);
    if (required.length > 0 && required.every((task) => hasCompletedTask(state, task.id, userId))) {
      closed += 1;
    }
  }

  return closed;
}

export function getParticipantStats(state: AppState, userId: string): ParticipantStats | null {
  const user = state.users.find((item) => item.id === userId);
  if (!user) return null;

  return buildStats(state, user);
}

function buildStats(state: AppState, user: User): ParticipantStats {
  const currentDay = getParticipantDay(state, user.id);
  const elapsedDays = Math.max(currentDay, 1);
  const currentWeek = getProgramWeek(elapsedDays, state.group.duration);
  const assignedTasks = state.tasks.filter(
    (task) => isRequiredTask(task) && task.week <= currentWeek,
  );
  const completedTasks = getCompletedTaskCount(state, user.id);
  const completedAssigned = assignedTasks.filter((task) =>
    hasCompletedTask(state, task.id, user.id),
  ).length;
  const overdueTasks = countOverdueTasks(state, user.id, currentDay);
  const taskShare = assignedTasks.length ? completedAssigned / assignedTasks.length : 1;
  const progress = Math.round(Math.min(1, taskShare) * 100);

  const warnings = buildWarnings(state, user.id, { overdueTasks });

  return {
    user,
    progress,
    currentDay,
    missedDays: overdueTasks,
    completedTasks,
    closedWeeks: countClosedWeeks(state, user.id, currentDay),
    activeToday: currentDay >= state.group.currentDay - 1,
    status: resolveStatus(warnings, overdueTasks),
    warnings,
  };
}

type WarningInput = {
  overdueTasks: number;
};

function buildWarnings(state: AppState, userId: string, input: WarningInput): Warning[] {
  const warnings: Warning[] = [];

  const hasResolvedMissedTasks = getSignalsForUser(state, userId).some(
    (s) => s.type === "missed_tasks" && s.resolved,
  );

  if (!hasResolvedMissedTasks && input.overdueTasks > 0) {
    warnings.push({
      reason: "missed_tasks",
      label: `Не закрыты ${input.overdueTasks} ${input.overdueTasks === 1 ? "задание" : input.overdueTasks < 5 ? "задания" : "заданий"} прошлой недели`,
    });
  }

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

function resolveStatus(warnings: Warning[], overdueTasks: number): ParticipantStatus {
  if (warnings.some((warning) => warning.reason === "manual")) return "needs_support";
  if (overdueTasks > 0 || warnings.length > 0) return "missed";
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
