import { createId } from "../storage";
import type { Announcement, AppState } from "../types";
import { addMessage } from "./messageService";

export function getAnnouncements(state: AppState): Announcement[] {
  return [...state.announcements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/**
 * Объявление куратора: сохраняется отдельным списком и одновременно
 * попадает в ленту группы, чтобы участники увидели его там, где и общаются.
 */
export function addAnnouncement(
  state: AppState,
  curatorId: string,
  text: string,
): { state: AppState } | { error: string } {
  const value = text.trim();
  if (value.length < 3) return { error: "Текст объявления слишком короткий." };

  const announcement: Announcement = {
    id: createId("a"),
    groupId: state.group.id,
    curatorId,
    text: value,
    createdAt: new Date().toISOString(),
  };

  const withAnnouncement: AppState = {
    ...state,
    announcements: [...state.announcements, announcement],
  };

  const result = addMessage(withAnnouncement, curatorId, `📢 ${value}`);
  if ("error" in result) return { state: withAnnouncement };

  return { state: result.state };
}
