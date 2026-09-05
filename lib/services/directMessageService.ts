import { createId } from "../storage";
import type { AppState, DirectMessage, User } from "../types";
import { getParticipants, getUserById } from "./groupService";

export function getThread(
  state: AppState,
  userA: string,
  userB: string,
): DirectMessage[] {
  return state.directMessages
    .filter(
      (message) =>
        (message.fromUserId === userA && message.toUserId === userB) ||
        (message.fromUserId === userB && message.toUserId === userA),
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function addDirectMessage(
  state: AppState,
  fromUserId: string,
  toUserId: string,
  text: string,
): { state: AppState; message: DirectMessage } | { error: string } {
  const value = text.trim();
  if (!value) return { error: "Сообщение не может быть пустым." };
  if (fromUserId === toUserId) return { error: "Нельзя написать самому себе." };

  const message: DirectMessage = {
    id: createId("dm"),
    groupId: state.group.id,
    fromUserId,
    toUserId,
    text: value,
    createdAt: new Date().toISOString(),
  };

  return {
    state: { ...state, directMessages: [...state.directMessages, message] },
    message,
  };
}

export type DirectConversation = {
  participant: User;
  lastMessage?: DirectMessage;
  count: number;
};

/** Список переписок куратора: участники с хотя бы одним сообщением идут выше. */
export function getCuratorConversations(state: AppState): DirectConversation[] {
  const curatorId = state.group.curatorId;

  return getParticipants(state)
    .map((participant) => {
      const thread = getThread(state, curatorId, participant.id);
      return {
        participant,
        lastMessage: thread[thread.length - 1],
        count: thread.length,
      };
    })
    .sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return a.participant.name.localeCompare(b.participant.name, "ru");
    });
}

export function getCounterpart(state: AppState, message: DirectMessage, viewerId: string): User | undefined {
  const otherId = message.fromUserId === viewerId ? message.toUserId : message.fromUserId;
  return getUserById(state, otherId);
}
