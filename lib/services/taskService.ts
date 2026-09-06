import { createId } from "../storage";
import type { AppState, Task, TaskAnswer, TaskCompletion, TaskKind } from "../types";

export type CreateTaskInput = {
  week: number;
  title: string;
  description: string;
  kind?: TaskKind;
};

export const TASK_KINDS: TaskKind[] = ["required", "recommended", "question", "status"];

export const TASK_KIND_LABELS: Record<TaskKind, string> = {
  required: "Обязательно",
  recommended: "Рекомендуем",
  question: "Вопрос",
  status: "Статус",
};

const KIND_ORDER: Record<TaskKind, number> = {
  required: 0,
  question: 1,
  status: 2,
  recommended: 3,
};

export const QUESTION_ANSWERS: Array<{ value: Extract<TaskAnswer, "yes" | "no">; label: string }> = [
  { value: "yes", label: "Да, понимаю" },
  { value: "no", label: "Пока нет" },
];

export const STATUS_ANSWERS: Array<{
  value: Extract<TaskAnswer, "clear" | "question" | "help">;
  label: string;
}> = [
  { value: "clear", label: "Всё понятно" },
  { value: "question", label: "Есть вопрос" },
  { value: "help", label: "Нужна помощь" },
];

export function getTaskKind(task: Task): TaskKind {
  return task.kind ?? "required";
}

export function isRequiredTask(task: Task): boolean {
  return getTaskKind(task) === "required";
}

export function getAnswerLabel(answer?: TaskAnswer): string | undefined {
  if (!answer) return undefined;
  const fromQuestion = QUESTION_ANSWERS.find((item) => item.value === answer);
  if (fromQuestion) return fromQuestion.label;
  return STATUS_ANSWERS.find((item) => item.value === answer)?.label;
}

export function needsCuratorAttention(answer?: TaskAnswer): boolean {
  return answer === "no" || answer === "question" || answer === "help";
}

export function getWeekCount(duration: number): number {
  if (duration <= 7) return 1;
  if (duration <= 14) return 2;
  if (duration <= 21) return 3;
  return 4;
}

export function getProgramWeek(day: number, duration: number): number {
  const weeks = getWeekCount(duration);
  if (day <= 7) return 1;
  if (day <= 14) return Math.min(2, weeks);
  if (day <= 21) return Math.min(3, weeks);
  return weeks;
}

export function getWeekBounds(week: number, duration: number): { start: number; end: number } {
  const weeks = getWeekCount(duration);
  if (week >= weeks) {
    const start = weeks === 1 ? 1 : (weeks - 1) * 7 + 1;
    return { start, end: duration };
  }

  return { start: (week - 1) * 7 + 1, end: week * 7 };
}

export function getTasks(state: AppState): Task[] {
  return [...state.tasks].sort((a, b) => {
    if (a.week !== b.week) return a.week - b.week;
    return KIND_ORDER[getTaskKind(a)] - KIND_ORDER[getTaskKind(b)];
  });
}

export function getTasksByWeek(state: AppState, week: number): Task[] {
  return getTasks(state).filter((task) => task.week === week);
}

export function getTaskCompletion(
  state: AppState,
  taskId: string,
  userId: string,
): TaskCompletion | undefined {
  return (state.taskCompletions ?? []).find(
    (item) => item.taskId === taskId && item.userId === userId,
  );
}

export function hasCompletedTask(state: AppState, taskId: string, userId: string): boolean {
  return Boolean(getTaskCompletion(state, taskId, userId));
}

export function getCompletedTaskCount(state: AppState, userId: string, week?: number): number {
  const tasks = week == null ? state.tasks : state.tasks.filter((task) => task.week === week);
  return tasks.filter((task) => hasCompletedTask(state, task.id, userId)).length;
}

export function completeWeekTask(
  state: AppState,
  taskId: string,
  userId: string,
  answer?: TaskAnswer,
): AppState {
  if (!state.tasks.some((task) => task.id === taskId)) return state;

  const existing = getTaskCompletion(state, taskId, userId);
  if (existing) {
    return {
      ...state,
      taskCompletions: (state.taskCompletions ?? []).map((item) =>
        item.id === existing.id ? { ...item, answer, createdAt: new Date().toISOString() } : item,
      ),
    };
  }

  const completion: TaskCompletion = {
    id: createId("tc"),
    taskId,
    userId,
    createdAt: new Date().toISOString(),
    answer,
  };

  return {
    ...state,
    taskCompletions: [...(state.taskCompletions ?? []), completion],
  };
}

export function undoWeekTask(state: AppState, taskId: string, userId: string): AppState {
  return {
    ...state,
    taskCompletions: (state.taskCompletions ?? []).filter(
      (item) => !(item.taskId === taskId && item.userId === userId),
    ),
  };
}

export function addTask(
  state: AppState,
  input: CreateTaskInput,
): { state: AppState; task: Task } | { error: string } {
  const week = Number(input.week);
  const title = input.title.trim();
  const weeks = getWeekCount(state.group.duration);
  const kind = input.kind ?? "required";

  if (!Number.isInteger(week) || week < 1 || week > weeks) {
    return { error: `Неделя должна быть числом от 1 до ${weeks}.` };
  }

  if (title.length < 3) {
    return { error: "Название задания слишком короткое." };
  }

  if (!TASK_KINDS.includes(kind)) {
    return { error: "Выберите тип задания." };
  }

  const task: Task = {
    id: createId("t"),
    groupId: state.group.id,
    week,
    kind,
    title,
    description: input.description.trim(),
  };

  return { state: { ...state, tasks: [...state.tasks, task] }, task };
}

export function removeTask(state: AppState, taskId: string): AppState {
  return {
    ...state,
    tasks: state.tasks.filter((task) => task.id !== taskId),
    taskCompletions: (state.taskCompletions ?? []).filter((item) => item.taskId !== taskId),
  };
}

export function getCurrentWeek(state: AppState): number {
  return getProgramWeek(state.group.currentDay, state.group.duration);
}
