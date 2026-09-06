import { describe, expect, it } from "vitest";
import { createInitialState } from "./mockData";

describe("mockData / createInitialState", () => {
  it("создаёт валидное начальное состояние", () => {
    const state = createInitialState();

    expect(state.group).toBeDefined();
    expect(state.users.length).toBeGreaterThan(0);
    expect(state.tasks.length).toBeGreaterThan(0);
    expect(state.session).toBeNull();
  });

  it("детерминировано относительно переданной даты", () => {
    const now = new Date("2024-05-01T00:00:00Z");
    const a = createInitialState(now);
    const b = createInitialState(now);

    expect(a.checkIns).toEqual(b.checkIns);
    expect(a.messages).toEqual(b.messages);
  });

  it("содержит ровно одного куратора", () => {
    const state = createInitialState();
    const curators = state.users.filter((u) => u.role === "curator");
    expect(curators).toHaveLength(1);
  });

  it("возвращает новые независимые объекты при повторном вызове", () => {
    const a = createInitialState();
    const b = createInitialState();

    expect(a).not.toBe(b);
    expect(a.group).not.toBe(b.group);
    a.users.push({ id: "extra", name: "X", role: "participant", groupId: a.group.id });
    expect(b.users.find((u) => u.id === "extra")).toBeUndefined();
  });
});
