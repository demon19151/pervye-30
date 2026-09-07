import { createId } from "../storage";
import type { AppState, Task, TaskAnswer, TaskAnswerOption, TaskCompletion, TaskKind } from "../types";

export type CreateTaskInput = {
  week: number;
  title: string;
  description: string;
  kind?: TaskKind;
  answerOptions?: TaskAnswerOption[];
};

export const TASK_KINDS: TaskKind[] = ["required", "recommended", "question"];

export const TASK_KIND_LABELS: Record<TaskKind, string> = {
  required: "Обязательно",
  recommended: "Рекомендуем",
  question: "Вопрос",
};

const KIND_ORDER: Record<TaskKind, number> = {
  required: 0,
  question: 1,
  recommended: 2,
};

export function getTaskKind(task: Task): TaskKind {
  return task.kind ?? "required";
}

export function isRequiredTask(task: Task): boolean {
  return getTaskKind(task) === "required";
}

export const QUESTION_ANSWERS: TaskAnswerOption[] = [
  { id: "yes", label: "Да, понимаю" },
  { id: "no", label: "Пока нет", needsAttention: true },
];

export const STATUS_ANSWERS: TaskAnswerOption[] = [
  { id: "clear", label: "Всё понятно" },
  { id: "question", label: "Есть вопрос", needsAttention: true },
  { id: "help", label: "Нужна помощь", needsAttention: true },
];

export const MIN_ANSWER_OPTIONS = 2;
export const MAX_ANSWER_OPTIONS = 4;
export const MAX_ANSWER_NOTE = 400;

export function normalizeAnswerNote(note?: string): string | undefined {
  const text = note?.trim() ?? "";
  if (!text) return undefined;
  return text.slice(0, MAX_ANSWER_NOTE);
}

export function defaultAnswerOptions(kind: TaskKind): TaskAnswerOption[] {
  if (kind === "question") return QUESTION_ANSWERS.map((item) => ({ ...item }));
  return [];
}

export function getTaskAnswerOptions(task: Task): TaskAnswerOption[] {
  if (!isAnswerTask(task)) return [];
  if (task.answerOptions && task.answerOptions.length >= MIN_ANSWER_OPTIONS) {
    return task.answerOptions;
  }
  return defaultAnswerOptions(getTaskKind(task));
}

export function normalizeAnswerOptions(options: TaskAnswerOption[] | undefined): TaskAnswerOption[] {
  return (options ?? [])
    .map((item) => ({
      id: item.id.trim() || createId("ao"),
      label: item.label.trim(),
      needsAttention: Boolean(item.needsAttention),
    }))
    .filter((item) => item.label.length > 0);
}

export function getAnswerLabel(answer?: TaskAnswer, task?: Task): string | undefined {
  if (!answer) return undefined;
  if (task) {
    const fromTask = getTaskAnswerOptions(task).find((item) => item.id === answer);
    if (fromTask) return fromTask.label;
  }
  const fromDefaults = [...QUESTION_ANSWERS, ...STATUS_ANSWERS].find((item) => item.id === answer);
  return fromDefaults?.label ?? answer;
}

export function needsCuratorAttention(answer?: TaskAnswer, task?: Task): boolean {
  if (!answer) return false;
  if (task) {
    const option = getTaskAnswerOptions(task).find((item) => item.id === answer);
    if (option) return Boolean(option.needsAttention);
  }
  return answer === "no" || answer === "question" || answer === "help";
}

export function isAnswerTask(task: Task): boolean {
  return getTaskKind(task) === "question";
}

export function getWeekAnswerTasks(state: AppState, week: number): Task[] {
  return getTasksByWeek(state, week).filter(isAnswerTask);
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
  note?: string,
): AppState {
  if (!state.tasks.some((task) => task.id === taskId)) return state;

  const answerNote = normalizeAnswerNote(note);
  const existing = getTaskCompletion(state, taskId, userId);
  if (existing) {
    return {
      ...state,
      taskCompletions: (state.taskCompletions ?? []).map((item) =>
        item.id === existing.id
          ? { ...item, answer, answerNote, createdAt: new Date().toISOString() }
          : item,
      ),
    };
  }

  const completion: TaskCompletion = {
    id: createId("tc"),
    taskId,
    userId,
    createdAt: new Date().toISOString(),
    answer,
    ...(answerNote ? { answerNote } : {}),
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

  const isAnswer = kind === "question";
  const answerOptions = isAnswer
    ? normalizeAnswerOptions(input.answerOptions?.length ? input.answerOptions : defaultAnswerOptions(kind))
    : undefined;

  if (isAnswer && answerOptions && answerOptions.length < MIN_ANSWER_OPTIONS) {
    return { error: `Для ответа нужны минимум ${MIN_ANSWER_OPTIONS} кнопки.` };
  }

  if (isAnswer && answerOptions && answerOptions.length > MAX_ANSWER_OPTIONS) {
    return { error: `Можно не больше ${MAX_ANSWER_OPTIONS} кнопок ответа.` };
  }

  const task: Task = {
    id: createId("t"),
    groupId: state.group.id,
    week,
    kind,
    title,
    description: input.description.trim(),
    ...(answerOptions ? { answerOptions } : {}),
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
