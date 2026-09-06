import { curatorSummaryNote, SUMMARY_PREVIEW } from "../mockData";
import { isFeminineName } from "../utils";
import type { Achievement, AppState, SummaryReport } from "../types";
import { getParticipantStats } from "./statsService";
import { getTasksByWeek, hasCompletedTask } from "./taskService";

/**
 * Итоговый отчёт за 30 дней.
 *
 * Пока программа не завершена, показываем предпросмотр на демонстрационных
 * значениях — иначе итоговая страница на седьмом дне выглядела бы пустой.
 * Флаг `preview` даёт интерфейсу об этом честно сказать.
 */
export function buildSummary(state: AppState, userId: string): SummaryReport | null {
  const stats = getParticipantStats(state, userId);
  if (!stats) return null;

  const preview = state.group.currentDay < state.group.duration;

  return {
    user: stats.user,
    completedTasks: preview ? SUMMARY_PREVIEW.completedTasks : stats.completedTasks,
    closedWeeks: preview ? SUMMARY_PREVIEW.closedWeeks : stats.closedWeeks,
    achievements: buildAchievements(state, userId),
    curatorNote: curatorSummaryNote(isFeminineName(stats.user.name)),
    preview,
  };
}

function buildAchievements(state: AppState, userId: string): Achievement[] {
  const stats = getParticipantStats(state, userId);
  const week1 = getTasksByWeek(state, 1);
  const firstWeekDone =
    week1.length > 0 && week1.every((task) => hasCompletedTask(state, task.id, userId));
  const askedCurator = (state.directMessages ?? []).some((message) => message.fromUserId === userId);

  return [
    { id: "first-week", title: "Первая неделя пройдена", unlocked: firstWeekDone },
    { id: "week-closed", title: "Закрыта хотя бы одна неделя", unlocked: (stats?.closedWeeks ?? 0) > 0 },
    { id: "question", title: "Задан вопрос куратору", unlocked: askedCurator },
    { id: "support", title: "Поддержка участнику группы", unlocked: helpedSomeone(state, userId) },
  ];
}

function helpedSomeone(state: AppState, userId: string): boolean {
  return state.messages.some(
    (message) => message.userId === userId && Object.keys(message.reactions).length > 0,
  );
}

export const nextPlanGoals = [
  "Взять первую задачу, за которую отвечаешь целиком.",
  "Договориться о регулярной обратной связи раз в две недели.",
  "Найти одну область, в которой хочешь стать опорой для команды.",
];
