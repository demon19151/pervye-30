"use client";

import { useState } from "react";
import { MessageCircleQuestion } from "lucide-react";

import { CuratorChatPanel } from "@/components/curator-chat-panel";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { getStudentQuestionPreviews } from "@/lib/services/directMessageService";
import { useAppStore } from "@/lib/store/app-store";
import { cn, formatRelativeTime } from "@/lib/utils";

export default function CuratorQuestionsPage() {
  return (
    <AppShell role="curator">
      <CuratorQuestions />
    </AppShell>
  );
}

function CuratorQuestions() {
  const { state } = useAppStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!state) return null;

  const previews = getStudentQuestionPreviews(state);
  const activeId =
    selectedId ?? previews.find((item) => item.waiting)?.user.id ?? previews[0]?.user.id;
  const selected = previews.find((item) => item.user.id === activeId);
  const waitingCount = previews.filter((item) => item.waiting).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Вопросы"
        subtitle="Личные сообщения участников. Ответьте здесь — студент увидит ответ во вкладке «Задать вопрос»."
        action={
          waitingCount > 0 ? (
            <Badge tone="warning">
              {waitingCount} ждут ответа
            </Badge>
          ) : undefined
        }
      />

      {previews.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={<MessageCircleQuestion className="size-5" />}
            title="Пока некому писать"
            description="Когда участники присоединятся, их вопросы появятся здесь."
          />
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <Card className="overflow-hidden">
            <ul className="divide-y divide-line">
              {previews.map((item) => {
                const active = item.user.id === activeId;

                return (
                  <li key={item.user.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.user.id)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                        active ? "bg-accent-soft" : "hover:bg-surface-muted",
                      )}
                    >
                      <Avatar name={item.user.name} emoji={item.user.avatar} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold">{item.user.name}</p>
                          {item.waiting && <span className="size-2 shrink-0 rounded-full bg-warning" />}
                        </div>
                        <p className="mt-0.5 truncate text-[13px] text-muted">
                          {item.lastMessage?.text ?? "Ещё не писал"}
                        </p>
                        {item.lastMessage && (
                          <p className="mt-0.5 text-[11px] text-subtle">
                            {formatRelativeTime(item.lastMessage.createdAt)}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="flex h-[32rem] flex-col overflow-hidden lg:h-[36rem]">
            {selected ? (
              <>
                <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                  <Avatar name={selected.user.name} emoji={selected.user.avatar} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{selected.user.name}</p>
                    <p className="truncate text-[12px] text-muted">
                      {selected.waiting ? "Ждёт ответа" : "Переписка"}
                    </p>
                  </div>
                </div>
                <CuratorChatPanel
                  counterpart={selected.user}
                  emptyTitle="Начните переписку"
                  emptyDescription="Напишите участнику — сообщение придёт только ему, во вкладке «Задать вопрос»."
                />
              </>
            ) : (
              <div className="flex flex-1 items-center p-4">
                <EmptyState
                  title="Выберите участника"
                  description="Слева список группы. Сначала те, кто ждёт ответа."
                />
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
