"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { addDirectMessage, getThread } from "@/lib/services/directMessageService";
import { useAppStore } from "@/lib/store/app-store";
import type { User } from "@/lib/types";
import { cn, formatTime, toDative } from "@/lib/utils";

export function CuratorChatPanel({
  counterpart,
  emptyTitle,
  emptyDescription,
}: {
  counterpart: User;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const { state, currentUser, update } = useAppStore();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const messages =
    state && currentUser ? getThread(state, currentUser.id, counterpart.id) : [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!state || !currentUser) return null;

  const handleSend = () => {
    const result = addDirectMessage(state, currentUser.id, counterpart.id, draft);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    update(() => result.state);
    setDraft("");
    setError(null);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          messages.map((message) => {
            const mine = message.fromUserId === currentUser.id;

            return (
              <div key={message.id} className={cn("flex gap-2", mine && "justify-end")}>
                {!mine && (
                  <Avatar name={counterpart.name} emoji={counterpart.avatar} size="sm" />
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 ring-1 ring-inset",
                    mine
                      ? "bg-accent-soft text-accent-strong ring-accent/20"
                      : "bg-surface-muted ring-line",
                  )}
                >
                  <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{message.text}</p>
                  <span className="mt-1 block text-[11px] tabular-nums text-subtle">
                    {formatTime(message.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-line px-4 py-3">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Написать ${toDative(counterpart.name)}…`}
          rows={2}
          maxLength={400}
          aria-label={`Сообщение для ${toDative(counterpart.name)}`}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) handleSend();
          }}
        />
        {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[12px] text-muted">
            Отправить: <span className="font-medium">Ctrl/⌘ + Enter</span>
          </p>
          <Button size="sm" type="button" disabled={draft.trim().length < 2} onClick={handleSend}>
            <Send className="size-4" />
            Отправить
          </Button>
        </div>
      </div>
    </div>
  );
}
