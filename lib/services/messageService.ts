import { createId } from "../storage";
import type { AppState, Message } from "../types";

/** Набор реакций поддержки, доступных в ленте группы. */
export const reactionEmojis = ["❤️", "👏", "🔥", "👍"] as const;

export type ReactionEmoji = (typeof reactionEmojis)[number];

export function getMessages(state: AppState): Message[] {
  return [...state.messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function addMessage(
  state: AppState,
  userId: string,
  text: string,
): { state: AppState } | { error: string } {
  const value = text.trim();
  if (!value) return { error: "Сообщение не может быть пустым." };

  const message: Message = {
    id: createId("m"),
    groupId: state.group.id,
    userId,
    text: value,
    createdAt: new Date().toISOString(),
    reactions: {},
    myReactions: [],
  };

  return { state: { ...state, messages: [...state.messages, message] } };
}

/** Ставит или снимает реакцию текущего пользователя. */
export function toggleReaction(state: AppState, messageId: string, emoji: string): AppState {
  return {
    ...state,
    messages: state.messages.map((message) => {
      if (message.id !== messageId) return message;

      const mine = message.myReactions ?? [];
      const alreadyReacted = mine.includes(emoji);
      const count = message.reactions[emoji] ?? 0;
      const nextCount = alreadyReacted ? count - 1 : count + 1;

      const reactions = { ...message.reactions };
      if (nextCount > 0) reactions[emoji] = nextCount;
      else delete reactions[emoji];

      return {
        ...message,
        reactions,
        myReactions: alreadyReacted ? mine.filter((item) => item !== emoji) : [...mine, emoji],
      };
    }),
  };
}

