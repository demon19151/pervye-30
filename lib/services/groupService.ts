import { getProgramTaskTemplates, DEFAULT_DURATION, GROUP_ID } from "../mockData";
import { createId } from "../storage";
import type { AppState, Group, User, UserRole } from "../types";
import { generateInviteCode, normalizeInviteCode } from "./inviteCode";
import { getProgramWeek, getWeekBounds, getWeekCount } from "./taskService";
import { isIsoDate, programDayFromStartDate, todayIsoDate } from "../utils";

export type CreateGroupInput = {
  name: string;
  description: string;
  duration: number;
  programStartDate?: string;
};

export type CreateRoomInput = CreateGroupInput & {
  inviteCode?: string;
  curatorName?: string;
};

export function isDemoGroup(group: { id: string }): boolean {
  return group.id === GROUP_ID;
}

export function isGroupArchived(group: Group): boolean {
  return Boolean(group.archivedAt);
}

export function isEnrollmentOpen(group: Group): boolean {
  return group.enrollmentOpen !== false && !isGroupArchived(group);
}

/** Обновляет текущую комнату. Код приглашения не меняется. */
export function createGroup(state: AppState, input: CreateGroupInput): AppState {
  const requested = Math.max(input.duration || DEFAULT_DURATION, 7);
  const nextStart =
    input.programStartDate && isIsoDate(input.programStartDate)
      ? input.programStartDate
      : state.group.programStartDate;
  // currentDay — это управляемый кураторами "положение" программы (через выбор недели),
  // а не автоматический счётчик по календарной разнице между startDate и "сегодня".
  const startChanged = nextStart !== state.group.programStartDate;
  const currentDay =
    startChanged && nextStart
      ? programDayFromStartDate(nextStart, requested)
      : state.group.currentDay;

  const group: Group = {
    ...state.group,
    name: input.name.trim() || state.group.name,
    description: input.description.trim() || state.group.description,
    duration: Math.max(requested, currentDay),
    programStartDate: nextStart,
    currentDay,
  };

  return { ...state, group };
}

/** Новая комната с уникальным ключом. Старая группа в базе не удаляется. */
export function createRoom(state: AppState, input: CreateRoomInput): AppState {
  const groupId = createId("g");
  const curatorId = createId("u");
  const inviteCode = normalizeInviteCode(input.inviteCode || generateInviteCode());
  const current = getCurrentUser(state);
  const curatorName = (input.curatorName ?? current?.name ?? "Наставник").trim() || "Наставник";
  const duration = Math.max(input.duration || DEFAULT_DURATION, 7);
  const programStartDate =
    input.programStartDate && isIsoDate(input.programStartDate)
      ? input.programStartDate
      : todayIsoDate();

  const group: Group = {
    id: groupId,
    name: input.name.trim() || defaultGroupDraft.name,
    description: input.description.trim() || defaultGroupDraft.description,
    inviteCode,
    duration,
    currentDay: programDayFromStartDate(programStartDate, duration),
    programStartDate,
    enrollmentOpen: true,
    curatorId,
    weeklyGoal: {
      title: "Закрыть шаги первой недели: наставник, встреча, доступы.",
      target: 6,
      done: 0,
    },
  };

  const curator: User = {
    id: curatorId,
    name: curatorName,
    role: "curator",
    avatar: current?.role === "curator" ? current.avatar ?? "🧑‍🏫" : "🧑‍🏫",
    groupId,
  };

  const tasks = getProgramTaskTemplates().map((task) => ({
    ...task,
    id: createId("t"),
    groupId,
  }));

  return {
    ...state,
    group,
    users: [curator],
    tasks,
    taskCompletions: [],
    messages: [],
    directMessages: [],
    signals: [],
    announcements: [],
    calendarEvents: [],
    calendarEventResponses: [],
    calendarEventViews: [],
    summaryReflections: [],
    session: { userId: curatorId, role: "curator" },
  };
}

/** Новый ключ для текущей комнаты. Старый перестаёт пускать. */
export function rotateInviteCode(state: AppState, nextCode = generateInviteCode()): AppState {
  return {
    ...state,
    group: { ...state.group, inviteCode: normalizeInviteCode(nextCode) },
  };
}

export function isValidInviteCode(state: AppState, code: string): boolean {
  return normalizeInviteCode(code) === normalizeInviteCode(state.group.inviteCode);
}

/**
 * Вход по коду. Если участника с таким именем ещё нет, он добавляется в группу,
 * иначе переиспользуется существующий профиль — так демо-данные не дублируются.
 */
export function joinGroup(
  state: AppState,
  input: { name: string; code: string; role: UserRole },
): { state: AppState; user: User } | { error: string } {
  const name = input.name.trim();

  if (name.length < 2) {
    return { error: "Введите имя — минимум 2 символа." };
  }

  if (!/^[A-Za-zА-Яа-яЁё]+$/.test(name)) {
    return { error: "Имя может содержать только буквы." };
  }

  if (!isValidInviteCode(state, input.code)) {
    return { error: "Код группы не найден." };
  }

  if (!isEnrollmentOpen(state.group)) {
    return { error: "Набор в эту группу закрыт." };
  }

  const existing = state.users.find(
    (user) => user.name.toLowerCase() === name.toLowerCase() && user.role === input.role,
  );

  if (existing) {
    return {
      state: { ...state, session: { userId: existing.id, role: existing.role } },
      user: existing,
    };
  }

  const user: User = {
    id: createId("u"),
    name,
    role: input.role,
    avatar: input.role === "curator" ? "🧑‍🏫" : "🙂",
    groupId: state.group.id,
  };

  return {
    state: {
      ...state,
      users: [...state.users, user],
      session: { userId: user.id, role: user.role },
    },
    user,
  };
}

export function signOut(state: AppState): AppState {
  return { ...state, session: null };
}

/** Переключение роли для демонстрации: находит первого пользователя нужной роли. */
export function switchRole(state: AppState, role: UserRole): AppState {
  const target = state.users.find((user) => user.role === role);
  if (!target) return state;

  return { ...state, session: { userId: target.id, role: target.role } };
}

export function setCurrentUser(state: AppState, userId: string): AppState {
  const target = state.users.find((user) => user.id === userId);
  if (!target) return state;

  return { ...state, session: { userId: target.id, role: target.role } };
}

export function updateWeeklyGoal(state: AppState, done: number): AppState {
  if (!state.group.weeklyGoal) return state;

  return {
    ...state,
    group: {
      ...state.group,
      weeklyGoal: { ...state.group.weeklyGoal, done },
    },
  };
}

/** Ставит программу на выбранную неделю: текущий день = первый день этой недели. */
export function setProgramWeek(state: AppState, week: number): AppState {
  const weeks = getWeekCount(state.group.duration);
  const nextWeek = Math.min(Math.max(Math.trunc(week), 1), weeks);
  const currentWeek = getProgramWeek(state.group.currentDay, state.group.duration);
  if (nextWeek === currentWeek) return state;

  const { start } = getWeekBounds(nextWeek, state.group.duration);
  const currentDay = Math.min(Math.max(start, 1), state.group.duration);

  return {
    ...state,
    group: { ...state.group, currentDay },
  };
}

export function setEnrollmentOpen(state: AppState, open: boolean): AppState {
  if (isGroupArchived(state.group) && open) return state;
  return {
    ...state,
    group: { ...state.group, enrollmentOpen: open },
  };
}

export function archiveGroup(state: AppState): AppState {
  if (state.group.archivedAt) return state;
  return {
    ...state,
    group: {
      ...state.group,
      archivedAt: new Date().toISOString(),
      enrollmentOpen: false,
    },
  };
}

export function unarchiveGroup(state: AppState): AppState {
  if (!state.group.archivedAt) return state;
  return {
    ...state,
    group: {
      ...state.group,
      archivedAt: undefined,
      enrollmentOpen: true,
    },
  };
}

export function updateCurrentUserProfile(
  state: AppState,
  input: { name?: string; avatar?: string },
): AppState {
  const userId = state.session?.userId;
  if (!userId) return state;

  const name = input.name?.trim();
  const avatar = input.avatar?.trim();

  return {
    ...state,
    users: state.users.map((user) =>
      user.id === userId
        ? {
            ...user,
            ...(name && name.length >= 2 ? { name } : {}),
            ...(avatar ? { avatar } : {}),
          }
        : user,
    ),
  };
}

/** Убирает участника и его следы. Наставника так удалить нельзя. */
export function removeParticipant(state: AppState, userId: string): AppState {
  const user = state.users.find((item) => item.id === userId);
  if (!user || user.role !== "participant") return state;

  return {
    ...state,
    users: state.users.filter((item) => item.id !== userId),
    taskCompletions: (state.taskCompletions ?? []).filter((item) => item.userId !== userId),
    messages: (state.messages ?? []).filter((item) => item.userId !== userId),
    directMessages: (state.directMessages ?? []).filter(
      (item) => item.fromUserId !== userId && item.toUserId !== userId,
    ),
    signals: (state.signals ?? []).filter((item) => item.userId !== userId),
    calendarEventResponses: (state.calendarEventResponses ?? []).filter(
      (item) => item.userId !== userId,
    ),
    calendarEventViews: (state.calendarEventViews ?? []).filter((item) => item.userId !== userId),
    summaryReflections: (state.summaryReflections ?? []).filter((item) => item.userId !== userId),
    session: state.session?.userId === userId ? null : state.session,
  };
}

export const defaultGroupDraft: CreateGroupInput = {
  name: "Первые 30 дней в университете",
  description: "Небольшая группа для комфортной адаптации в первые недели.",
  duration: DEFAULT_DURATION,
};

// --- Селекторы -------------------------------------------------------------

export function getCurrentUser(state: AppState): User | null {
  if (!state.session) return null;
  return state.users.find((user) => user.id === state.session!.userId) ?? null;
}

export function getUserById(state: AppState, userId: string): User | undefined {
  return state.users.find((user) => user.id === userId);
}

export function getParticipants(state: AppState): User[] {
  return state.users.filter((user) => user.role === "participant");
}

export function getCurator(state: AppState): User | undefined {
  return state.users.find((user) => user.id === state.group.curatorId);
}

/** Текущий день программы для участника — общий календарь группы. */
export function getParticipantDay(state: AppState, _userId?: string): number {
  return Math.min(Math.max(state.group.currentDay, 1), state.group.duration);
}
