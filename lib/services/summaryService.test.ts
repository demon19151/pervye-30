import { describe, expect, it } from "@jest/globals";
import { createInitialState, DEMO_PARTICIPANT_ID } from "../mockData";
import { getParticipantStats } from "./statsService";
import {
  buildSummary,
  getSummaryReflection,
  hasReflectionText,
  MAX_REFLECTION,
  saveSummaryReflection,
} from "./summaryService";

describe("summaryService", () => {
  it("buildSummary возвращает null для несуществующего пользователя", () => {
    const state = createInitialState();
    expect(buildSummary(state, "nope")).toBeNull();
  });

  it("buildSummary отмечает preview=true, если программа не завершена", () => {
    const state = createInitialState();
    const summary = buildSummary(state, DEMO_PARTICIPANT_ID);

    expect(summary?.preview).toBe(true);
  });

  it("buildSummary отмечает preview=false, если программа завершена", () => {
    const state = createInitialState();
    const finished = { ...state, group: { ...state.group, currentDay: state.group.duration } };
    const summary = buildSummary(finished, DEMO_PARTICIPANT_ID);

    expect(summary?.preview).toBe(false);
  });

  it("buildSummary берёт живые цифры даже в предпросмотре", () => {
    const state = createInitialState();
    const stats = getParticipantStats(state, DEMO_PARTICIPANT_ID);
    const summary = buildSummary(state, DEMO_PARTICIPANT_ID);

    expect(summary?.preview).toBe(true);
    expect(summary?.completedTasks).toBe(stats?.completedTasks);
    expect(summary?.closedWeeks).toBe(stats?.closedWeeks);
    expect(summary?.completedTasks).not.toBe(23);
    expect(summary?.closedWeeks).not.toBe(4);
  });

  it("buildSummary включает обновлённый список достижений", () => {
    const state = createInitialState();
    const summary = buildSummary(state, DEMO_PARTICIPANT_ID);
    const ids = summary?.achievements.map((item) => item.id);

    expect(ids).toEqual(["first-week", "week-closed", "question", "step-answer", "event"]);
    expect(summary?.achievements.find((item) => item.id === "question")?.unlocked).toBe(true);
    expect(summary?.achievements.find((item) => item.id === "step-answer")?.unlocked).toBe(true);
    expect(summary?.achievements.find((item) => item.id === "event")?.unlocked).toBe(false);
  });

  it("saveSummaryReflection сохраняет отзыв и обрезает длинный текст", () => {
    const state = createInitialState();
    const next = saveSummaryReflection(state, DEMO_PARTICIPANT_ID, {
      mentorNote: "a".repeat(MAX_REFLECTION + 20),
      useful: "  встречи  ",
      unclear: "",
    });
    const saved = getSummaryReflection(next, DEMO_PARTICIPANT_ID);

    expect(saved?.mentorNote).toHaveLength(MAX_REFLECTION);
    expect(saved?.useful).toBe("встречи");
    expect(saved?.unclear).toBe("");
    expect(hasReflectionText(saved)).toBe(true);
  });
});
