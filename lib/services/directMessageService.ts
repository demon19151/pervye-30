import { createId } from "../storage";
import type { AppState, DirectMessage, User } from "../types";
import { getCurator, getParticipants } from "./groupService";

export function getThread(state: AppState, userA: string, userB: string): DirectMessage[] {
  return (state.directMessages ?? [])
    .filter(
      (item) =>
        (item.fromUserId === userA && item.toUserId === userB) ||
        (item.fromUserId === userB && item.toUserId === userA),
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function addDirectMessage(
  state: AppState,
  fromUserId: string,
  toUserId: string,
  text: string,
): { state: AppState; message: DirectMessage } | { error: string } {
  const value = text.trim();

  if (value.length < 2) {
    return { error: "Напишите сообщение — хотя бы пару слов." };
  }

  if (value.length > 400) {
    return { error: "Сообщение слишком длинное." };
  }

  const message: DirectMessage = {
    id: createId("dm"),
    groupId: state.group.id,
    fromUserId,
    toUserId,
    text: value,
    createdAt: new Date().toISOString(),
  };

  return {
    state: { ...state, directMessages: [...(state.directMessages ?? []), message] },
    message,
  };
}

export function lastThreadMessage(
  state: AppState,
  userA: string,
  userB: string,
): DirectMessage | undefined {
  const thread = getThread(state, userA, userB);
  return thread[thread.length - 1];
}

/** Есть непрочитанный ответ куратора: последнее сообщение в треде не от студента. */
export function getUnreadCuratorReplies(state: AppState, participantId: string): number {
  const curator = getCurator(state);
  if (!curator) return 0;

  const last = lastThreadMessage(state, participantId, curator.id);
  return last && last.fromUserId === curator.id ? 1 : 0;
}

/** Сколько студентов ждут ответа: последнее сообщение от них. */
export function getWaitingStudentCount(state: AppState): number {
  const curator = getCurator(state);
  if (!curator) return 0;

  return getParticipants(state).filter((user) => {
    const last = lastThreadMessage(state, user.id, curator.id);
    return last?.fromUserId === user.id;
  }).length;
}

export function getStudentQuestionPreviews(state: AppState): Array<{
  user: User;
  lastMessage?: DirectMessage;
  waiting: boolean;
}> {
  const curator = getCurator(state);
  if (!curator) return [];

  return getParticipants(state)
    .map((user) => {
      const lastMessage = lastThreadMessage(state, user.id, curator.id);
      return {
        user,
        lastMessage,
        waiting: lastMessage?.fromUserId === user.id,
      };
    })
    .sort((a, b) => {
      if (a.waiting !== b.waiting) return a.waiting ? -1 : 1;
      return (b.lastMessage?.createdAt ?? "").localeCompare(a.lastMessage?.createdAt ?? "");
    });
}
