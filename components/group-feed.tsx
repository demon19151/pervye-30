"use client";

import { useState } from "react";
import { MessagesSquare, Send } from "lucide-react";

import { MessageCard } from "@/components/message-card";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { addMessage, getMessages, toggleReaction } from "@/lib/services/messageService";
import { getUserById } from "@/lib/services/groupService";
import { useAppStore } from "@/lib/store/app-store";

export function GroupFeed({
  /** Сколько последних сообщений показывать. По умолчанию — все. */
  limit,
  description = "Последние сообщения участников и куратора.",
  className,
}: {
  limit?: number;
  description?: string;
  className?: string;
}) {
  const { state, currentUser, update } = useAppStore();
  const { toast } = useToast();
  const [draft, setDraft] = useState("");

  if (!state) return null;

  const all = getMessages(state);
  const messages = limit ? all.slice(-limit) : all;

  const handleSend = () => {
    if (!currentUser || !draft.trim()) return;

    update((current) => {
      const result = addMessage(current, currentUser.id, draft);
      return "error" in result ? current : result.state;
    });

    setDraft("");
    toast("Сообщение опубликовано");
  };

  const handleReact = (messageId: string, emoji: string) => {
    update((current) => toggleReaction(current, messageId, emoji));
  };

  return (
    <Card className={className}>
      <div className="p-5 sm:p-6">
        <CardHeader
          icon={<MessagesSquare className="size-5" />}
          title="Группа"
          description={description}
        />
      </div>

      <div className="max-h-[30rem] space-y-2.5 overflow-y-auto px-5 pb-5 no-scrollbar sm:px-6">
        {messages.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare className="size-5" />}
            title="Пока сообщений нет"
            description="Напиши первое — обычно с этого и начинается поддержка."
          />
        ) : (
          messages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              author={getUserById(state, message.userId)}
              isMine={message.userId === currentUser?.id}
              onReact={(emoji) => handleReact(message.id, emoji)}
            />
          ))
        )}
      </div>

      <div className="border-t border-line p-4 sm:p-5">
        {currentUser ? (
          <div className="flex items-end gap-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) handleSend();
              }}
              placeholder="Написать сообщение..."
              rows={1}
              maxLength={500}
              className="min-h-12 resize-none py-3.5"
              aria-label="Написать сообщение"
            />
            <Button
              onClick={handleSend}
              disabled={!draft.trim()}
              aria-label="Отправить сообщение"
              className="size-12 shrink-0 rounded-2xl px-0"
            >
              <Send className="size-5" />
            </Button>
          </div>
        ) : (
          <p className="text-center text-[13px] text-muted">
            Войдите в группу, чтобы писать сообщения.
          </p>
        )}
      </div>
    </Card>
  );
}
