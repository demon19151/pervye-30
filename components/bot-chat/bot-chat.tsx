"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type SourceItem = {
  n: number;
  title: string;
  heading: string | null;
  category: string;
  url: string | null;
  snippet: string;
};

type ServerEvent =
  | { type: "sources"; sources: SourceItem[]; confidence: number }
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

function clampText(s: string, max = 10_000) {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

export function BotChat({
  className,
}: {
  onClose?: () => void;
  className?: string;
}) {
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Привет! Я ИИ Помощник. Задавай вопросы про учёбу (ИРИТ-РТФ / УрФУ) — отвечу по базе знаний.",
    },
  ]);

  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const canSend = useMemo(
    () => !isLoading && question.trim().length > 0 && question.trim().length <= 1000,
    [isLoading, question],
  );

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function onSend() {
    if (!canSend) return;

    const q = question.trim();
    setQuestion("");

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: clampText(q) },
      { role: "assistant", content: "" },
    ];
    setMessages(nextMessages);

    setIsLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/bot-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const detail = await response.text().catch(() => "");
        throw new Error(`API ${response.status}: ${detail.slice(0, 300)}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const assistantIndex = nextMessages.length - 1;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;

          let event: ServerEvent;
          try {
            event = JSON.parse(line) as ServerEvent;
          } catch {
            continue;
          }

          if (event.type === "sources") {
            // Источники пользователю не показываем: блок UI удалён.
            continue;
          }

          if (event.type === "delta") {
            setMessages((prev) => {
              const copy = prev.slice();
              const current = copy[assistantIndex]?.content ?? "";
              copy[assistantIndex] = { ...copy[assistantIndex], content: current + event.text };
              return copy;
            });
            continue;
          }

          if (event.type === "error") {
            setMessages((prev) => {
              const copy = prev.slice();
              copy[assistantIndex] = {
                role: "assistant",
                content: `Ошибка: ${event.message}`,
              };
              return copy;
            });
            setIsLoading(false);
            abortRef.current = null;
            return;
          }

          if (event.type === "done") {
            setIsLoading(false);
            abortRef.current = null;
            return;
          }
        }
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      const msg =
        error instanceof Error ? error.message : "Не удалось получить ответ от бота.";
      toast(msg, "warning");
      setMessages((prev) => {
        const copy = prev.slice();
        const assistantIndex = copy.length - 1;
        copy[assistantIndex] = {
          role: "assistant",
          content: `Не удалось получить ответ: ${msg}`,
        };
        return copy;
      });
      setIsLoading(false);
    }
  }

  function onStop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="flex-1 min-h-0 space-y-3 overflow-y-auto px-3 pt-3">
        {messages.map((m, idx) => {
          const mine = m.role === "user";
          return (
            <div key={`${m.role}-${idx}`} className={mine ? "flex justify-end" : "flex justify-start"}>
              <div
                className={[
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 ring-1 ring-inset",
                  mine ? "bg-accent-soft text-accent-strong ring-accent/20" : "bg-surface-muted ring-line",
                ].join(" ")}
              >
                <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{m.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 border-t border-line px-3 py-3">
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Задайте вопрос про учёбу или университет..."
          rows={2}
          maxLength={1000}
          aria-label="Вопрос в боте"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void onSend();
          }}
        />

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[12px] text-muted">
            Отправить: <span className="font-medium">Ctrl/⌘ + Enter</span>
          </p>

          <div className="flex items-center gap-2">
            <Button size="sm" type="button" variant="outline" disabled={!isLoading} onClick={onStop}>
              Стоп
            </Button>
            <Button
              size="sm"
              type="button"
              disabled={!canSend}
              onClick={() => void onSend()}
            >
              Спросить
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

