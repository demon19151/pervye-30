import { createId } from "../storage";
import type { AppState, Group, User, UserRole } from "../types";
import { DEFAULT_DURATION, DEMO_INVITE_CODE } from "../mockData";

export type CreateGroupInput = {
  name: string;
  description: string;
  duration: number;
};

/** Обновляет параметры демо-группы. Код приглашения в MVP остаётся постоянным. */
export function createGroup(state: AppState, input: CreateGroupInput): AppState {
  const group: Group = {
    ...state.group,
    name: input.name.trim() || state.group.name,
    description: input.description.trim() || state.group.description,
    duration: Math.max(input.duration, state.group.currentDay),
    inviteCode: DEMO_INVITE_CODE,
  };

  return { ...state, group };
}

export function isValidInviteCode(state: AppState, code: string): boolean {
  return code.trim().toUpperCase() === state.group.inviteCode.toUpperCase();
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
    return { error: `Код группы не найден. Для демонстрации используйте ${state.group.inviteCode}.` };
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
