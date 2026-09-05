"use client";

import { useEffect, useRef, useState } from "react";
import { HeartHandshake, Send } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { addDirectMessage, getThread } from "@/lib/services/directMessageService";
import { useAppStore } from "@/lib/store/app-store";
import type { User } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";

export function DirectThread({
  counterpart,
  title,
  description,
  className,
}: {
  counterpart: User;
  title?: string;
  description?: string;
  className?: string;
}) {
  const { state, currentUser, update } = useAppStore();
  const { toast } = useToast();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const thread = state && currentUser ? getThread(state, currentUser.id, counterpart.id) : [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread.length]);

  if (!state || !currentUser) return null;

  const handleSend = () => {
    if (!draft.trim()) return;

    update((current) => {
      const result = addDirectMessage(current, currentUser.id, counterpart.id, draft);
      return "error" in result ? current : result.state;
    });

    setDraft("");
    toast("Сообщение отправлено");
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="p-5 sm:p-6">
        <CardHeader
          icon={<HeartHandshake className="size-5" />}
          title={title ?? counterpart.name}
          description={description ?? "Личная переписка — группа её не видит."}
        />
      </div>

      <div className="max-h-[30rem] min-h-64 flex-1 space-y-2.5 overflow-y-auto px-5 pb-5 no-scrollbar sm:px-6">
        {thread.length === 0 ? (
          <EmptyState
            icon={<HeartHandshake className="size-5" />}
            title="Пока тишина"
            description="Напишите первое сообщение — оно останется только между вами."
          />
        ) : (
          thread.map((message) => {
            const mine = message.fromUserId === currentUser.id;

            return (
              <div key={message.id} className={cn("flex gap-2.5", mine && "flex-row-reverse")}>
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
                  <p className="text-[15px] leading-relaxed break-words">{message.text}</p>
                  <time
                    className={cn(
                      "mt-1 block text-[11px] tabular-nums",
                      mine ? "text-accent/70" : "text-subtle",
                    )}
                    dateTime={message.createdAt}
                  >
                    {formatTime(message.createdAt)}
                  </time>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-line p-4 sm:p-5">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) handleSend();
            }}
            placeholder="Написать лично..."
            rows={1}
            maxLength={500}
            className="min-h-12 resize-none py-3.5"
            aria-label="Личное сообщение"
          />
          <Button
            onClick={handleSend}
            disabled={!draft.trim()}
            aria-label="Отправить личное сообщение"
            className="size-12 shrink-0 rounded-2xl px-0"
          >
            <Send className="size-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
