import { describe, expect, it } from "vitest";
import { createInitialState, DEMO_PARTICIPANT_ID } from "../mockData";
import { getAllParticipantStats, getGroupStats, getParticipantStats } from "./statsService";

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
});
