import { describe, expect, it } from "vitest";
import { createInitialState } from "../mockData";
import { addTask, getNextFreeDay, getTaskByDay, getTasks, removeTask } from "./taskService";

describe("taskService", () => {
  it("getTasks возвращает задания, отсортированные по дню", () => {
    const state = createInitialState();
    const tasks = getTasks(state);
    const days = tasks.map((t) => t.day);
    expect(days).toEqual([...days].sort((a, b) => a - b));
  });

  it("getTaskByDay находит задание по дню", () => {
    const state = createInitialState();
    expect(getTaskByDay(state, 1)?.day).toBe(1);
    expect(getTaskByDay(state, 999)).toBeUndefined();
  });

  describe("addTask", () => {
    it("возвращает ошибку для дня вне диапазона", () => {
      const state = createInitialState();
      const result = addTask(state, { day: 0, title: "Тест задание", description: "" });
      expect("error" in result).toBe(true);
    });

    it("возвращает ошибку для дня больше продолжительности программы", () => {
      const state = createInitialState();
      const result = addTask(state, { day: state.group.duration + 1, title: "Тест задание", description: "" });
      expect("error" in result).toBe(true);
    });

    it("возвращает ошибку для слишком короткого названия", () => {
      const state = createInitialState();
      const day = getNextFreeDay(state);
      const result = addTask(state, { day, title: "ab", description: "" });
      expect("error" in result).toBe(true);
    });

    it("возвращает ошибку, если на день уже есть задание", () => {
      const state = createInitialState();
      const result = addTask(state, { day: 1, title: "Другое задание", description: "" });
      expect("error" in result).toBe(true);
    });

    it("создаёт задание при валидных данных", () => {
      const state = createInitialState();
      const day = getNextFreeDay(state);
      const result = addTask(state, { day, title: "Новое задание", description: "Описание" });

      expect("task" in result).toBe(true);
      if ("task" in result) {
        expect(result.task.day).toBe(day);
        expect(getTaskByDay(result.state, day)?.title).toBe("Новое задание");
      }
    });
  });

  it("removeTask удаляет задание по id", () => {
    const state = createInitialState();
    const task = getTaskByDay(state, 1);
    if (!task) throw new Error("expected task");

    const next = removeTask(state, task.id);
    expect(getTaskByDay(next, 1)).toBeUndefined();
  });

  it("getNextFreeDay возвращает первый день без задания", () => {
    const state = createInitialState();
    const freeDay = getNextFreeDay(state);
    expect(getTaskByDay(state, freeDay)).toBeUndefined();
  });

  it("getNextFreeDay возвращает последний день, если все дни заняты", () => {
    let state = createInitialState();
    for (let day = 1; day <= state.group.duration; day += 1) {
      if (!getTaskByDay(state, day)) {
        const result = addTask(state, { day, title: `Задание дня ${day}`, description: "" });
        if ("state" in result) state = result.state;
      }
    }

    expect(getNextFreeDay(state)).toBe(state.group.duration);
  });
});
