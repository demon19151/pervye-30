import { describe, expect, it } from "vitest";
import { createInitialState } from "../mockData";
import {
  getActiveSignals,
  getSignalsForUser,
  resolveAttentionForUser,
  resolveSignalsForUser,
  sendSupportSignal,
} from "./supportService";

describe("supportService", () => {
  it("getActiveSignals возвращает только нерешённые сигналы", () => {
    const state = createInitialState();
    const active = getActiveSignals(state);
    expect(active.every((s) => !s.resolved)).toBe(true);
  });

  it("sendSupportSignal добавляет новый нерешённый сигнал", () => {
    const state = createInitialState();
    const next = sendSupportSignal(state, "u-maxim", "Помогите", "manual");
    const signals = getSignalsForUser(next, "u-maxim");

    expect(signals).toHaveLength(1);
    expect(signals[0].resolved).toBe(false);
    expect(signals[0].message).toBe("Помогите");
  });

  it("resolveSignalsForUser помечает все сигналы пользователя как решённые", () => {
    let state = createInitialState();
    state = sendSupportSignal(state, "u-maxim", "Помогите", "manual");
    const next = resolveSignalsForUser(state, "u-maxim");

    expect(getSignalsForUser(next, "u-maxim").every((s) => s.resolved)).toBe(true);
  });

  it("resolveAttentionForUser создаёт недостающие resolved-сигналы всех типов", () => {
    const state = createInitialState();
    const next = resolveAttentionForUser(state, "u-irina");
    const signals = getSignalsForUser(next, "u-irina");

    const types = signals.map((s) => s.type);
    expect(types).toContain("manual");
    expect(types).toContain("missed_tasks");
    expect(signals.every((s) => s.resolved)).toBe(true);
  });

  it("resolveAttentionForUser не дублирует уже существующие сигналы", () => {
    let state = createInitialState();
    state = sendSupportSignal(state, "u-maxim", "тест", "manual");
    const next = resolveAttentionForUser(state, "u-maxim");

    const manualSignals = getSignalsForUser(next, "u-maxim").filter((s) => s.type === "manual");
    expect(manualSignals).toHaveLength(1);
    expect(manualSignals[0].resolved).toBe(true);
  });
});
