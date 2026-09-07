import { describe, expect, it } from "vitest";
import { createInitialState, DEMO_PARTICIPANT_ID } from "../mockData";
import {
  getAllParticipantStats,
  getGroupStats,
  getParticipantStats,
  getSilentStepParticipants,
  getWeekRequiredStepTracking,
  getWeekStepAnswerTracking,
  getWeekGoalProgress,
  summarizeWeekTracking,
} from "./statsService";
import { completeWeekTask } from "./taskService";

describe("statsService", () => {
  it("getParticipantStats возвращает null для несуществующего пользователя", () => {
    const state = createInitialState(new Date("2024-01-08T00:00:00Z"));
    expect(getParticipantStats(state, "nope")).toBeNull();
  });

  it("getParticipantStats возвращает статистику для существующего участника", () => {
    const state = createInitialState(new Date("2024-01-08T00:00:00Z"));
    const stats = getParticipantStats(state, DEMO_PARTICIPANT_ID);

    expect(stats).not.toBeNull();
    expect(stats?.user.id).toBe(DEMO_PARTICIPANT_ID);
    expect(stats?.progress).toBeGreaterThanOrEqual(0);
    expect(stats?.progress).toBeLessThanOrEqual(100);
  });

  it("участник без просрочки и сигналов получает статус active", () => {
    const state = createInitialState(new Date("2024-01-08T00:00:00Z"));
    const stats = getParticipantStats(state, "u-irina");

    expect(stats).not.toBeNull();
    expect(stats?.status).toBe("active");
    expect(stats?.warnings).toHaveLength(0);
  });

  it("пустые дни без задания не считаются пропусками", () => {
    const state = createInitialState(new Date("2024-01-08T00:00:00Z"));
    const stats = getParticipantStats(state, DEMO_PARTICIPANT_ID);

    expect(stats?.missedDays).toBe(0);
  });

  it("активный участник без пропусков получает статус active", () => {
    const state = createInitialState(new Date("2024-01-08T00:00:00Z"));
    const stats = getParticipantStats(state, "u-dmitry");

    expect(stats?.status).toBe("active");
    expect(stats?.warnings).toHaveLength(0);
  });

  it("getAllParticipantStats возвращает статистику по каждому участнику", () => {
    const state = createInitialState(new Date("2024-01-08T00:00:00Z"));
    const stats = getAllParticipantStats(state);
    const participants = state.users.filter((u) => u.role === "participant");

    expect(stats).toHaveLength(participants.length);
  });

  it("getGroupStats агрегирует показатели группы", () => {
    const state = createInitialState(new Date("2024-01-08T00:00:00Z"));
    const groupStats = getGroupStats(state);

    expect(groupStats.participants).toBe(4);
    expect(groupStats.currentDay).toBe(state.group.currentDay);
    expect(groupStats.duration).toBe(state.group.duration);
    expect(groupStats.averageProgress).toBeGreaterThanOrEqual(0);
    expect(groupStats.averageProgress).toBeLessThanOrEqual(100);
  });

  it("getWeekStepAnswerTracking показывает ответы на вопросы недели", () => {
    const state = createInitialState(new Date("2024-01-08T00:00:00Z"));
    const tracking = getWeekStepAnswerTracking(state, 1);
    const question = tracking.find((item) => item.task.id === "t-w1-7");

    expect(question).toBeDefined();
    expect(question?.answeredCount).toBe(3);
    expect(question?.pendingCount).toBe(1);
    expect(question?.attentionCount).toBe(1);
    expect(question?.responses.map((item) => item.user.id)).toEqual([
      "u-maxim",
      "u-irina",
      "u-anna",
      "u-dmitry",
    ]);
    expect(question?.responses.find((item) => item.user.id === "u-irina")?.completed).toBe(false);
    expect(question?.responses.find((item) => item.user.id === "u-maxim")?.answer).toBe("no");
    expect(question?.responses.find((item) => item.user.id === "u-maxim")?.completedAt).toBeTruthy();
  });

  it("getWeekStepAnswerTracking отдаёт комментарий студента", () => {
    const state = createInitialState(new Date("2024-01-08T00:00:00Z"));
    const withNote = completeWeekTask(state, "t-w1-7", "u-dmitry", "yes", "Где найти расписание?");
    const tracking = getWeekStepAnswerTracking(withNote, 1);
    const question = tracking.find((item) => item.task.id === "t-w1-7");

    expect(question?.responses.find((item) => item.user.id === "u-dmitry")?.note).toBe(
      "Где найти расписание?",
    );
  });

  it("getWeekRequiredStepTracking считает обязательные шаги недели", () => {
    const state = createInitialState(new Date("2024-01-08T00:00:00Z"));
    const required = getWeekRequiredStepTracking(state, 1);
    const curatorStep = required.find((item) => item.task.id === "t-w1-1");
    const accessStep = required.find((item) => item.task.id === "t-w1-6");

    expect(required.length).toBeGreaterThanOrEqual(5);
    expect(curatorStep?.doneCount).toBe(4);
    expect(accessStep?.pendingCount).toBe(3);
  });

  it("getWeekGoalProgress считает закрытые обязательные шаги по всей группе", () => {
    const state = createInitialState(new Date("2024-01-08T00:00:00Z"));
    const goal = getWeekGoalProgress(state, 1);
    const required = getWeekRequiredStepTracking(state, 1);
    const done = required.reduce((sum, item) => sum + item.doneCount, 0);
    const target = required.reduce((sum, item) => sum + item.doneCount + item.pendingCount, 0);

    expect(goal.week).toBe(1);
    expect(goal.done).toBe(done);
    expect(goal.target).toBe(target);
    expect(goal.done).toBeGreaterThan(0);
    expect(goal.done).toBeLessThan(goal.target);

    const closed = {
      ...state,
      taskCompletions: [
        ...state.taskCompletions,
        ...required.flatMap((item) =>
          item.responses
            .filter((response) => !response.completed)
            .map((response) => ({
              id: `tc-close-${item.task.id}-${response.user.id}`,
              taskId: item.task.id,
              userId: response.user.id,
              createdAt: new Date().toISOString(),
            })),
        ),
      ],
    };

    expect(getWeekGoalProgress(closed, 1).done).toBe(target);
  });

  it("summarizeWeekTracking считает уникальных участников", () => {
    const state = createInitialState(new Date("2024-01-08T00:00:00Z"));
    const tracking = getWeekStepAnswerTracking(state, 1);
    const required = getWeekRequiredStepTracking(state, 1);
    const summary = summarizeWeekTracking(tracking, required);

    expect(summary.unansweredCount).toBe(1);
    expect(summary.attentionCount).toBe(1);
    expect(summary.requiredOpenCount).toBeGreaterThan(0);
  });

  it("getSilentStepParticipants не отмечает молчание на одной неделе", () => {
    const state = createInitialState(new Date("2024-01-08T00:00:00Z"));
    expect(getSilentStepParticipants(state, 1)).toEqual([]);
  });
});
