import { createId } from "../storage";
import type { AppState, Task } from "../types";

export type CreateTaskInput = {
  day: number;
  title: string;
  description: string;
};

export function getTasks(state: AppState): Task[] {
  return [...state.tasks].sort((a, b) => a.day - b.day);
}

export function getTaskByDay(state: AppState, day: number): Task | undefined {
  return state.tasks.find((task) => task.day === day);
}

export function addTask(
  state: AppState,
  input: CreateTaskInput,
): { state: AppState; task: Task } | { error: string } {
  const day = Number(input.day);
  const title = input.title.trim();

  if (!Number.isInteger(day) || day < 1 || day > state.group.duration) {
    return { error: `День должен быть числом от 1 до ${state.group.duration}.` };
  }

  if (title.length < 3) {
    return { error: "Название задания слишком короткое." };
  }

  if (state.tasks.some((task) => task.day === day)) {
    return { error: `На день ${day} задание уже есть. Выберите другой день.` };
  }

  const task: Task = {
    id: createId("t"),
    groupId: state.group.id,
    day,
    title,
    description: input.description.trim(),
  };

  return { state: { ...state, tasks: [...state.tasks, task] }, task };
}

export function removeTask(state: AppState, taskId: string): AppState {
  return { ...state, tasks: state.tasks.filter((task) => task.id !== taskId) };
}

/** Первый свободный день — удобное значение по умолчанию в форме куратора. */
export function getNextFreeDay(state: AppState): number {
  for (let day = 1; day <= state.group.duration; day += 1) {
    if (!state.tasks.some((task) => task.day === day)) return day;
  }
  return state.group.duration;
}
