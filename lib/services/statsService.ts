import { isFeminineName } from "../utils";
import type {
  AppState,
  ParticipantStats,
  ParticipantStatus,
  Task,
  TaskAnswer,
  User,
  Warning,
} from "../types";
import { getParticipantDay, getParticipants } from "./groupService";
import { getActiveSignals, getSignalsForUser } from "./supportService";
import {
  getCompletedTaskCount,
  getCurrentWeek,
  getProgramWeek,
  getTaskCompletion,
  getTasksByWeek,
  getWeekAnswerTasks,
  getWeekCount,
  hasCompletedTask,
  isRequiredTask,
  needsCuratorAttention,
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

/** Сколько обязательных шагов текущей недели закрыли участники. */
export function getWeekGoalProgress(
  state: AppState,
  week = getCurrentWeek(state),
): { week: number; done: number; target: number } {
  const tracking = getWeekRequiredStepTracking(state, week);
  const done = tracking.reduce((sum, item) => sum + item.doneCount, 0);
  const target = tracking.reduce((sum, item) => sum + item.doneCount + item.pendingCount, 0);

  return { week, done, target };
}

export const statusLabels: Record<ParticipantStatus, string> = {
  active: "Активен",
  missed: "Есть пропуск",
  needs_support: "Нужна поддержка",
};

function compareStepResponses<T extends { user: User; completed: boolean; answer?: TaskAnswer }>(
  left: T,
  right: T,
  task: Task,
): number {
  const rank = (item: T) => {
    if (item.completed && needsCuratorAttention(item.answer, task)) return 0;
    if (!item.completed) return 1;
    return 2;
  };

  const diff = rank(left) - rank(right);
  if (diff !== 0) return diff;
  return left.user.name.localeCompare(right.user.name, "ru");
}

export type ParticipantStepAnswer = {
  user: User;
  answer?: TaskAnswer;
  note?: string;
  completed: boolean;
  completedAt?: string;
};

export type WeekStepAnswerTracking = {
  task: Task;
  responses: ParticipantStepAnswer[];
  answeredCount: number;
  pendingCount: number;
  attentionCount: number;
};

export type WeekRequiredStepTracking = {
  task: Task;
  responses: Array<{ user: User; completed: boolean; completedAt?: string }>;
  doneCount: number;
  pendingCount: number;
};

export type WeekTrackingSummary = {
  unansweredCount: number;
  attentionCount: number;
  requiredOpenCount: number;
};

export type SilentStepParticipant = {
  user: User;
  weeks: number;
};

/** Вопросы и статусы из «Шаги этой недели»: кто ответил и какой вариант выбрал. */
export function getWeekStepAnswerTracking(
  state: AppState,
  week = getCurrentWeek(state),
): WeekStepAnswerTracking[] {
  const participants = getParticipants(state);

  return getWeekAnswerTasks(state, week).map((task) => {
    const responses = participants
      .map((user) => {
        const completion = getTaskCompletion(state, task.id, user.id);
        return {
          user,
          answer: completion?.answer,
          note: completion?.answerNote,
          completed: Boolean(completion),
          completedAt: completion?.createdAt,
        };
      })
      .sort((left, right) => compareStepResponses(left, right, task));
    const answeredCount = responses.filter((item) => item.completed).length;

    return {
      task,
      responses,
      answeredCount,
      pendingCount: participants.length - answeredCount,
      attentionCount: responses.filter((item) => needsCuratorAttention(item.answer, task)).length,
    };
  });
}

export function getWeekRequiredStepTracking(
  state: AppState,
  week = getCurrentWeek(state),
): WeekRequiredStepTracking[] {
  const participants = getParticipants(state);
  const tasks = getTasksByWeek(state, week).filter(isRequiredTask);

  return tasks.map((task) => {
    const responses = participants
      .map((user) => {
        const completion = getTaskCompletion(state, task.id, user.id);
        return {
          user,
          completed: Boolean(completion),
          completedAt: completion?.createdAt,
        };
      })
      .sort((left, right) => {
        if (left.completed !== right.completed) return left.completed ? 1 : -1;
        return left.user.name.localeCompare(right.user.name, "ru");
      });

    const doneCount = responses.filter((item) => item.completed).length;
    return {
      task,
      responses,
      doneCount,
      pendingCount: participants.length - doneCount,
    };
  });
}

export function summarizeWeekTracking(
  answers: WeekStepAnswerTracking[],
  required: WeekRequiredStepTracking[],
): WeekTrackingSummary {
  const unanswered = new Set<string>();
  const attention = new Set<string>();
  const requiredOpen = new Set<string>();

  for (const item of answers) {
    for (const response of item.responses) {
      if (!response.completed) unanswered.add(response.user.id);
      if (response.completed && needsCuratorAttention(response.answer, item.task)) {
        attention.add(response.user.id);
      }
    }
  }

  for (const item of required) {
    for (const response of item.responses) {
      if (!response.completed) requiredOpen.add(response.user.id);
    }
  }

  return {
    unansweredCount: unanswered.size,
    attentionCount: attention.size,
    requiredOpenCount: requiredOpen.size,
  };
}

export function countSilentAnswerWeeks(
  state: AppState,
  userId: string,
  throughWeek = getCurrentWeek(state),
): number {
  let streak = 0;

  for (let week = throughWeek; week >= 1; week -= 1) {
    const tasks = getWeekAnswerTasks(state, week);
    if (tasks.length === 0) continue;
    const answeredAny = tasks.some((task) => hasCompletedTask(state, task.id, userId));
    if (answeredAny) break;
    streak += 1;
  }

  return streak;
}

export function getSilentStepParticipants(
  state: AppState,
  throughWeek = getCurrentWeek(state),
  minWeeks = 2,
): SilentStepParticipant[] {
  return getParticipants(state)
    .map((user) => ({
      user,
      weeks: countSilentAnswerWeeks(state, user.id, throughWeek),
    }))
    .filter((item) => item.weeks >= minWeeks)
    .sort((left, right) => right.weeks - left.weeks || left.user.name.localeCompare(right.user.name, "ru"));
}

export function getParticipantWeekStepAnswers(
  state: AppState,
  userId: string,
  week = getCurrentWeek(state),
): Array<{
  task: Task;
  answer?: TaskAnswer;
  note?: string;
  completed: boolean;
  completedAt?: string;
}> {
  return getWeekAnswerTasks(state, week).map((task) => {
    const completion = getTaskCompletion(state, task.id, userId);
    return {
      task,
      answer: completion?.answer,
      note: completion?.answerNote,
      completed: Boolean(completion),
      completedAt: completion?.createdAt,
    };
  });
}

export function getParticipantWeekRequiredProgress(
  state: AppState,
  userId: string,
  week = getCurrentWeek(state),
): { done: number; total: number } {
  const tasks = getTasksByWeek(state, week).filter(isRequiredTask);
  const done = tasks.filter((task) => hasCompletedTask(state, task.id, userId)).length;
  return { done, total: tasks.length };
}

/** Согласование по роду — мелочь, но интерфейс выглядит живее. */
export function statusLabel(stats: ParticipantStats): string {
  if (stats.status === "active") {
    return isFeminineName(stats.user.name) ? "Активна" : "Активен";
  }

  return statusLabels[stats.status];
}
