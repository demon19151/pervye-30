"use client";

import { useState } from "react";
import { MessagesSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BotChat } from "@/components/bot-chat/bot-chat";

export function BotChatLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        aria-label="Открыть чат с ботом"
        onClick={() => setOpen(true)}
        className={[
          "fixed bottom-6 right-4 z-50 size-11 rounded-2xl px-0 py-0",
          "lg:bottom-8 lg:right-6",
        ].join(" ")}
      >
        <MessagesSquare className="size-5" />
      </Button>

      {open && (
        <div className="fixed bottom-6 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] lg:bottom-8 lg:right-6">
          <Card className="rounded-2xl border border-line bg-surface shadow-raised">
            <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">ИИ Помощник</p>
                <p className="truncate text-[12px] text-muted">Задавай вопросы про учёбу</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Закрыть
              </Button>
            </div>
            <BotChat className="min-h-[28rem] max-h-[70vh]" onClose={() => setOpen(false)} />
          </Card>
        </div>
      )}
    </>
  );
}

