import { curatorSummaryNote, SUMMARY_PREVIEW } from "../mockData";
import { average, isFeminineName } from "../utils";
import type { Achievement, AppState, SummaryReport } from "../types";
import { getCheckIns } from "./checkInService";
import { getParticipantStats } from "./statsService";

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

  const checkIns = getCheckIns(state, userId);
  const preview = state.group.currentDay < state.group.duration;

  const firstHalf = checkIns.slice(0, Math.max(1, Math.ceil(checkIns.length / 2)));
  const secondHalf = checkIns.slice(Math.ceil(checkIns.length / 2));

  const realDelta =
    average(secondHalf.map((item) => item.mood).filter(Boolean)) -
    average(firstHalf.map((item) => item.mood).filter(Boolean));

  return {
    user: stats.user,
    completedTasks: preview ? SUMMARY_PREVIEW.completedTasks : stats.completedTasks,
    activeDays: preview ? SUMMARY_PREVIEW.activeDays : stats.activeDays,
    moodDelta: preview ? SUMMARY_PREVIEW.moodDelta : Math.round(realDelta * 10) / 10,
    achievements: buildAchievements(state, userId),
    curatorNote: curatorSummaryNote(isFeminineName(stats.user.name)),
    preview,
  };
}

function buildAchievements(state: AppState, userId: string): Achievement[] {
  const stats = getParticipantStats(state, userId);
  const checkIns = getCheckIns(state, userId);
  const completedDays = checkIns.filter((item) => item.completed).map((item) => item.day);

  const firstWeekDone = [1, 2, 3, 4, 5, 6, 7].every((day) => completedDays.includes(day));
  const noteWritten = checkIns.some((item) => Boolean(item.note));
  const helpedSomeone = state.messages.some(
    (message) => message.userId === userId && Object.keys(message.reactions).length > 0,
  );

  // Формулировки без рода — одинаково подходят любому участнику.
  return [
    { id: "first-week", title: "Первая неделя пройдена", unlocked: firstWeekDone },
    { id: "streak-5", title: "5 дней подряд без пропусков", unlocked: (stats?.streak ?? 0) >= 5 },
    { id: "feedback", title: "Первая обратная связь получена", unlocked: noteWritten },
    { id: "support", title: "Поддержка участнику группы", unlocked: helpedSomeone },
  ];
}

export const nextPlanGoals = [
  "Взять первую задачу, за которую отвечаешь целиком.",
  "Договориться о регулярной обратной связи раз в две недели.",
  "Найти одну область, в которой хочешь стать опорой для команды.",
];
