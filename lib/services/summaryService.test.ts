import { describe, expect, it } from "vitest";
import { createInitialState, DEMO_PARTICIPANT_ID } from "../mockData";
import { buildSummary } from "./summaryService";

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

  it("buildSummary включает список достижений", () => {
    const state = createInitialState();
    const summary = buildSummary(state, DEMO_PARTICIPANT_ID);

    expect(summary?.achievements.length).toBeGreaterThan(0);
    expect(summary?.achievements[0]).toHaveProperty("unlocked");
  });
});
