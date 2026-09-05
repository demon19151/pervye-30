"use client";

import { Avatar } from "@/components/ui/avatar";
import { reactionEmojis } from "@/lib/services/messageService";
import type { Message, User } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";

export function MessageCard({
  message,
  author,
  isMine,
  onReact,
}: {
  message: Message;
  author?: User;
  isMine: boolean;
  onReact: (emoji: string) => void;
}) {
  const mine = message.myReactions ?? [];
  const isAnnouncement = message.text.startsWith("📢");

  return (
    <article
      className={cn(
        "rounded-2xl px-4 py-3.5 ring-1 ring-inset transition-colors",
        isAnnouncement
          ? "bg-accent-soft/70 ring-accent/20"
          : isMine
            ? "bg-surface-muted ring-line"
            : "bg-surface ring-line",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar name={author?.name ?? "?"} emoji={author?.avatar} size="sm" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold">{author?.name ?? "Участник"}</span>
            {author?.role === "curator" && (
              <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-accent-strong uppercase">
                куратор
              </span>
            )}
            {isMine && <span className="text-[11px] text-subtle">это ты</span>}
            <time className="ml-auto text-xs text-subtle tabular-nums" dateTime={message.createdAt}>
              {formatTime(message.createdAt)}
            </time>
          </div>

          <p className="mt-1 text-[15px] leading-relaxed break-words">{message.text}</p>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {reactionEmojis.map((emoji) => {
              const count = message.reactions[emoji] ?? 0;
              const active = mine.includes(emoji);

              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReact(emoji)}
                  aria-pressed={active}
                  aria-label={`Поддержать реакцией ${emoji}`}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-1 text-xs ring-1 ring-inset transition-all duration-150",
                    active
                      ? "bg-accent-soft text-accent-strong ring-accent/30"
                      : count > 0
                        ? "bg-surface-muted text-muted ring-line hover:ring-accent-ring"
                        : "bg-transparent text-subtle ring-transparent hover:bg-surface-muted hover:ring-line",
                  )}
                >
                  <span className="leading-none">{emoji}</span>
                  {count > 0 && <span className="tabular-nums">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </article>
  );
}
