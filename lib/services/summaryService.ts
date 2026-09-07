import { createId } from "../storage";
import type { Achievement, AppState, SummaryReflection, SummaryReport } from "../types";
import { getParticipantStats } from "./statsService";
import { getTasksByWeek, hasCompletedTask, isAnswerTask, isRequiredTask } from "./taskService";

export const MAX_REFLECTION = 400;

/**
 * Итоговый отчёт за программу. Цифры всегда живые — и в предпросмотре, и после дня 30.
 */
export function buildSummary(state: AppState, userId: string): SummaryReport | null {
  const stats = getParticipantStats(state, userId);
  if (!stats) return null;

  return {
    user: stats.user,
    completedTasks: stats.completedTasks,
    closedWeeks: stats.closedWeeks,
    achievements: buildAchievements(state, userId),
    preview: state.group.currentDay < state.group.duration,
  };
}

function buildAchievements(state: AppState, userId: string): Achievement[] {
  const stats = getParticipantStats(state, userId);
  const week1 = getTasksByWeek(state, 1);
  const week1Required = week1.filter(isRequiredTask);
  const firstWeekDone =
    week1Required.length > 0
      ? week1Required.every((task) => hasCompletedTask(state, task.id, userId))
      : week1.length > 0 && week1.every((task) => hasCompletedTask(state, task.id, userId));
  const askedCurator = (state.directMessages ?? []).some((message) => message.fromUserId === userId);
  const wentToEvent = (state.calendarEventResponses ?? []).some((item) => item.userId === userId);
  const answeredQuestion = state.tasks.some(
    (task) => isAnswerTask(task) && hasCompletedTask(state, task.id, userId),
  );

  return [
    { id: "first-week", title: "Первая неделя: обязательные шаги закрыты", unlocked: firstWeekDone },
    {
      id: "week-closed",
      title: "Закрыта хотя бы одна неделя",
      unlocked: (stats?.closedWeeks ?? 0) > 0,
    },
    { id: "question", title: "Написал наставнику лично", unlocked: askedCurator },
    { id: "step-answer", title: "Ответил на шаг-вопрос", unlocked: answeredQuestion },
    { id: "event", title: "Отметил мероприятие", unlocked: wentToEvent },
  ];
}

export function getSummaryReflection(state: AppState, userId: string): SummaryReflection | undefined {
  return (state.summaryReflections ?? []).find((item) => item.userId === userId);
}

function clip(value: string): string {
  return value.trim().slice(0, MAX_REFLECTION);
}

export function saveSummaryReflection(
  state: AppState,
  userId: string,
  input: { mentorNote: string; useful: string; unclear: string },
): AppState {
  if (!state.users.some((user) => user.id === userId)) return state;

  const next: SummaryReflection = {
    id: getSummaryReflection(state, userId)?.id ?? createId("sr"),
    userId,
    mentorNote: clip(input.mentorNote),
    useful: clip(input.useful),
    unclear: clip(input.unclear),
    updatedAt: new Date().toISOString(),
  };

  const list = state.summaryReflections ?? [];
  const exists = list.some((item) => item.userId === userId);

  return {
    ...state,
    summaryReflections: exists
      ? list.map((item) => (item.userId === userId ? next : item))
      : [...list, next],
  };
}

export function hasReflectionText(item?: SummaryReflection): boolean {
  if (!item) return false;
  return Boolean(item.mentorNote || item.useful || item.unclear);
}
