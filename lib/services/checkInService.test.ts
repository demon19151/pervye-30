import { describe, expect, it, beforeEach } from "vitest";
import { createInitialState } from "../mockData";
import type { AppState } from "../types";
import {
  completeTask,
  getCheckIn,
  getCheckIns,
  getParticipantDay,
  saveDay,
  undoTask,
  upsertCheckIn,
} from "./checkInService";

describe("checkInService", () => {
  let state: AppState;
  const userId = "u-test";

  beforeEach(() => {
    state = createInitialState(new Date("2024-01-08T00:00:00Z"));
    state = { ...state, checkIns: [] };
  });

  it("getCheckIns возвращает пустой массив, если нет записей", () => {
    expect(getCheckIns(state, userId)).toEqual([]);
  });

  it("upsertCheckIn создаёт новую запись", () => {
    const next = upsertCheckIn(state, userId, 1, { completed: true, mood: 4, energy: 3 });
    const checkIn = getCheckIn(next, userId, 1);

    expect(checkIn).toBeDefined();
    expect(checkIn?.completed).toBe(true);
    expect(checkIn?.mood).toBe(4);
  });

  it("upsertCheckIn обновляет существующую запись, а не создаёт новую", () => {
    let next = upsertCheckIn(state, userId, 1, { completed: false, mood: 2, energy: 2 });
    next = upsertCheckIn(next, userId, 1, { completed: true });

    expect(getCheckIns(next, userId)).toHaveLength(1);
    expect(getCheckIn(next, userId, 1)?.completed).toBe(true);
    expect(getCheckIn(next, userId, 1)?.mood).toBe(2);
  });

  it("completeTask отмечает день выполненным", () => {
    const next = completeTask(state, userId, 1);
    expect(getCheckIn(next, userId, 1)?.completed).toBe(true);
  });

  it("undoTask снимает отметку о выполнении", () => {
    let next = completeTask(state, userId, 1);
    next = undoTask(next, userId, 1);
    expect(getCheckIn(next, userId, 1)?.completed).toBe(false);
  });

  it("getParticipantDay возвращает 1 для участника без записей", () => {
    expect(getParticipantDay(state, userId)).toBe(1);
  });

  it("getParticipantDay возвращает следующий день после последнего чек-ина", () => {
    let next = upsertCheckIn(state, userId, 1, { completed: true });
    next = upsertCheckIn(next, userId, 2, { completed: true });

    expect(getParticipantDay(next, userId)).toBe(Math.min(3, state.group.currentDay));
  });

  it("getParticipantDay не превышает текущий день группы", () => {
    let next = state;
    for (let day = 1; day <= state.group.duration; day += 1) {
      next = upsertCheckIn(next, userId, day, { completed: true });
    }

    expect(getParticipantDay(next, userId)).toBe(state.group.currentDay);
  });

  describe("saveDay", () => {
    it("возвращает ошибку, если настроение не указано", () => {
      const result = saveDay(state, userId, 1, { mood: 0, energy: 3, note: "" });
      expect("error" in result).toBe(true);
    });

    it("возвращает ошибку, если энергия не указана", () => {
      const result = saveDay(state, userId, 1, { mood: 3, energy: 0, note: "" });
      expect("error" in result).toBe(true);
    });

    it("сохраняет день при валидных данных", () => {
      const result = saveDay(state, userId, 1, { mood: 4, energy: 3, note: "Всё хорошо" });
      expect("state" in result).toBe(true);

      if ("state" in result) {
        const checkIn = getCheckIn(result.state, userId, 1);
        expect(checkIn?.mood).toBe(4);
        expect(checkIn?.energy).toBe(3);
        expect(checkIn?.note).toBe("Всё хорошо");
      }
    });

    it("обрезает пробелы и убирает пустую заметку", () => {
      const result = saveDay(state, userId, 1, { mood: 4, energy: 3, note: "   " });
      if ("state" in result) {
        expect(getCheckIn(result.state, userId, 1)?.note).toBeUndefined();
      } else {
        throw new Error("expected success result");
      }
    });
  });
});
