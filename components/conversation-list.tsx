"use client";

import { Avatar } from "@/components/ui/avatar";
import type { DirectConversation } from "@/lib/services/directMessageService";
import { cn, formatRelativeTime } from "@/lib/utils";

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: DirectConversation[];
  selectedId?: string;
  onSelect: (userId: string) => void;
}) {
  return (
    <ul className="space-y-1.5">
      {conversations.map((item) => {
        const active = selectedId === item.participant.id;
        const preview = item.lastMessage?.text ?? "Пока нет сообщений";

        return (
          <li key={item.participant.id}>
            <button
              type="button"
              onClick={() => onSelect(item.participant.id)}
              aria-pressed={active}
              className={cn(
                "flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                active
                  ? "bg-accent-soft ring-1 ring-inset ring-accent/25"
                  : "hover:bg-surface-muted",
              )}
            >
              <Avatar name={item.participant.name} emoji={item.participant.avatar} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{item.participant.name}</span>
                  {item.lastMessage && (
                    <span className="shrink-0 text-[11px] text-subtle">
                      {formatRelativeTime(item.lastMessage.createdAt)}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 line-clamp-2 text-[13px] text-muted">{preview}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
