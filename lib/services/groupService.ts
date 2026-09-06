import { getProgramTaskTemplates, DEFAULT_DURATION } from "../mockData";
import { createId } from "../storage";
import type { AppState, Group, User, UserRole } from "../types";
import { generateInviteCode, normalizeInviteCode } from "./inviteCode";

export type CreateGroupInput = {
  name: string;
  description: string;
  duration: number;
};

export type CreateRoomInput = CreateGroupInput & {
  inviteCode?: string;
  curatorName?: string;
};

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Обновляет текущую комнату. Код приглашения не меняется. */
export function createGroup(state: AppState, input: CreateGroupInput): AppState {
  const group: Group = {
    ...state.group,
    name: input.name.trim() || state.group.name,
    description: input.description.trim() || state.group.description,
    duration: Math.max(input.duration, state.group.currentDay),
  };

  return { ...state, group };
}

/** Новая комната с уникальным ключом. Старая группа в базе не удаляется. */
export function createRoom(state: AppState, input: CreateRoomInput): AppState {
  const groupId = createId("g");
  const curatorId = createId("u");
  const inviteCode = normalizeInviteCode(input.inviteCode || generateInviteCode());
  const current = getCurrentUser(state);
  const curatorName = (input.curatorName ?? current?.name ?? "Куратор").trim() || "Куратор";

  const group: Group = {
    id: groupId,
    name: input.name.trim() || defaultGroupDraft.name,
    description: input.description.trim() || defaultGroupDraft.description,
    inviteCode,
    duration: Math.max(input.duration || DEFAULT_DURATION, 7),
    currentDay: 1,
    programStartDate: todayIsoDate(),
    curatorId,
    weeklyGoal: {
      title: "Закрыть шаги первой недели: куратор, встреча, доступы.",
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
