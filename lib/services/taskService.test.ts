import { describe, expect, it } from "@jest/globals";
import { createInitialState } from "../mockData";
import {
  addTask,
  completeWeekTask,
  getProgramWeek,
  getTasks,
  getTasksByWeek,
  getWeekBounds,
  getWeekCount,
  hasCompletedTask,
  isAnswerTask,
  needsCuratorAttention,
  removeTask,
  undoWeekTask,
} from "./taskService";

describe("taskService", () => {
  it("getTasks сортирует задания по неделе", () => {
    const state = createInitialState();
    const weeks = getTasks(state).map((task) => task.week);
    expect(weeks).toEqual([...weeks].sort((a, b) => a - b));
  });

  it("первая неделя содержит шесть шагов", () => {
    const state = createInitialState();
    expect(getTasksByWeek(state, 1).length).toBeGreaterThanOrEqual(6);
    expect(getProgramWeek(7, state.group.duration)).toBe(1);
    expect(getWeekBounds(1, 30)).toEqual({ start: 1, end: 7 });
    expect(getWeekCount(30)).toBe(4);
  });

  describe("addTask", () => {
    it("возвращает ошибку для недели вне диапазона", () => {
      const state = createInitialState();
      const result = addTask(state, { week: 0, title: "Тест задание", description: "" });
      expect("error" in result).toBe(true);
    });

    it("возвращает ошибку для слишком короткого названия", () => {
      const state = createInitialState();
      const result = addTask(state, { week: 1, title: "ab", description: "" });
      expect("error" in result).toBe(true);
    });

    it("создаёт ещё одно задание на ту же неделю", () => {
      const state = createInitialState();
      const result = addTask(state, { week: 1, title: "Новое задание", description: "Описание" });

      expect("task" in result).toBe(true);
      if ("task" in result) {
        expect(result.task.week).toBe(1);
        expect(result.task.kind).toBe("required");
        expect(getTasksByWeek(result.state, 1).some((task) => task.title === "Новое задание")).toBe(
          true,
        );
      }
    });

    it("создаёт вопрос с кнопками ответа куратора", () => {
      const state = createInitialState();
      const result = addTask(state, {
        week: 1,
        title: "Понятно ли расписание?",
        description: "",
        kind: "question",
        answerOptions: [
          { id: "ok", label: "Да, всё ясно" },
          { id: "stuck", label: "Нужна подсказка", needsAttention: true },
        ],
      });

      expect("task" in result).toBe(true);
      if ("task" in result) {
        expect(result.task.answerOptions).toEqual([
          { id: "ok", label: "Да, всё ясно", needsAttention: false },
          { id: "stuck", label: "Нужна подсказка", needsAttention: true },
        ]);
      }
    });

    it("не сохраняет вопрос без двух кнопок", () => {
      const state = createInitialState();
      const result = addTask(state, {
        week: 1,
        title: "Понятно ли расписание?",
        description: "",
        kind: "question",
        answerOptions: [{ id: "only", label: "Одна кнопка" }],
      });
      expect("error" in result).toBe(true);
    });
  });

  it("completeWeekTask и undoWeekTask отмечают шаг независимо от дня", () => {
    const state = createInitialState();
    const task = getTasksByWeek(state, 2)[0];
    if (!task) throw new Error("expected week 2 task");

    const done = completeWeekTask(state, task.id, "u-anna");
    expect(hasCompletedTask(done, task.id, "u-anna")).toBe(true);

    const undone = undoWeekTask(done, task.id, "u-anna");
    expect(hasCompletedTask(undone, task.id, "u-anna")).toBe(false);
  });

  it("completeWeekTask сохраняет комментарий к вопросу", () => {
    const state = createInitialState();
    const question = state.tasks.find((task) => task.kind === "question");
    if (!question) throw new Error("expected question task");

    const done = completeWeekTask(state, question.id, "u-anna", "ok", "  Не нашла аудиторию  ");
    const completion = done.taskCompletions.find(
      (item) => item.taskId === question.id && item.userId === "u-anna",
    );

    expect(completion?.answer).toBe("ok");
    expect(completion?.answerNote).toBe("Не нашла аудиторию");
  });

  it("completeWeekTask обрезает слишком длинный комментарий", () => {
    const state = createInitialState();
    const question = state.tasks.find((task) => task.kind === "question");
    if (!question) throw new Error("expected question task");

    const done = completeWeekTask(state, question.id, "u-anna", "ok", "ж".repeat(500));
    const completion = done.taskCompletions.find(
      (item) => item.taskId === question.id && item.userId === "u-anna",
    );

    expect(completion?.answerNote?.length).toBe(400);
  });

  it("isAnswerTask отмечает вопросы недели", () => {
    const state = createInitialState();
    const question = state.tasks.find((task) => task.id === "t-w1-7");
    const checkIn = state.tasks.find((task) => task.id === "t-w2-4");
    const required = state.tasks.find((task) => task.id === "t-w1-1");

    expect(question && isAnswerTask(question)).toBe(true);
    expect(checkIn && isAnswerTask(checkIn)).toBe(true);
    expect(required && isAnswerTask(required)).toBe(false);
  });

  it("needsCuratorAttention смотрит на кнопки задания", () => {
    const task = {
      id: "t-custom",
      groupId: "g-work",
      week: 1,
      kind: "question" as const,
      title: "Вопрос",
      description: "",
      answerOptions: [
        { id: "ok", label: "Ок" },
        { id: "stuck", label: "Застрял", needsAttention: true },
      ],
    };

    expect(needsCuratorAttention("stuck", task)).toBe(true);
    expect(needsCuratorAttention("ok", task)).toBe(false);
  });

  it("removeTask удаляет задание и его отметки", () => {
    const state = createInitialState();
    const task = getTasksByWeek(state, 1)[0];
    if (!task) throw new Error("expected task");

    const next = removeTask(state, task.id);
    expect(getTasks(next).some((item) => item.id === task.id)).toBe(false);
    expect(next.taskCompletions.some((item) => item.taskId === task.id)).toBe(false);
  });
});
